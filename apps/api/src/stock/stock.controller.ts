import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { StockService } from './stock.service';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Estoque')
@ApiBearerAuth()
@Controller('stock')
export class StockController {
  constructor(private stockService: StockService) {}

  // ─── Leitura (ADMIN, MANAGER, CASHIER, KITCHEN) ───────────────────────────

  @Get()
  @Roles(Role.MANAGER, Role.CASHIER, Role.KITCHEN)
  @ApiOperation({ summary: 'Listar itens de estoque' })
  findAll(@Query() query: any) {
    return this.stockService.findAll(query);
  }

  @Get('alerts')
  @Roles(Role.MANAGER, Role.CASHIER, Role.KITCHEN)
  @ApiOperation({ summary: 'Itens com estoque abaixo do mínimo' })
  getLowStockAlerts() {
    return this.stockService.getLowStockAlerts();
  }

  @Get(':id')
  @Roles(Role.MANAGER, Role.CASHIER, Role.KITCHEN)
  @ApiOperation({ summary: 'Detalhes de um item de estoque' })
  findOne(@Param('id') id: string) {
    return this.stockService.findOne(id);
  }

  @Get(':id/movements')
  @Roles(Role.MANAGER, Role.CASHIER, Role.KITCHEN)
  @ApiOperation({ summary: 'Histórico de movimentações do item' })
  getMovements(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.stockService.getMovements(id, Number(limit) || 20);
  }

  // ─── Escrita (ADMIN, MANAGER apenas) ──────────────────────────────────────

  @Post()
  @Roles(Role.MANAGER)
  @ApiOperation({ summary: 'Criar item de estoque' })
  create(@Body() dto: any) {
    return this.stockService.create(dto);
  }

  @Put(':id')
  @Roles(Role.MANAGER)
  @ApiOperation({ summary: 'Editar item de estoque' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.stockService.update(id, dto);
  }

  @Patch(':id/deactivate')
  @Roles(Role.MANAGER)
  @ApiOperation({ summary: 'Desativar item de estoque' })
  deactivate(@Param('id') id: string) {
    return this.stockService.deactivate(id);
  }

  // ─── Movimentações ────────────────────────────────────────────────────────

  /**
   * POST /stock/movement — envia stockItemId no body
   * POST /stock/:id/movement — envia ID na URL (compatibilidade com o frontend)
   */
  @Post('movement')
  @Roles(Role.MANAGER, Role.CASHIER)
  @ApiOperation({ summary: 'Registrar movimentação (body deve incluir stockItemId)' })
  addMovement(@Body() dto: any) {
    return this.stockService.addMovement(dto);
  }

  @Post(':id/movement')
  @Roles(Role.MANAGER, Role.CASHIER)
  @ApiOperation({ summary: 'Registrar movimentação via URL (/:id/movement)' })
  addMovementByParam(@Param('id') id: string, @Body() dto: any) {
    return this.stockService.addMovement({ ...dto, stockItemId: id });
  }
}
