import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

@Injectable()
export class CashierService {
  constructor(private prisma: PrismaService) {}

  async openSession(userId: string, openingAmount: number) {
    const activeSession = await this.prisma.cashierSession.findFirst({
      where: { userId, closedAt: null },
    });
    if (activeSession) throw new BadRequestException('Já existe uma sessão de caixa aberta');

    return this.prisma.cashierSession.create({
      data: { userId, openingAmount },
      include: { user: { select: { name: true } } },
    });
  }

  async closeSession(sessionId: string, closingAmount: number, notes?: string) {
    const session = await this.prisma.cashierSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Sessão não encontrada');
    if (session.closedAt) throw new BadRequestException('Sessão já foi fechada');

    const payments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.PAID,
        createdAt: { gte: session.openedAt },
      },
    });

    const totals = payments.reduce((acc, p) => {
      acc.total += p.amount;
      if (p.method === PaymentMethod.CASH) acc.cash += p.amount;
      if (p.method === PaymentMethod.PIX) acc.pix += p.amount;
      if (p.method === PaymentMethod.CREDIT_CARD || p.method === PaymentMethod.DEBIT_CARD) acc.card += p.amount;
      return acc;
    }, { total: 0, cash: 0, pix: 0, card: 0 });

    return this.prisma.cashierSession.update({
      where: { id: sessionId },
      data: {
        closedAt: new Date(),
        closingAmount,
        totalSales: totals.total,
        totalCash: totals.cash,
        totalPix: totals.pix,
        totalCard: totals.card,
        notes,
      },
    });
  }

  async registerBleed(sessionId: string, amount: number, reason: string) {
    const session = await this.prisma.cashierSession.findUnique({ where: { id: sessionId } });
    if (!session || session.closedAt) throw new BadRequestException('Sessão inválida');

    return this.prisma.cashierBleed.create({ data: { cashierSessionId: sessionId, amount, reason } });
  }

  async processPayment(orderId: string, payments: { method: PaymentMethod; amount: number; change?: number }[]) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');

    const alreadyPaid = order.payments
      .filter(p => p.status === PaymentStatus.PAID)
      .reduce((sum, p) => sum + p.amount, 0);

    const newTotal = payments.reduce((sum, p) => sum + p.amount, 0);
    if ((alreadyPaid + newTotal) < order.total - 0.01) {
      throw new BadRequestException(`Valor insuficiente. Faltam R$ ${(order.total - alreadyPaid - newTotal).toFixed(2)}`);
    }

    const created = await Promise.all(
      payments.map(p =>
        this.prisma.payment.create({
          data: {
            orderId,
            method: p.method,
            amount: p.amount,
            change: p.change || 0,
            status: PaymentStatus.PAID,
            paidAt: new Date(),
          },
        }),
      ),
    );

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'DELIVERED', deliveredAt: new Date() },
    });

    return { payments: created, message: 'Pagamento processado com sucesso' };
  }

  async getActiveSession(userId: string) {
    return this.prisma.cashierSession.findFirst({
      where: { userId, closedAt: null },
      include: {
        user: { select: { name: true } },
        bleeds: true,
      },
    });
  }

  async getSessions(query: { from?: string; to?: string }) {
    const where: any = {};
    if (query.from) where.openedAt = { gte: new Date(query.from) };
    if (query.to) where.openedAt = { ...where.openedAt, lte: new Date(query.to) };

    return this.prisma.cashierSession.findMany({
      where,
      include: { user: { select: { name: true } }, bleeds: true },
      orderBy: { openedAt: 'desc' },
    });
  }
}
