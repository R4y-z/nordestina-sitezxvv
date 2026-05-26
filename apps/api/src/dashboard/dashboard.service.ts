import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      todayOrders,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      activeOrders,
      occupiedTables,
      pendingDeliveries,
      kitchenOrders,
    ] = await Promise.all([
      this.prisma.order.count({ where: { createdAt: { gte: today }, status: { not: 'CANCELLED' } } }),
      this.prisma.payment.aggregate({
        where: { status: 'PAID', paidAt: { gte: today } },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'PAID', paidAt: { gte: weekStart } },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'PAID', paidAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
      this.prisma.order.count({ where: { status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] } } }),
      this.prisma.table.count({ where: { status: 'OCCUPIED' } }),
      this.prisma.delivery.count({ where: { status: { in: ['WAITING', 'ASSIGNED', 'ON_THE_WAY'] } } }),
      this.prisma.order.count({ where: { status: { in: ['CONFIRMED', 'PREPARING'] } } }),
    ]);

    const todayRevenueVal = todayRevenue._sum.amount || 0;
    const avgTicket = todayOrders > 0 ? todayRevenueVal / todayOrders : 0;

    return {
      today: {
        orders: todayOrders,
        revenue: todayRevenueVal,
        avgTicket,
      },
      week: { revenue: weekRevenue._sum.amount || 0 },
      month: { revenue: monthRevenue._sum.amount || 0 },
      live: {
        activeOrders,
        occupiedTables,
        pendingDeliveries,
        kitchenOrders,
      },
    };
  }

  async getRevenueChart(days: number = 7) {
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const [revenue, orders] = await Promise.all([
        this.prisma.payment.aggregate({
          where: { status: 'PAID', paidAt: { gte: date, lt: nextDay } },
          _sum: { amount: true },
        }),
        this.prisma.order.count({
          where: { status: { not: 'CANCELLED' }, createdAt: { gte: date, lt: nextDay } },
        }),
      ]);

      data.push({
        date: date.toISOString().slice(0, 10),
        day: date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }),
        revenue: revenue._sum.amount || 0,
        orders,
      });
    }
    return data;
  }

  async getTopProducts(limit: number = 10, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const items = await this.prisma.orderItem.groupBy({
      by: ['productId', 'name'],
      where: {
        order: { status: { not: 'CANCELLED' }, createdAt: { gte: since } },
        productId: { not: null },
      },
      _sum: { quantity: true },
      _count: { id: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    return items.map(i => ({
      productId: i.productId,
      name: i.name,
      quantity: i._sum.quantity || 0,
      orders: i._count.id,
    }));
  }

  async getOrdersByType() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const byType = await this.prisma.order.groupBy({
      by: ['type'],
      where: { createdAt: { gte: today }, status: { not: 'CANCELLED' } },
      _count: { id: true },
      _sum: { total: true },
    });

    return byType.map(t => ({
      type: t.type,
      count: t._count.id,
      revenue: t._sum.total || 0,
    }));
  }

  async getOrdersByStatus() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const byStatus = await this.prisma.order.groupBy({
      by: ['status'],
      where: { createdAt: { gte: today } },
      _count: { id: true },
    });

    return byStatus.map(s => ({ status: s.status, count: s._count.id }));
  }

  async getRecentOrders(limit: number = 10) {
    return this.prisma.order.findMany({
      take: limit,
      include: {
        customer: { select: { name: true } },
        table: { select: { number: true } },
        items: { select: { name: true, quantity: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
