import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { status?: string; date?: string }) {
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.date) {
      const start = new Date(query.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(query.date);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { gte: start, lte: end };
    }

    return this.prisma.delivery.findMany({
      where,
      include: {
        order: {
          include: {
            customer: { select: { name: true, phone: true } },
            items: { include: { product: { select: { name: true } } } },
            payments: true,
          },
        },
        deliverer: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async assignDeliverer(deliveryId: string, delivererId: string) {
    return this.prisma.delivery.update({
      where: { id: deliveryId },
      data: { delivererId, status: 'ASSIGNED', assignedAt: new Date() },
      include: { deliverer: { select: { name: true } } },
    });
  }

  async updateStatus(deliveryId: string, status: string) {
    const data: any = { status };
    if (status === 'PICKING_UP') data.pickedAt = new Date();
    if (status === 'DELIVERED') data.deliveredAt = new Date();

    return this.prisma.delivery.update({
      where: { id: deliveryId },
      data,
    });
  }

  // ====== BAIRROS E TAXAS ======
  async findAllNeighborhoods(active?: boolean) {
    return this.prisma.deliveryNeighborhood.findMany({
      where: active !== undefined ? { active } : {},
      orderBy: { name: 'asc' },
    });
  }

  async createNeighborhood(dto: any) {
    return this.prisma.deliveryNeighborhood.create({ data: dto });
  }

  async updateNeighborhood(id: string, dto: any) {
    return this.prisma.deliveryNeighborhood.update({ where: { id }, data: dto });
  }

  async deleteNeighborhood(id: string) {
    return this.prisma.deliveryNeighborhood.delete({ where: { id } });
  }

  async calculateDeliveryFee(neighborhood: string) {
    const nb = await this.prisma.deliveryNeighborhood.findFirst({
      where: { name: { contains: neighborhood, mode: 'insensitive' }, active: true },
    });
    if (!nb) return { fee: null, available: false, message: 'Bairro fora da área de entrega' };
    return { fee: nb.fee, available: true, minTime: nb.minTime, maxTime: nb.maxTime };
  }

  async getDeliverers() {
    return this.prisma.user.findMany({
      where: { role: 'DELIVERY', active: true },
      select: { id: true, name: true, phone: true },
    });
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [waiting, onTheWay, deliveredToday, total] = await Promise.all([
      this.prisma.delivery.count({ where: { status: 'WAITING' } }),
      this.prisma.delivery.count({ where: { status: 'ON_THE_WAY' } }),
      this.prisma.delivery.count({ where: { status: 'DELIVERED', deliveredAt: { gte: today } } }),
      this.prisma.delivery.count({ where: { createdAt: { gte: today } } }),
    ]);

    return { waiting, onTheWay, deliveredToday, total };
  }
}
