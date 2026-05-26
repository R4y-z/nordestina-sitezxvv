import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed...');

  // Usuários
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@restaurante.com' },
    update: {},
    create: { name: 'Administrador', email: 'admin@restaurante.com', password: adminPassword, role: Role.ADMIN, pin: '0000' },
  });

  await prisma.user.upsert({
    where: { email: 'caixa@restaurante.com' },
    update: {},
    create: { name: 'Caixa Principal', email: 'caixa@restaurante.com', password: await bcrypt.hash('caixa123', 12), role: Role.CASHIER, pin: '1234' },
  });

  await prisma.user.upsert({
    where: { email: 'cozinha@restaurante.com' },
    update: {},
    create: { name: 'Cozinha', email: 'cozinha@restaurante.com', password: await bcrypt.hash('cozinha123', 12), role: Role.KITCHEN, pin: '5678' },
  });

  await prisma.user.upsert({
    where: { email: 'garcom@restaurante.com' },
    update: {},
    create: { name: 'Garçom 1', email: 'garcom@restaurante.com', password: await bcrypt.hash('garcom123', 12), role: Role.WAITER, pin: '9999' },
  });

  await prisma.user.upsert({
    where: { email: 'delivery@restaurante.com' },
    update: {},
    create: { name: 'Entregador 1', email: 'delivery@restaurante.com', password: await bcrypt.hash('delivery123', 12), role: Role.DELIVERY, pin: '4321' },
  });

  console.log('Usuários criados');

  // Categorias
  const categories = [
    { name: 'Lanches', slug: 'lanches', color: '#F59E0B', icon: '🍔', sortOrder: 1 },
    { name: 'Pizzas', slug: 'pizzas', color: '#EF4444', icon: '🍕', sortOrder: 2 },
    { name: 'Porções', slug: 'porcoes', color: '#8B5CF6', icon: '🍟', sortOrder: 3 },
    { name: 'Bebidas', slug: 'bebidas', color: '#3B82F6', icon: '🥤', sortOrder: 4 },
    { name: 'Sobremesas', slug: 'sobremesas', color: '#EC4899', icon: '🍰', sortOrder: 5 },
    { name: 'Quentinhas', slug: 'quentinhas', color: '#10B981', icon: '🍱', sortOrder: 6 },
    { name: 'Self-Service KG', slug: 'self-service', color: '#6B7280', icon: '⚖️', sortOrder: 7 },
  ];

  const createdCategories: any = {};
  for (const cat of categories) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    createdCategories[cat.slug] = c.id;
  }
  console.log('Categorias criadas');

  // Produtos
  const products = [
    { categoryId: createdCategories['lanches'], name: 'X-Burguer', slug: 'x-burguer', price: 18.90, costPrice: 7.00, preparationTime: 12, description: 'Pão, hamburguer 150g, queijo, alface, tomate' },
    { categoryId: createdCategories['lanches'], name: 'X-Bacon', slug: 'x-bacon', price: 22.90, costPrice: 9.00, preparationTime: 15, description: 'Pão, hamburguer 150g, bacon, queijo, alface, tomate' },
    { categoryId: createdCategories['lanches'], name: 'X-Tudo', slug: 'x-tudo', price: 28.90, costPrice: 12.00, preparationTime: 18, description: 'Pão, hamburguer duplo, bacon, ovo, queijo, milho, alface, tomate' },
    { categoryId: createdCategories['lanches'], name: 'Combo X-Burguer', slug: 'combo-x-burguer', price: 24.90, costPrice: 10.00, preparationTime: 15, description: 'X-Burguer + Batata Frita + Refrigerante' },
    { categoryId: createdCategories['pizzas'], name: 'Pizza Margherita', slug: 'pizza-margherita', price: 45.90, costPrice: 18.00, preparationTime: 25, description: 'Molho de tomate, mussarela, manjericão' },
    { categoryId: createdCategories['pizzas'], name: 'Pizza Frango com Catupiry', slug: 'pizza-frango-catupiry', price: 49.90, costPrice: 20.00, preparationTime: 25 },
    { categoryId: createdCategories['pizzas'], name: 'Pizza Calabresa', slug: 'pizza-calabresa', price: 47.90, costPrice: 19.00, preparationTime: 25 },
    { categoryId: createdCategories['porcoes'], name: 'Batata Frita (P)', slug: 'batata-frita-p', price: 12.90, costPrice: 4.00, preparationTime: 10 },
    { categoryId: createdCategories['porcoes'], name: 'Batata Frita (G)', slug: 'batata-frita-g', price: 18.90, costPrice: 6.00, preparationTime: 10 },
    { categoryId: createdCategories['porcoes'], name: 'Onion Rings', slug: 'onion-rings', price: 16.90, costPrice: 5.50, preparationTime: 12 },
    { categoryId: createdCategories['bebidas'], name: 'Refrigerante Lata', slug: 'refrigerante-lata', price: 5.90, costPrice: 2.50, preparationTime: 0 },
    { categoryId: createdCategories['bebidas'], name: 'Suco Natural 500ml', slug: 'suco-natural', price: 10.90, costPrice: 3.50, preparationTime: 5 },
    { categoryId: createdCategories['bebidas'], name: 'Água Mineral', slug: 'agua-mineral', price: 3.90, costPrice: 1.00, preparationTime: 0 },
    { categoryId: createdCategories['sobremesas'], name: 'Brownie', slug: 'brownie', price: 8.90, costPrice: 3.00, preparationTime: 3 },
    { categoryId: createdCategories['sobremesas'], name: 'Sorvete 2 Bolas', slug: 'sorvete-2-bolas', price: 9.90, costPrice: 3.50, preparationTime: 3 },
    { categoryId: createdCategories['quentinhas'], name: 'Quentinha Básica', slug: 'quentinha-basica', price: 15.90, costPrice: 7.00, preparationTime: 20, description: 'Arroz, feijão, carne e salada' },
    { categoryId: createdCategories['quentinhas'], name: 'Quentinha Executiva', slug: 'quentinha-executiva', price: 19.90, costPrice: 9.00, preparationTime: 20, description: 'Arroz, feijão, 2 tipos de carne, salada e suco' },
    { categoryId: createdCategories['self-service'], name: 'Self-Service por KG', slug: 'self-service-kg', price: 45.90, costPrice: 20.00, preparationTime: 0, isKgProduct: true, description: 'Preço por KG. Buffet completo.' },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }
  console.log('Produtos criados');

  // Mesas
  for (let i = 1; i <= 15; i++) {
    await prisma.table.upsert({
      where: { number: i },
      update: {},
      create: {
        number: i,
        name: `Mesa ${i}`,
        capacity: i <= 5 ? 2 : i <= 10 ? 4 : 6,
        area: i <= 5 ? 'Entrada' : i <= 10 ? 'Salão Principal' : 'Varanda',
      },
    });
  }
  console.log('Mesas criadas');

  // Bairros de delivery
  const neighborhoods = [
    { name: 'Centro', city: 'Cidade', fee: 5.00, minTime: 30, maxTime: 45 },
    { name: 'Bairro A', city: 'Cidade', fee: 7.00, minTime: 35, maxTime: 50 },
    { name: 'Bairro B', city: 'Cidade', fee: 8.00, minTime: 40, maxTime: 60 },
    { name: 'Bairro C', city: 'Cidade', fee: 10.00, minTime: 45, maxTime: 70 },
    { name: 'Bairro D', city: 'Cidade', fee: 12.00, minTime: 50, maxTime: 80 },
  ];

  for (const nb of neighborhoods) {
    await prisma.deliveryNeighborhood.upsert({
      where: { id: `nb_${nb.name.toLowerCase().replace(' ', '_')}` },
      update: {},
      create: nb,
    }).catch(() => prisma.deliveryNeighborhood.create({ data: nb }));
  }
  console.log('Bairros criados');

  // Configurações do sistema
  const configs = [
    { key: 'restaurant_name', value: 'Restaurante Nordestina', description: 'Nome do restaurante' },
    { key: 'restaurant_phone', value: '(11) 99999-9999', description: 'Telefone' },
    { key: 'restaurant_address', value: 'Rua Principal, 100 - Centro', description: 'Endereço' },
    { key: 'service_fee_enabled', value: 'true', description: 'Cobrar taxa de serviço (10%)' },
    { key: 'delivery_enabled', value: 'true', description: 'Delivery ativo' },
    { key: 'min_order_delivery', value: '25.00', description: 'Pedido mínimo para delivery' },
    { key: 'opening_hours', value: '11:00-23:00', description: 'Horário de funcionamento' },
    { key: 'whatsapp_number', value: '5511999999999', description: 'WhatsApp para notificações' },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }
  console.log('Configurações criadas');

  console.log('Seed concluído!');
  console.log('\n=== CREDENCIAIS DE ACESSO ===');
  console.log('Admin: admin@restaurante.com / admin123 / PIN: 0000');
  console.log('Caixa: caixa@restaurante.com / caixa123 / PIN: 1234');
  console.log('Cozinha: cozinha@restaurante.com / cozinha123 / PIN: 5678');
  console.log('Garçom: garcom@restaurante.com / garcom123 / PIN: 9999');
  console.log('Delivery: delivery@restaurante.com / delivery123 / PIN: 4321');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
