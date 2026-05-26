import { Controller, Get, Patch, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { KitchenService } from './kitchen.service';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Cozinha')
@ApiBearerAuth()
@Controller('kitchen')
export class KitchenController {
  constructor(private kitchenService: KitchenService) {}

  @Get('orders')
  @Roles(Role.ADMIN, Role.MANAGER, Role.KITCHEN)
  getKitchenOrders() {
    return this.kitchenService.getKitchenOrders();
  }

  @Get('stats')
  @Roles(Role.ADMIN, Role.MANAGER, Role.KITCHEN)
  getStats() {
    return this.kitchenService.getStats();
  }

  @Patch('orders/:id/preparing')
  @Roles(Role.ADMIN, Role.MANAGER, Role.KITCHEN)
  startPreparing(@Param('id') id: string) {
    return this.kitchenService.startPreparing(id);
  }

  @Patch('orders/:id/ready')
  @Roles(Role.ADMIN, Role.MANAGER, Role.KITCHEN)
  markReady(@Param('id') id: string) {
    return this.kitchenService.markReady(id);
  }
}
