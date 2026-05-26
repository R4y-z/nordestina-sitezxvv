import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role, ComandaStatus, PaymentMethod } from '@prisma/client';
import { ComandasService } from './comandas.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Comandas')
@ApiBearerAuth()
@Controller('comandas')
export class ComandasController {
  constructor(private readonly service: ComandasService) {}

  // ─── Leitura ────────────────────────────────────────────────────────────────

  @Get()
  @Roles(Role.MANAGER, Role.CASHIER, Role.WAITER)
  @ApiOperation({ summary: 'Listar comandas (com filtros de status e data)' })
  findAll(
    @Query('status') status?: ComandaStatus,
    @Query('date')   date?: string,
    @Query('page')   page?: string,
    @Query('limit')  limit?: string,
  ) {
    return this.service.findAll({ status, date, page, limit });
  }

  @Get('active')
  @Roles(Role.MANAGER, Role.CASHIER, Role.WAITER)
  @ApiOperation({ summary: 'Comandas abertas e em fechamento' })
  findActive() {
    return this.service.findActive();
  }

  @Get('relatorio')
  @Roles(Role.MANAGER, Role.CASHIER)
  @ApiOperation({ summary: 'Relatório diário de comandas' })
  getRelatorio(@Query('date') date?: string) {
    return this.service.getRelatorio(date);
  }

  @Get('numero/:numero')
  @Roles(Role.MANAGER, Role.CASHIER, Role.WAITER)
  @ApiOperation({ summary: 'Buscar comanda pelo número (ex: 0525-001)' })
  findByNumero(@Param('numero') numero: string) {
    return this.service.findByNumero(numero);
  }

  @Get(':id')
  @Roles(Role.MANAGER, Role.CASHIER, Role.WAITER)
  @ApiOperation({ summary: 'Buscar comanda pelo ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // ─── Criação ────────────────────────────────────────────────────────────────

  /**
   * Garçom e caixa podem criar comandas.
   * O número é gerado automaticamente no formato MMDD-NNN (ex: 0525-001).
   */
  @Post()
  @Roles(Role.MANAGER, Role.CASHIER, Role.WAITER)
  @ApiOperation({ summary: 'Criar nova comanda (número gerado automaticamente)' })
  create(
    @Body() dto: { tableId?: string; observacao?: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.service.create(dto, userId);
  }

  // ─── Itens ──────────────────────────────────────────────────────────────────

  @Post(':id/items')
  @Roles(Role.MANAGER, Role.CASHIER, Role.WAITER)
  @ApiOperation({ summary: 'Lançar item na comanda (unitário ou KG)' })
  addItem(
    @Param('id') id: string,
    @Body() dto: {
      productId?: string;
      name?: string;
      tipo?: 'UNITARIO' | 'KG';
      quantity?: number;
      peso?: number;     // em KG, ex: 0.742
      price?: number;
      notes?: string;
    },
  ) {
    return this.service.addItem(id, dto);
  }

  @Delete(':id/items/:itemId')
  @Roles(Role.MANAGER, Role.CASHIER, Role.WAITER)
  @ApiOperation({ summary: 'Remover item da comanda' })
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.service.removeItem(id, itemId);
  }

  // ─── Ações de status ────────────────────────────────────────────────────────

  @Patch(':id/status')
  @Roles(Role.MANAGER, Role.CASHIER, Role.WAITER)
  @ApiOperation({ summary: 'Atualizar status da comanda' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: ComandaStatus,
  ) {
    return this.service.updateStatus(id, status);
  }

  /**
   * Finaliza a comanda registrando o pagamento.
   * Garçom pode colocar em FECHAMENTO; somente Caixa/Gerente finalizam com pagamento.
   */
  @Patch(':id/fechar')
  @Roles(Role.MANAGER, Role.CASHIER)
  @ApiOperation({ summary: 'Fechar comanda e registrar pagamento' })
  fechar(
    @Param('id') id: string,
    @Body() dto: {
      method: PaymentMethod;
      amount: number;
      change?: number;
      notes?: string;
    },
  ) {
    return this.service.fechar(id, dto);
  }

  @Patch(':id/cancelar')
  @Roles(Role.MANAGER, Role.CASHIER)
  @ApiOperation({ summary: 'Cancelar comanda' })
  cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }
}
