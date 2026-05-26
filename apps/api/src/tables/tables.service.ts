import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TableStatus } from '@prisma/client';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { status?: TableStatus; area?: string }) {
    return this.prisma.table.findMany({
      where: { active: true, ...query },
      include: {
        orders: {
          where: { status: { notIn: ['DELIVERED', 'CANCELLED'] } },
          include: { items: { include: { product: { select: { name: true } } } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { number: 'asc' },
    });
  }

  async findOne(id: string) {
    const table = await this.prisma.table.findUnique({
      where: { id },
      include: {
        orders: {
          where: { status: { notIn: ['DELIVERED', 'CANCELLED'] } },
          include: {
            items: { include: { product: true, addons: true } },
            payments: true,
            createdBy: { select: { name: true } },
          },
        },
      },
    });
    if (!table) throw new NotFoundException('Mesa não encontrada');
    return table;
  }

  async create(dto: { number: number; name?: string; capacity?: number; area?: string }) {
    const exists = await this.prisma.table.findUnique({ where: { number: dto.number } });
    if (exists) throw new BadRequestException(`Mesa ${dto.number} já existe`);
    return this.prisma.table.create({ data: dto });
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    return this.prisma.table.update({ where: { id }, data: dto });
  }

  async updateStatus(id: string, status: TableStatus) {
    await this.findOne(id);
    return this.prisma.table.update({ where: { id }, data: { status } });
  }

  async openTable(id: string) {
    const table = await this.prisma.table.findUnique({ where: { id } });
    if (!table) throw new NotFoundException('Mesa não encontrada');
    if (table.status === 'OCCUPIED') throw new BadRequestException('Mesa já está ocupada');
    return this.prisma.table.update({ where: { id }, data: { status: 'OCCUPIED' } });
  }

  async closeTable(id: string) {
    const table = await this.findOne(id);
    const hasOpenOrders = table.orders.length > 0;
    if (hasOpenOrders) throw new BadRequestException('Mesa possui pedidos em aberto. Finalize os pagamentos antes de fechar');
    return this.prisma.table.update({ where: { id }, data: { status: 'AVAILABLE' } });
  }

  async getTableMap() {
    const tables = await this.prisma.table.findMany({
      where: { active: true },
      include: {
        orders: {
          where: { status: { notIn: ['DELIVERED', 'CANCELLED'] } },
          select: { id: true, total: true, createdAt: true, status: true },
        },
      },
      orderBy: { number: 'asc' },
    });

    return tables.map(t => ({
      id: t.id,
      number: t.number,
      name: t.name,
      capacity: t.capacity,
      status: t.status,
      area: t.area,
      activeOrders: t.orders.length,
      totalValue: t.orders.reduce((sum, o) => sum + o.total, 0),
      since: t.orders[0]?.createdAt || null,
    }));
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.table.update({ where: { id }, data: { active: false } });
  }
}
