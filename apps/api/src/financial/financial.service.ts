import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinancialService {
  constructor(private prisma: PrismaService) {}

  async getFinancialSummary(from: string, to: string) {
    const start = new Date(from);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);

    const [revenue, expenses, paymentsByMethod] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { status: 'PAID', paidAt: { gte: start, lte: end } },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.expense.aggregate({
        where: { date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      this.prisma.payment.groupBy({
        by: ['method'],
        where: { status: 'PAID', paidAt: { gte: start, lte: end } },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    const totalRevenue = revenue._sum.amount || 0;
    const totalExpenses = expenses._sum.amount || 0;
    const profit = totalRevenue - totalExpenses;

    return {
      revenue: totalRevenue,
      expenses: totalExpenses,
      profit,
      margin: totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : 0,
      orders: revenue._count.id,
      paymentsByMethod: paymentsByMethod.map(p => ({
        method: p.method,
        amount: p._sum.amount || 0,
        count: p._count.id,
      })),
    };
  }

  async getExpenses(query: { from?: string; to?: string; category?: string }) {
    const where: any = {};
    if (query.from) where.date = { gte: new Date(query.from) };
    if (query.to) where.date = { ...where.date, lte: new Date(query.to) };
    if (query.category) where.category = query.category;

    return this.prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  async createExpense(dto: any) {
    return this.prisma.expense.create({ data: dto });
  }

  async updateExpense(id: string, dto: any) {
    return this.prisma.expense.update({ where: { id }, data: dto });
  }

  async deleteExpense(id: string) {
    return this.prisma.expense.delete({ where: { id } });
  }

  async getTransactions(query: { from?: string; to?: string; type?: string }) {
    const where: any = {};
    if (query.from) where.date = { gte: new Date(query.from) };
    if (query.to) where.date = { ...where.date, lte: new Date(query.to) };
    if (query.type) where.type = query.type;

    return this.prisma.financialTransaction.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  async getDailyCashFlow(days: number = 30) {
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const [revenue, expenses] = await Promise.all([
        this.prisma.payment.aggregate({
          where: { status: 'PAID', paidAt: { gte: date, lt: nextDay } },
          _sum: { amount: true },
        }),
        this.prisma.expense.aggregate({
          where: { date: { gte: date, lt: nextDay } },
          _sum: { amount: true },
        }),
      ]);

      data.push({
        date: date.toISOString().slice(0, 10),
        revenue: revenue._sum.amount || 0,
        expenses: expenses._sum.amount || 0,
        profit: (revenue._sum.amount || 0) - (expenses._sum.amount || 0),
      });
    }
    return data;
  }
}
