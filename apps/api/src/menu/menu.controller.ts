import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { MenuService } from './menu.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Cardápio')
@Controller('menu')
export class MenuController {
  constructor(private menuService: MenuService) {}

  // Cardápio público
  @Public()
  @Get('store')
  @ApiOperation({ summary: 'Cardápio completo para loja online' })
  getFullMenu() {
    return this.menuService.getFullMenu();
  }

  // Categorias
  @Get('categories')
  @ApiOperation({ summary: 'Listar categorias' })
  findAllCategories(@Query('active') active?: string) {
    return this.menuService.findAllCategories(active !== undefined ? active === 'true' : undefined);
  }

  @ApiBearerAuth()
  @Post('categories')
  @Roles(Role.ADMIN, Role.MANAGER)
  createCategory(@Body() dto: any) {
    return this.menuService.createCategory(dto);
  }

  @ApiBearerAuth()
  @Put('categories/:id')
  @Roles(Role.ADMIN, Role.MANAGER)
  updateCategory(@Param('id') id: string, @Body() dto: any) {
    return this.menuService.updateCategory(id, dto);
  }

  @ApiBearerAuth()
  @Delete('categories/:id')
  @Roles(Role.ADMIN)
  deleteCategory(@Param('id') id: string) {
    return this.menuService.deleteCategory(id);
  }

  // Produtos
  @Get('products')
  findAllProducts(@Query() query: { categoryId?: string; active?: string; showOnStore?: string }) {
    return this.menuService.findAllProducts(query);
  }

  @Get('products/:id')
  findProductById(@Param('id') id: string) {
    return this.menuService.findProductById(id);
  }

  @ApiBearerAuth()
  @Post('products')
  @Roles(Role.ADMIN, Role.MANAGER)
  createProduct(@Body() dto: any) {
    return this.menuService.createProduct(dto);
  }

  @ApiBearerAuth()
  @Put('products/:id')
  @Roles(Role.ADMIN, Role.MANAGER)
  updateProduct(@Param('id') id: string, @Body() dto: any) {
    return this.menuService.updateProduct(id, dto);
  }

  @ApiBearerAuth()
  @Patch('products/:id/availability')
  @Roles(Role.ADMIN, Role.MANAGER)
  toggleAvailability(@Param('id') id: string) {
    return this.menuService.toggleProductAvailability(id);
  }

  @ApiBearerAuth()
  @Patch('products/:id/active')
  @Roles(Role.ADMIN, Role.MANAGER)
  toggleActive(@Param('id') id: string) {
    return this.menuService.toggleProductActive(id);
  }

  @ApiBearerAuth()
  @Delete('products/:id')
  @Roles(Role.ADMIN)
  deleteProduct(@Param('id') id: string) {
    return this.menuService.deleteProduct(id);
  }
}
