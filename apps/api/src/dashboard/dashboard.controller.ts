import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.MANAGER)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('overview')
  getOverview() {
    return this.dashboardService.getOverview();
  }

  @Get('revenue-chart')
  getRevenueChart(@Query('days') days?: string) {
    return this.dashboardService.getRevenueChart(Number(days) || 7);
  }

  @Get('top-products')
  getTopProducts(@Query('limit') limit?: string, @Query('days') days?: string) {
    return this.dashboardService.getTopProducts(Number(limit) || 10, Number(days) || 30);
  }

  @Get('orders-by-type')
  getOrdersByType() {
    return this.dashboardService.getOrdersByType();
  }

  @Get('orders-by-status')
  getOrdersByStatus() {
    return this.dashboardService.getOrdersByStatus();
  }

  @Get('recent-orders')
  getRecentOrders(@Query('limit') limit?: string) {
    return this.dashboardService.getRecentOrders(Number(limit) || 10);
  }
}
