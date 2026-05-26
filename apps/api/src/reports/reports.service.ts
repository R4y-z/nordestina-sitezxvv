import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getSalesReport(from: string, to: string) {
    const start = new Date(from);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);

    const orders = await this.prisma.order.findMany({
      where: { status: { not: 'CANCELLED' }, createdAt: { gte: start, lte: end } },
      include: {
        items: { include: { product: { select: { name: true, category: { select: { name: true } } } } } },
        payments: { where: { status: 'PAID' } },
        table: { select: { number: true } },
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const summary = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((s, o) => s + o.total, 0),
      avgTicket: orders.length > 0 ? orders.reduce((s, o) => s + o.total, 0) / orders.length : 0,
      byType: {} as any,
      byPaymentMethod: {} as any,
    };

    orders.forEach(order => {
      summary.byType[order.type] = (summary.byType[order.type] || 0) + 1;
      order.payments.forEach(p => {
        summary.byPaymentMethod[p.method] = (summary.byPaymentMethod[p.method] || 0) + p.amount;
      });
    });

    return { summary, orders };
  }

  async getProductsReport(from: string, to: string) {
    const start = new Date(from);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);

    return this.prisma.orderItem.groupBy({
      by: ['productId', 'name'],
      where: {
        order: { status: { not: 'CANCELLED' }, createdAt: { gte: start, lte: end } },
      },
      _sum: { quantity: true },
      _count: { id: true },
      orderBy: { _sum: { quantity: 'desc' } },
    });
  }

  async getDeliveryReport(from: string, to: string) {
    const start = new Date(from);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);

    const [deliveries, stats] = await Promise.all([
      this.prisma.delivery.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: {
          order: { select: { total: true, orderNumber: true } },
          deliverer: { select: { name: true } },
        },
      }),
      this.prisma.delivery.groupBy({
        by: ['status'],
        where: { createdAt: { gte: start, lte: end } },
        _count: { id: true },
      }),
    ]);

    return {
      deliveries,
      byStatus: stats.map(s => ({ status: s.status, count: s._count.id })),
      totalFee: deliveries.reduce((s, d) => s + d.fee, 0),
    };
  }

  async getEmployeesReport(from: string, to: string) {
    const start = new Date(from);
    const end = new Date(to);

    const users = await this.prisma.user.findMany({
      where: { role: { not: 'ADMIN' } },
      include: {
        orders: {
          where: { createdAt: { gte: start, lte: end } },
          select: { id: true, total: true, type: true },
        },
        cashierSessions: {
          where: { openedAt: { gte: start, lte: end } },
          select: { id: true, totalSales: true, openedAt: true, closedAt: true },
        },
      },
    });

    return users.map(u => ({
      id: u.id,
      name: u.name,
      role: u.role,
      ordersCreated: u.orders.length,
      totalSales: u.orders.reduce((s, o) => s + o.total, 0),
      cashierSessions: u.cashierSessions.length,
    }));
  }
}
