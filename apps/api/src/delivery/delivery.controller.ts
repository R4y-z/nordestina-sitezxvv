import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { DeliveryService } from './delivery.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Delivery')
@ApiBearerAuth()
@Controller('delivery')
export class DeliveryController {
  constructor(private deliveryService: DeliveryService) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.DELIVERY)
  findAll(@Query() query: any) {
    return this.deliveryService.findAll(query);
  }

  @Get('stats')
  @Roles(Role.ADMIN, Role.MANAGER, Role.DELIVERY)
  getStats() {
    return this.deliveryService.getStats();
  }

  @Get('deliverers')
  @Roles(Role.ADMIN, Role.MANAGER, Role.DELIVERY)
  getDeliverers() {
    return this.deliveryService.getDeliverers();
  }

  @Patch(':id/assign')
  @Roles(Role.ADMIN, Role.MANAGER, Role.DELIVERY)
  assignDeliverer(@Param('id') id: string, @Body('delivererId') delivererId: string) {
    return this.deliveryService.assignDeliverer(id, delivererId);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.deliveryService.updateStatus(id, status);
  }

  // Bairros
  @Public()
  @Get('neighborhoods')
  findAllNeighborhoods(@Query('active') active?: string) {
    return this.deliveryService.findAllNeighborhoods(active !== undefined ? active === 'true' : true);
  }

  @Public()
  @Post('neighborhoods/calculate')
  calculateFee(@Body('neighborhood') neighborhood: string) {
    return this.deliveryService.calculateDeliveryFee(neighborhood);
  }

  @Post('neighborhoods')
  @Roles(Role.ADMIN, Role.MANAGER)
  createNeighborhood(@Body() dto: any) {
    return this.deliveryService.createNeighborhood(dto);
  }

  @Put('neighborhoods/:id')
  @Roles(Role.ADMIN, Role.MANAGER)
  updateNeighborhood(@Param('id') id: string, @Body() dto: any) {
    return this.deliveryService.updateNeighborhood(id, dto);
  }

  @Delete('neighborhoods/:id')
  @Roles(Role.ADMIN)
  deleteNeighborhood(@Param('id') id: string) {
    return this.deliveryService.deleteNeighborhood(id);
  }
}
