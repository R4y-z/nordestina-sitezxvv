import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ComandaStatus, PaymentMethod } from '@prisma/client';

const COMANDA_INCLUDE = {
  items: {
    include: { product: { select: { id: true, name: true, isKgProduct: true, image: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
  payments: true,
  table:    { select: { id: true, number: true, name: true } },
  createdBy:{ select: { id: true, name: true } },
};

@Injectable()
export class ComandasService {
  constructor(private prisma: PrismaService) {}

  // ─── Geração de número ────────────────────────────────────────────────────

  private async generateNumero(): Promise<string> {
    const now   = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day   = String(now.getDate()).padStart(2, '0');
    const prefix = `${month}${day}`;

    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const last = await this.prisma.comanda.findFirst({
      where:   { createdAt: { gte: startOfDay, lte: endOfDay } },
      orderBy: { createdAt: 'desc' },
      select:  { numero: true },
    });

    if (!last) return `${prefix}-001`;

    const parts  = last.numero.split('-');
    const lastN  = parseInt(parts[parts.length - 1] ?? '0', 10);
    return `${prefix}-${String(lastN + 1).padStart(3, '0')}`;
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  async create(dto: { tableId?: string; observacao?: string }, userId?: string) {
    const numero = await this.generateNumero();
    return this.prisma.comanda.create({
      data: {
        numero,
        status:      ComandaStatus.ABERTA,
        tableId:     dto.tableId,
        createdById: userId,
        observacao:  dto.observacao,
      },
      include: COMANDA_INCLUDE,
    });
  }

  async findAll(query: {
    status?: ComandaStatus;
    date?: string;
    page?: string;
    limit?: string;
  }) {
    const page  = Math.max(1, Number(query.page)  || 1);
    const limit = Math.min(100, Number(query.limit) || 50);
    const where: any = {};

    if (query.status) where.status = query.status;

    if (query.date) {
      const d    = new Date(query.date);
      const from = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const to   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
      where.createdAt = { gte: from, lte: to };
    }

    const [total, items] = await Promise.all([
      this.prisma.comanda.count({ where }),
      this.prisma.comanda.findMany({
        where,
        include:  COMANDA_INCLUDE,
        orderBy:  { createdAt: 'desc' },
        skip:     (page - 1) * limit,
        take:     limit,
      }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findActive() {
    return this.prisma.comanda.findMany({
      where:   { status: { in: [ComandaStatus.ABERTA, ComandaStatus.FECHAMENTO] } },
      include: COMANDA_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const comanda = await this.prisma.comanda.findUnique({
      where:   { id },
      include: COMANDA_INCLUDE,
    });
    if (!comanda) throw new NotFoundException('Comanda não encontrada');
    return comanda;
  }

  async findByNumero(numero: string) {
    const comanda = await this.prisma.comanda.findUnique({
      where:   { numero },
      include: COMANDA_INCLUDE,
    });
    if (!comanda) throw new NotFoundException(`Comanda ${numero} não encontrada`);
    return comanda;
  }

  // ─── Itens ────────────────────────────────────────────────────────────────

  async addItem(
    comandaId: string,
    dto: {
      productId?: string;
      name?: string;
      tipo?: 'UNITARIO' | 'KG';
      quantity?: number;
      peso?: number;
      price?: number;
      notes?: string;
    },
  ) {
    const comanda = await this.findOne(comandaId);

    if (comanda.status === ComandaStatus.FINALIZADA || comanda.status === ComandaStatus.CANCELADA) {
      throw new BadRequestException('Comanda encerrada — não é possível lançar itens');
    }

    // Busca dados do produto se não foram passados
    let price = dto.price;
    let name  = dto.name;
    let tipo  = dto.tipo ?? 'UNITARIO';

    if (dto.productId) {
      const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
      if (!product) throw new NotFoundException('Produto não encontrado');
      price = price ?? (product.promotionalPrice ?? product.price);
      name  = name  ?? product.name;
      tipo  = product.isKgProduct ? 'KG' : (dto.tipo ?? 'UNITARIO');
    }

    if (!price) throw new BadRequestException('Informe o preço do item');
    if (!name)  throw new BadRequestException('Informe o nome do item');

    // Calcula subtotal conforme o tipo
    const subtotal =
      tipo === 'KG'
        ? (dto.peso ?? 0) * price
        : (dto.quantity ?? 1) * price;

    await this.prisma.comandaItem.create({
      data: {
        comandaId,
        productId: dto.productId,
        name,
        tipo,
        quantity:  dto.quantity ?? 1,
        peso:      tipo === 'KG' ? (dto.peso ?? 0) : null,
        price,
        subtotal,
        notes:     dto.notes,
      },
    });

    await this.recalculateTotal(comandaId);
    return this.findOne(comandaId);
  }

  async removeItem(comandaId: string, itemId: string) {
    const comanda = await this.findOne(comandaId);
    if (comanda.status === ComandaStatus.FINALIZADA || comanda.status === ComandaStatus.CANCELADA) {
      throw new BadRequestException('Comanda encerrada — não é possível remover itens');
    }

    const item = await this.prisma.comandaItem.findFirst({ where: { id: itemId, comandaId } });
    if (!item) throw new NotFoundException('Item não encontrado na comanda');

    await this.prisma.comandaItem.delete({ where: { id: itemId } });
    await this.recalculateTotal(comandaId);
    return this.findOne(comandaId);
  }

  // ─── Status ───────────────────────────────────────────────────────────────

  async updateStatus(id: string, status: ComandaStatus) {
    await this.findOne(id);
    return this.prisma.comanda.update({
      where:   { id },
      data:    { status, closedAt: status === ComandaStatus.FINALIZADA ? new Date() : undefined },
      include: COMANDA_INCLUDE,
    });
  }

  // ─── Fechar conta ─────────────────────────────────────────────────────────

  async fechar(
    id: string,
    dto: {
      method: PaymentMethod;
      amount: number;
      change?: number;
      notes?: string;
    },
  ) {
    const comanda = await this.findOne(id);

    if (
      comanda.status === ComandaStatus.FINALIZADA ||
      comanda.status === ComandaStatus.CANCELADA
    ) {
      throw new BadRequestException('Comanda já encerrada');
    }

    if (dto.amount < comanda.totalValue && dto.method !== PaymentMethod.MIXED) {
      throw new BadRequestException(
        `Valor insuficiente. Total da comanda: R$ ${comanda.totalValue.toFixed(2)}`,
      );
    }

    await this.prisma.comandaPayment.create({
      data: {
        comandaId: id,
        method:    dto.method,
        amount:    dto.amount,
        change:    dto.change ?? Math.max(0, dto.amount - comanda.totalValue),
        notes:     dto.notes,
      },
    });

    return this.prisma.comanda.update({
      where:   { id },
      data:    { status: ComandaStatus.FINALIZADA, closedAt: new Date() },
      include: COMANDA_INCLUDE,
    });
  }

  async cancel(id: string) {
    const comanda = await this.findOne(id);
    if (comanda.status === ComandaStatus.FINALIZADA) {
      throw new BadRequestException('Comanda já finalizada — não pode ser cancelada');
    }
    return this.prisma.comanda.update({
      where:   { id },
      data:    { status: ComandaStatus.CANCELADA, closedAt: new Date() },
      include: COMANDA_INCLUDE,
    });
  }

  // ─── Relatório diário ─────────────────────────────────────────────────────

  async getRelatorio(date?: string) {
    const d    = date ? new Date(date) : new Date();
    const from = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
    const to   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

    const [comandas, items] = await Promise.all([
      this.prisma.comanda.findMany({
        where:   { createdAt: { gte: from, lte: to } },
        include: { payments: true, items: true },
      }),
      this.prisma.comandaItem.findMany({
        where: {
          comanda: { createdAt: { gte: from, lte: to }, status: ComandaStatus.FINALIZADA },
          tipo:    'KG',
        },
        select: { peso: true },
      }),
    ]);

    const finalizadas  = comandas.filter(c => c.status === ComandaStatus.FINALIZADA);
    const faturamento  = finalizadas.reduce((s, c) => s + c.totalValue, 0);
    const ticketMedio  = finalizadas.length > 0 ? faturamento / finalizadas.length : 0;
    const totalKg      = items.reduce((s, i) => s + (i.peso ?? 0), 0);

    const byMethod: Record<string, number> = {};
    for (const c of finalizadas) {
      for (const p of c.payments) {
        byMethod[p.method] = (byMethod[p.method] ?? 0) + p.amount;
      }
    }

    return {
      date:          d.toISOString().slice(0, 10),
      totalComandas: comandas.length,
      abertas:       comandas.filter(c => c.status === ComandaStatus.ABERTA).length,
      finalizadas:   finalizadas.length,
      canceladas:    comandas.filter(c => c.status === ComandaStatus.CANCELADA).length,
      faturamento,
      ticketMedio,
      totalKgVendido: totalKg,
      porMetodo:     byMethod,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async recalculateTotal(comandaId: string) {
    const items = await this.prisma.comandaItem.findMany({ where: { comandaId } });
    const total = items.reduce((s, i) => s + i.subtotal, 0);
    await this.prisma.comanda.update({ where: { id: comandaId }, data: { totalValue: total } });
  }
}
