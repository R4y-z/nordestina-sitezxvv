import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ReportsService } from './reports.service';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Relatórios')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.MANAGER)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('sales')
  getSalesReport(@Query('from') from: string, @Query('to') to: string) {
    const today = new Date().toISOString().slice(0, 10);
    return this.reportsService.getSalesReport(from || today, to || today);
  }

  @Get('products')
  getProductsReport(@Query('from') from: string, @Query('to') to: string) {
    const today = new Date().toISOString().slice(0, 10);
    return this.reportsService.getProductsReport(from || today, to || today);
  }

  @Get('delivery')
  getDeliveryReport(@Query('from') from: string, @Query('to') to: string) {
    const today = new Date().toISOString().slice(0, 10);
    return this.reportsService.getDeliveryReport(from || today, to || today);
  }

  @Get('employees')
  getEmployeesReport(@Query('from') from: string, @Query('to') to: string) {
    const today = new Date().toISOString().slice(0, 10);
    return this.reportsService.getEmployeesReport(from || today, to || today);
  }
}
