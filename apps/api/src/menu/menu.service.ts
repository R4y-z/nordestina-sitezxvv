import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  // ====== CATEGORIAS ======
  async findAllCategories(active?: boolean) {
    return this.prisma.category.findMany({
      where: active !== undefined ? { active } : {},
      include: { _count: { select: { products: true } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createCategory(dto: any) {
    const exists = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
    if (exists) throw new ConflictException('Slug já existe');
    return this.prisma.category.create({ data: dto });
  }

  async updateCategory(id: string, dto: any) {
    await this.findCategoryById(id);
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async deleteCategory(id: string) {
    await this.findCategoryById(id);
    return this.prisma.category.delete({ where: { id } });
  }

  async findCategoryById(id: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Categoria não encontrada');
    return cat;
  }

  // ====== PRODUTOS ======
  async findAllProducts(query: { categoryId?: string; active?: string; showOnStore?: string }) {
    const where: any = {};
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.active !== undefined) where.active = query.active === 'true';
    if (query.showOnStore !== undefined) where.showOnStore = query.showOnStore === 'true';

    return this.prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, color: true } },
        addons: { where: { active: true }, orderBy: { sortOrder: 'asc' } },
      },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    });
  }

  async findProductById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        addons: { where: { active: true } },
      },
    });
    if (!product) throw new NotFoundException('Produto não encontrado');
    return product;
  }

  async createProduct(dto: any) {
    const { addons, ...productData } = dto;
    return this.prisma.product.create({
      data: {
        ...productData,
        addons: addons?.length ? { create: addons } : undefined,
      },
      include: { addons: true, category: true },
    });
  }

  async updateProduct(id: string, dto: any) {
    await this.findProductById(id);
    const { addons, ...productData } = dto;
    return this.prisma.product.update({
      where: { id },
      data: productData,
      include: { addons: true, category: true },
    });
  }

  async toggleProductAvailability(id: string) {
    const product = await this.findProductById(id);
    return this.prisma.product.update({
      where: { id },
      data: { available: !product.available },
    });
  }

  async toggleProductActive(id: string) {
    const product = await this.findProductById(id);
    return this.prisma.product.update({
      where: { id },
      data: { active: !product.active },
    });
  }

  async deleteProduct(id: string) {
    await this.findProductById(id);
    return this.prisma.product.delete({ where: { id } });
  }

  // ====== CARDÁPIO COMPLETO (para loja/PDV) ======
  async getFullMenu() {
    const categories = await this.prisma.category.findMany({
      where: { active: true, showOnStore: true },
      include: {
        products: {
          where: { active: true, showOnStore: true },
          include: { addons: { where: { active: true } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const combos = await this.prisma.combo.findMany({
      where: { active: true, showOnStore: true },
      include: { items: { include: { product: true } } },
    });

    const banners = await this.prisma.banner.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });

    return { categories, combos, banners };
  }
}
