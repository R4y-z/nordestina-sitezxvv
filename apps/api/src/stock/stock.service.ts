import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StockMovementType } from '@prisma/client';

// Mapeia labels portugueses que o frontend pode enviar para o enum do Prisma
const PT_TO_MOVEMENT_TYPE: Record<string, StockMovementType> = {
  ENTRADA:    StockMovementType.IN,
  SAIDA:      StockMovementType.OUT,
  AJUSTE:     StockMovementType.ADJUSTMENT,
  PERDA:      StockMovementType.WASTE,
  TRANSFERENCIA: StockMovementType.TRANSFER,
  // inglês direto (backward compat)
  IN:         StockMovementType.IN,
  OUT:        StockMovementType.OUT,
  ADJUSTMENT: StockMovementType.ADJUSTMENT,
  WASTE:      StockMovementType.WASTE,
  TRANSFER:   StockMovementType.TRANSFER,
};

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { active?: string }) {
    return this.prisma.stockItem.findMany({
      where: query?.active !== undefined ? { active: query.active === 'true' } : {},
      include: {
        product: { select: { name: true, image: true } },
        _count:  { select: { movements: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.stockItem.findUnique({
      where: { id },
      include: {
        movements: { orderBy: { createdAt: 'desc' }, take: 20 },
        product:   true,
      },
    });
    if (!item) throw new NotFoundException('Item de estoque não encontrado');
    return item;
  }

  async create(dto: any) {
    // Remove campos que não existem no modelo StockItem para evitar erro 500
    const { category, _count, product, movements, ...data } = dto;
    return this.prisma.stockItem.create({ data });
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    const { category, _count, product, movements, ...data } = dto;
    return this.prisma.stockItem.update({ where: { id }, data });
  }

  async addMovement(dto: {
    stockItemId: string;
    type: string;           // aceita PT (ENTRADA) ou EN (IN)
    quantity: number;
    unitCost?: number;
    notes?: string;
    reason?: string;        // alias para notes vindo do frontend
    cost?: number;          // alias para unitCost vindo do frontend
    orderId?: string;
  }) {
    if (!dto.stockItemId) throw new BadRequestException('stockItemId é obrigatório');

    const item = await this.findOne(dto.stockItemId);

    // Resolve o tipo do enum
    const movementType = PT_TO_MOVEMENT_TYPE[dto.type?.toUpperCase()];
    if (!movementType) {
      throw new BadRequestException(
        `Tipo inválido: ${dto.type}. Use ENTRADA, SAIDA, AJUSTE ou PERDA`,
      );
    }

    // Aceita aliases do frontend
    const unitCost = dto.unitCost ?? dto.cost ?? 0;
    const notes    = dto.notes ?? dto.reason;

    const quantityChange =
      movementType === StockMovementType.IN
        ? dto.quantity
        : movementType === StockMovementType.ADJUSTMENT
          ? dto.quantity - item.currentQty   // ajuste absoluto
          : -dto.quantity;                   // saída / perda

    const newQty    = item.currentQty + quantityChange;
    const totalCost = unitCost * dto.quantity;

    const [movement] = await Promise.all([
      this.prisma.stockMovement.create({
        data: {
          stockItemId: dto.stockItemId,
          type:        movementType,
          quantity:    dto.quantity,
          unitCost,
          totalCost,
          notes,
          orderId:     dto.orderId,
        },
      }),
      this.prisma.stockItem.update({
        where: { id: dto.stockItemId },
        data:  { currentQty: newQty },
      }),
    ]);

    return movement;
  }

  async getLowStockAlerts() {
    const items = await this.prisma.stockItem.findMany({
      where:   { active: true },
      include: { product: { select: { name: true } } },
    });
    return items.filter(i => i.currentQty <= i.minQty);
  }

  async getMovements(stockItemId: string, limit = 20) {
    return this.prisma.stockMovement.findMany({
      where:   { stockItemId },
      orderBy: { createdAt: 'desc' },
      take:    limit,
    });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.stockItem.update({ where: { id }, data: { active: false } });
  }
}
