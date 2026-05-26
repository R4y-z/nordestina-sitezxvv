import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { FinancialService } from './financial.service';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Financeiro')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.MANAGER)
@Controller('financial')
export class FinancialController {
  constructor(private financialService: FinancialService) {}

  @Get('summary')
  getSummary(@Query('from') from: string, @Query('to') to: string) {
    const today = new Date().toISOString().slice(0, 10);
    return this.financialService.getFinancialSummary(from || today, to || today);
  }

  @Get('cash-flow')
  getCashFlow(@Query('days') days?: string) {
    return this.financialService.getDailyCashFlow(Number(days) || 30);
  }

  @Get('expenses')
  getExpenses(@Query() query: any) {
    return this.financialService.getExpenses(query);
  }

  @Post('expenses')
  createExpense(@Body() dto: any) {
    return this.financialService.createExpense(dto);
  }

  @Put('expenses/:id')
  updateExpense(@Param('id') id: string, @Body() dto: any) {
    return this.financialService.updateExpense(id, dto);
  }

  @Delete('expenses/:id')
  deleteExpense(@Param('id') id: string) {
    return this.financialService.deleteExpense(id);
  }

  @Get('transactions')
  getTransactions(@Query() query: any) {
    return this.financialService.getTransactions(query);
  }
}
