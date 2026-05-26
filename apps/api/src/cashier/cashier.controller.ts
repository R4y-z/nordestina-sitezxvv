import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CashierService } from './cashier.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Caixa')
@ApiBearerAuth()
@Controller('cashier')
export class CashierController {
  constructor(private cashierService: CashierService) {}

  @Get('session/active')
  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER)
  getActiveSession(@CurrentUser('id') userId: string) {
    return this.cashierService.getActiveSession(userId);
  }

  @Get('sessions')
  @Roles(Role.ADMIN, Role.MANAGER)
  getSessions(@Query() query: { from?: string; to?: string }) {
    return this.cashierService.getSessions(query);
  }

  @Post('session/open')
  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER)
  @ApiOperation({ summary: 'Abrir caixa' })
  openSession(@CurrentUser('id') userId: string, @Body('openingAmount') amount: number) {
    return this.cashierService.openSession(userId, amount || 0);
  }

  @Patch('session/:id/close')
  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER)
  @ApiOperation({ summary: 'Fechar caixa' })
  closeSession(
    @Param('id') id: string,
    @Body('closingAmount') amount: number,
    @Body('notes') notes?: string,
  ) {
    return this.cashierService.closeSession(id, amount, notes);
  }

  @Post('session/:id/bleed')
  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER)
  @ApiOperation({ summary: 'Registrar sangria' })
  registerBleed(
    @Param('id') id: string,
    @Body('amount') amount: number,
    @Body('reason') reason: string,
  ) {
    return this.cashierService.registerBleed(id, amount, reason);
  }

  @Post('payment/:orderId')
  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER)
  @ApiOperation({ summary: 'Processar pagamento do pedido' })
  processPayment(@Param('orderId') orderId: string, @Body('payments') payments: any[]) {
    return this.cashierService.processPayment(orderId, payments);
  }
}
