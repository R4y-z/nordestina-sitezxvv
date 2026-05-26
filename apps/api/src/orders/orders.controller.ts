import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role, OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Pedidos')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  // ─── Leitura ────────────────────────────────────────────────────────────────

  @Get()
  @Roles(Role.MANAGER, Role.CASHIER, Role.WAITER)
  @ApiOperation({ summary: 'Listar pedidos' })
  findAll(@Query() query: any) {
    return this.ordersService.findAll(query);
  }

  @Get('active')
  @Roles(Role.MANAGER, Role.CASHIER, Role.WAITER, Role.KITCHEN)
  @ApiOperation({ summary: 'Pedidos ativos (em andamento)' })
  getActiveOrders() {
    return this.ordersService.getActiveOrders();
  }

  @Get(':id')
  @Roles(Role.MANAGER, Role.CASHIER, Role.WAITER, Role.KITCHEN)
  @ApiOperation({ summary: 'Buscar pedido por ID' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  // ─── Criação ────────────────────────────────────────────────────────────────

  @Post()
  @Roles(Role.MANAGER, Role.CASHIER, Role.WAITER)
  @ApiOperation({ summary: 'Criar novo pedido' })
  create(@Body() dto: any, @CurrentUser('id') userId: string) {
    return this.ordersService.create(dto, userId);
  }

  // Pedido online público (site/app da loja)
  @Public()
  @Post('store')
  @ApiOperation({ summary: 'Criar pedido pelo site/app' })
  createFromStore(@Body() dto: any) {
    return this.ordersService.create(dto);
  }

  // ─── Itens do pedido ────────────────────────────────────────────────────────

  @Post(':id/items')
  @Roles(Role.MANAGER, Role.CASHIER, Role.WAITER)
  @ApiOperation({ summary: 'Adicionar itens ao pedido' })
  addItems(@Param('id') id: string, @Body('items') items: any[]) {
    return this.ordersService.addItems(id, items);
  }

  @Put(':id/items/:itemId')
  @Roles(Role.MANAGER, Role.CASHIER, Role.WAITER)
  @ApiOperation({ summary: 'Editar item do pedido (quantidade / observação)' })
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: { quantity?: number; notes?: string },
  ) {
    return this.ordersService.updateItem(id, itemId, dto);
  }

  @Delete(':id/items/:itemId')
  @Roles(Role.MANAGER, Role.CASHIER, Role.WAITER)
  @ApiOperation({ summary: 'Remover/cancelar item do pedido' })
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.ordersService.removeItem(id, itemId);
  }

  // ─── Status ─────────────────────────────────────────────────────────────────

  /**
   * Quem pode avançar qual status:
   *   WAITER   → PENDING→CONFIRMED, CONFIRMED→PREPARING (envia para cozinha)
   *   KITCHEN  → CONFIRMED→PREPARING, PREPARING→READY
   *   DELIVERY → READY→DELIVERING, DELIVERING→DELIVERED
   *   CASHIER  → qualquer status (fechamento de conta)
   *   MANAGER  → qualquer status
   */
  @Patch(':id/status')
  @Roles(Role.MANAGER, Role.CASHIER, Role.WAITER, Role.KITCHEN, Role.DELIVERY)
  @ApiOperation({ summary: 'Atualizar status do pedido' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
  ) {
    return this.ordersService.updateStatus(id, status);
  }

  @Patch(':id/cancel')
  @Roles(Role.MANAGER, Role.CASHIER, Role.WAITER)
  @ApiOperation({ summary: 'Cancelar pedido inteiro' })
  cancel(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.ordersService.cancel(id, reason);
  }
}
