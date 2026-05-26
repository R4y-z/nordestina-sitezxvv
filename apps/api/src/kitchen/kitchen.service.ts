import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class KitchenService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async getKitchenOrders() {
    return this.prisma.order.findMany({
      where: {
        status: { in: ['CONFIRMED', 'PREPARING'] },
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, preparationTime: true, image: true } },
            addons: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        table: { select: { number: true, name: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async startPreparing(orderId: string) {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'PREPARING', preparingAt: new Date() },
      include: { items: { include: { product: true } }, table: true },
    });
    this.eventEmitter.emit('order.preparing', order);
    return order;
  }

  async markReady(orderId: string) {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'READY', readyAt: new Date() },
      include: { items: true, table: true },
    });
    this.eventEmitter.emit('order.ready', order);
    return order;
  }

  async markItemReady(itemId: string) {
    return this.prisma.orderItem.update({
      where: { id: itemId },
      data: { sentToKitchen: true },
    });
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [preparing, ready, completedToday] = await Promise.all([
      this.prisma.order.count({ where: { status: 'PREPARING' } }),
      this.prisma.order.count({ where: { status: 'READY' } }),
      this.prisma.order.count({ where: { status: 'DELIVERED', deliveredAt: { gte: today } } }),
    ]);

    return { preparing, ready, completedToday };
  }
}
