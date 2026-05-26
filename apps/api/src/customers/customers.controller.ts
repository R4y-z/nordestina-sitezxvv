import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CustomersService } from './customers.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Clientes')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER, Role.DELIVERY)
  findAll(@Query() query: any) {
    return this.customersService.findAll(query);
  }

  @Get('phone/:phone')
  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER, Role.DELIVERY, Role.WAITER)
  findByPhone(@Param('phone') phone: string) {
    return this.customersService.findByPhone(phone);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Get(':id/orders')
  getOrders(@Param('id') id: string) {
    return this.customersService.getCustomerOrders(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER, Role.DELIVERY)
  create(@Body() dto: any) {
    return this.customersService.create(dto);
  }

  // Cadastro público (para loja online)
  @Public()
  @Post('register')
  register(@Body() dto: any) {
    return this.customersService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.customersService.update(id, dto);
  }

  @Post(':id/addresses')
  addAddress(@Param('id') id: string, @Body() dto: any) {
    return this.customersService.addAddress(id, dto);
  }
}
