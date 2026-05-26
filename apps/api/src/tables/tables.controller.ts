import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role, TableStatus } from '@prisma/client';
import { TablesService } from './tables.service';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Mesas')
@ApiBearerAuth()
@Controller('tables')
export class TablesController {
  constructor(private tablesService: TablesService) {}

  // ─── Leitura ────────────────────────────────────────────────────────────────

  @Get()
  @Roles(Role.MANAGER, Role.CASHIER, Role.WAITER)
  @ApiOperation({ summary: 'Listar mesas' })
  findAll(@Query() query: { status?: TableStatus; area?: string }) {
    return this.tablesService.findAll(query);
  }

  @Get('map')
  @Roles(Role.MANAGER, Role.CASHIER, Role.WAITER)
  @ApiOperation({ summary: 'Mapa de mesas com status' })
  getTableMap() {
    return this.tablesService.getTableMap();
  }

  @Get(':id')
  @Roles(Role.MANAGER, Role.CASHIER, Role.WAITER)
  @ApiOperation({ summary: 'Buscar mesa por ID' })
  findOne(@Param('id') id: string) {
    return this.tablesService.findOne(id);
  }

  // ─── Criação / edição completa (somente admin/gerente) ──────────────────────

  @Post()
  @Roles(Role.MANAGER)
  @ApiOperation({ summary: 'Criar nova mesa' })
  create(@Body() dto: any) {
    return this.tablesService.create(dto);
  }

  @Put(':id')
  @Roles(Role.MANAGER)
  @ApiOperation({ summary: 'Atualizar dados da mesa (número, nome, capacidade, área)' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.tablesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.MANAGER)
  @ApiOperation({ summary: 'Remover mesa' })
  remove(@Param('id') id: string) {
    return this.tablesService.remove(id);
  }

  // ─── Ações de status (garçom, caixa, gerente) ───────────────────────────────

  /**
   * Altera apenas o status da mesa sem mexer em outros campos.
   * Garçom pode: AVAILABLE, OCCUPIED, RESERVED
   * Caixa/Gerente podem também: MAINTENANCE
   */
  @Patch(':id/status')
  @Roles(Role.MANAGER, Role.CASHIER, Role.WAITER)
  @ApiOperation({ summary: 'Alterar status da mesa' })
  updateStatus(@Param('id') id: string, @Body('status') status: TableStatus) {
    return this.tablesService.updateStatus(id, status);
  }

  @Patch(':id/open')
  @Roles(Role.MANAGER, Role.CASHIER, Role.WAITER)
  @ApiOperation({ summary: 'Abrir/ocupar mesa' })
  openTable(@Param('id') id: string) {
    return this.tablesService.openTable(id);
  }

  @Patch(':id/close')
  @Roles(Role.MANAGER, Role.CASHIER, Role.WAITER)
  @ApiOperation({ summary: 'Fechar mesa (requer pedidos quitados)' })
  closeTable(@Param('id') id: string) {
    return this.tablesService.closeTable(id);
  }
}
