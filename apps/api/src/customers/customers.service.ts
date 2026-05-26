import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { search?: string; page?: string; limit?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        include: { addresses: { where: { isDefault: true } } },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { items, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        addresses: true,
        orders: {
          take: 10,
          include: { items: { select: { name: true, quantity: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado');
    return customer;
  }

  async findByPhone(phone: string) {
    return this.prisma.customer.findUnique({
      where: { phone },
      include: {
        addresses: true,
        orders: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async create(dto: any) {
    if (dto.phone) {
      const exists = await this.prisma.customer.findUnique({ where: { phone: dto.phone } });
      if (exists) throw new ConflictException('Telefone já cadastrado');
    }
    return this.prisma.customer.create({
      data: dto,
      include: { addresses: true },
    });
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  async addAddress(customerId: string, dto: any) {
    if (dto.isDefault) {
      await this.prisma.customerAddress.updateMany({
        where: { customerId },
        data: { isDefault: false },
      });
    }
    return this.prisma.customerAddress.create({ data: { ...dto, customerId } });
  }

  async getCustomerOrders(customerId: string) {
    return this.prisma.order.findMany({
      where: { customerId },
      include: { items: { select: { name: true, quantity: true, price: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
