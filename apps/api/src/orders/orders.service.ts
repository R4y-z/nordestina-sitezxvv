import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderStatus, OrderType } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  private generateOrderNumber(): string {
    const now = new Date();
    const date = now.toISOString().slice(2, 10).replace(/-/g, '');
    const time = String(now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()).padStart(6, '0');
    return `#${date}${time}`.slice(0, 8);
  }

  async findAll(query: {
    status?: string;
    type?: string;
    tableId?: string;
    date?: string;
    page?: string;
    limit?: string;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const where: any = {};

    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.tableId) where.tableId = query.tableId;
    if (query.date) {
      const start = new Date(query.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(query.date);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { gte: start, lte: end };
    }

    const [total, items] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: {
          items: { include: { product: { select: { id: true, name: true, image: true } }, addons: true } },
          table: { select: { id: true, number: true, name: true } },
          customer: { select: { id: true, name: true, phone: true } },
          payments: true,
          delivery: { include: { deliverer: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true, addons: { include: { addon: true } }, combo: true } },
        table: true,
        customer: { include: { addresses: true } },
        payments: true,
        delivery: { include: { deliverer: true } },
        createdBy: { select: { id: true, name: true } },
        coupon: true,
      },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');
    return order;
  }

  async create(dto: any, userId?: string) {
    const orderNumber = this.generateOrderNumber();

    // Calcular subtotal
    let subtotal = 0;
    const processedItems = await Promise.all(
      dto.items.map(async (item: any) => {
        let price = item.price;
        if (!price && item.productId) {
          const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
          price = product?.promotionalPrice || product?.price || 0;
        }
        const addonsTotal = (item.addons || []).reduce((sum: number, a: any) => sum + (a.price * (a.quantity || 1)), 0);
        const itemTotal = (price + addonsTotal) * item.quantity;
        subtotal += itemTotal;
        return { ...item, price };
      }),
    );

    // Desconto de cupom
    let discount = dto.discount || 0;
    if (dto.couponCode) {
      const coupon = await this.prisma.coupon.findFirst({
        where: { code: dto.couponCode, active: true },
      });
      if (coupon) {
        discount = coupon.discountType === 'PERCENT'
          ? (subtotal * coupon.discountValue) / 100
          : coupon.discountValue;
      }
    }

    const deliveryFee = dto.deliveryFee || 0;
    const serviceFee = dto.type === OrderType.TABLE ? subtotal * 0.10 : 0;
    const total = subtotal - discount + deliveryFee + serviceFee;

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        type: dto.type,
        tableId: dto.tableId,
        customerId: dto.customerId,
        createdById: userId,
        subtotal,
        discount,
        deliveryFee,
        serviceFee,
        total,
        notes: dto.notes,
        deliveryAddress: dto.deliveryAddress,
        deliveryNeighborhood: dto.deliveryNeighborhood,
        deliveryCity: dto.deliveryCity,
        deliveryZipCode: dto.deliveryZipCode,
        estimatedTime: dto.estimatedTime,
        items: {
          create: processedItems.map((item: any) => ({
            productId: item.productId,
            comboId: item.comboId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            notes: item.notes,
            addons: item.addons?.length ? {
              create: item.addons.map((a: any) => ({
                addonId: a.addonId,
                name: a.name,
                price: a.price,
                quantity: a.quantity || 1,
              })),
            } : undefined,
          })),
        },
      },
      include: {
        items: { include: { addons: true } },
        table: true,
        customer: true,
      },
    });

    // Atualizar status da mesa
    if (dto.tableId) {
      await this.prisma.table.update({ where: { id: dto.tableId }, data: { status: 'OCCUPIED' } });
    }

    // Criar registro de delivery se necessário
    if (dto.type === OrderType.DELIVERY) {
      await this.prisma.delivery.create({
        data: {
          orderId: order.id,
          neighborhood: dto.deliveryNeighborhood,
          fee: deliveryFee,
          estimatedTime: dto.estimatedTime,
        },
      });
    }

    this.eventEmitter.emit('order.created', order);
    return order;
  }

  async addItems(orderId: string, items: any[]) {
    const order = await this.findOne(orderId);
    if ([OrderStatus.CANCELLED, OrderStatus.DELIVERED].includes(order.status as any)) {
      throw new BadRequestException('Não é possível adicionar itens neste pedido');
    }

    const newItems = await Promise.all(
      items.map(async (item: any) => {
        let price = item.price;
        if (!price && item.productId) {
          const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
          price = product?.promotionalPrice || product?.price || 0;
        }
        return this.prisma.orderItem.create({
          data: {
            orderId,
            productId: item.productId,
            name: item.name,
            price,
            quantity: item.quantity,
            notes: item.notes,
            addons: item.addons?.length ? {
              create: item.addons.map((a: any) => ({ addonId: a.addonId, name: a.name, price: a.price, quantity: a.quantity || 1 })),
            } : undefined,
          },
          include: { addons: true },
        });
      }),
    );

    await this.recalculateOrderTotal(orderId);
    this.eventEmitter.emit('order.itemsAdded', { orderId, items: newItems });
    return this.findOne(orderId);
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.findOne(id);
    const now = new Date();
    const timestamps: any = {};

    if (status === OrderStatus.CONFIRMED) timestamps.confirmedAt = now;
    if (status === OrderStatus.PREPARING) timestamps.preparingAt = now;
    if (status === OrderStatus.READY) timestamps.readyAt = now;
    if (status === OrderStatus.DELIVERED) { timestamps.deliveredAt = now; }
    if (status === OrderStatus.CANCELLED) timestamps.cancelledAt = now;

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status, ...timestamps },
      include: { table: true, delivery: true },
    });

    // Liberar mesa quando entregue ou cancelado
    if ((status === OrderStatus.DELIVERED || status === OrderStatus.CANCELLED) && order.tableId) {
      const activeOrders = await this.prisma.order.count({
        where: { tableId: order.tableId, status: { notIn: [OrderStatus.DELIVERED, OrderStatus.CANCELLED] } },
      });
      if (activeOrders === 0) {
        await this.prisma.table.update({ where: { id: order.tableId }, data: { status: 'AVAILABLE' } });
      }
    }

    // Atualizar status do delivery
    if (status === OrderStatus.DELIVERING && updated.delivery) {
      await this.prisma.delivery.update({ where: { orderId: id }, data: { status: 'ON_THE_WAY', pickedAt: now } });
    }
    if (status === OrderStatus.DELIVERED && updated.delivery) {
      await this.prisma.delivery.update({ where: { orderId: id }, data: { status: 'DELIVERED', deliveredAt: now } });
    }

    this.eventEmitter.emit('order.statusChanged', { order: updated, status });
    return updated;
  }

  async cancel(id: string, _reason?: string) {
    return this.updateStatus(id, OrderStatus.CANCELLED);
  }

  private async recalculateOrderTotal(orderId: string) {
    const items = await this.prisma.orderItem.findMany({
      where: { orderId },
      include: { addons: true },
    });
    const subtotal = items.reduce((sum, item) => {
      const addonsTotal = item.addons.reduce((s, a) => s + a.price * a.quantity, 0);
      return sum + (item.price + addonsTotal) * item.quantity;
    }, 0);

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    const total = subtotal - (order?.discount || 0) + (order?.deliveryFee || 0) + (order?.serviceFee || 0);

    await this.prisma.order.update({ where: { id: orderId }, data: { subtotal, total } });
  }

  async updateItem(orderId: string, itemId: string, dto: { quantity?: number; notes?: string }) {
    const order = await this.findOne(orderId);
    if ([OrderStatus.CANCELLED, OrderStatus.DELIVERED].includes(order.status as any)) {
      throw new BadRequestException('Não é possível editar itens deste pedido');
    }

    const item = await this.prisma.orderItem.findFirst({ where: { id: itemId, orderId } });
    if (!item) throw new NotFoundException('Item não encontrado no pedido');

    if (dto.quantity !== undefined && dto.quantity <= 0) {
      return this.removeItem(orderId, itemId);
    }

    await this.prisma.orderItem.update({
      where: { id: itemId },
      data: {
        ...(dto.quantity !== undefined && { quantity: dto.quantity }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });

    await this.recalculateOrderTotal(orderId);
    return this.findOne(orderId);
  }

  async removeItem(orderId: string, itemId: string) {
    const order = await this.findOne(orderId);
    if ([OrderStatus.CANCELLED, OrderStatus.DELIVERED].includes(order.status as any)) {
      throw new BadRequestException('Não é possível remover itens deste pedido');
    }

    const item = await this.prisma.orderItem.findFirst({ where: { id: itemId, orderId } });
    if (!item) throw new NotFoundException('Item não encontrado no pedido');

    // Remove addons do item antes de deletar (integridade referencial)
    await this.prisma.orderItemAddon.deleteMany({ where: { orderItemId: itemId } });
    await this.prisma.orderItem.delete({ where: { id: itemId } });

    await this.recalculateOrderTotal(orderId);
    return this.findOne(orderId);
  }

  async getActiveOrders() {
    return this.prisma.order.findMany({
      where: { status: { notIn: [OrderStatus.DELIVERED, OrderStatus.CANCELLED] } },
      include: {
        items: { include: { product: { select: { name: true } } } },
        table: { select: { number: true, name: true } },
        customer: { select: { name: true, phone: true } },
        delivery: { select: { status: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
