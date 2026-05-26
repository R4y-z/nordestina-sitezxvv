export type Role = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'WAITER' | 'KITCHEN' | 'DELIVERY';
export type ComandaStatus = 'ABERTA' | 'FECHAMENTO' | 'FINALIZADA' | 'CANCELADA';
export type ComandaItemTipo = 'UNITARIO' | 'KG';
export type OrderType = 'TABLE' | 'DELIVERY' | 'TAKEAWAY' | 'QUENTINHA';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'VOUCHER' | 'PAYMENT_LINK' | 'MIXED';
export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  avatar?: string;
  active: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  color?: string;
  icon?: string;
  sortOrder: number;
  active: boolean;
  showOnStore: boolean;
  _count?: { products: number };
}

export interface ProductAddon {
  id: string;
  name: string;
  price: number;
  maxQty: number;
  minQty: number;
  active: boolean;
}

export interface Product {
  id: string;
  categoryId: string;
  category?: Category;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  price: number;
  costPrice: number;
  promotionalPrice?: number;
  active: boolean;
  available: boolean;
  showOnStore: boolean;
  featuredOnStore: boolean;
  isKgProduct: boolean;
  preparationTime: number;
  addons?: ProductAddon[];
}

export interface Table {
  id: string;
  number: number;
  name?: string;
  capacity: number;
  status: TableStatus;
  area?: string;
  active: boolean;
  orders?: Order[];
  activeOrders?: number;
  totalValue?: number;
  since?: string;
}

export interface OrderItem {
  id: string;
  productId?: string;
  product?: { id: string; name: string; image?: string };
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  addons?: { name: string; price: number; quantity: number }[];
}

export interface Order {
  id: string;
  orderNumber: string;
  type: OrderType;
  status: OrderStatus;
  tableId?: string;
  table?: { id: string; number: number; name?: string };
  customerId?: string;
  customer?: { id: string; name: string; phone?: string };
  subtotal: number;
  discount: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  notes?: string;
  items: OrderItem[];
  payments?: Payment[];
  delivery?: Delivery;
  estimatedTime?: number;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  preparingAt?: string;
  readyAt?: string;
  deliveredAt?: string;
}

export interface Payment {
  id: string;
  method: PaymentMethod;
  status: string;
  amount: number;
  change?: number;
  paidAt?: string;
}

export interface Delivery {
  id: string;
  status: string;
  deliverer?: { id: string; name: string };
  fee: number;
  estimatedTime?: number;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  cpf?: string;
  totalOrders: number;
  totalSpent: number;
  addresses?: CustomerAddress[];
  createdAt: string;
}

export interface CustomerAddress {
  id: string;
  label: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

export interface DashboardOverview {
  today: { orders: number; revenue: number; avgTicket: number };
  week: { revenue: number };
  month: { revenue: number };
  live: { activeOrders: number; occupiedTables: number; pendingDeliveries: number; kitchenOrders: number };
}

export interface StockItem {
  id: string;
  name: string;
  unit: string;
  currentQty: number;
  minQty: number;
  costPerUnit: number;
  active: boolean;
  product?: { name: string; image?: string };
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  supplier?: string;
}

// ─── Comandas (Self-Service por KG) ──────────────────────────────────────────

export interface ComandaItem {
  id: string;
  comandaId: string;
  productId?: string;
  product?: { id: string; name: string; isKgProduct: boolean; image?: string };
  name: string;
  tipo: ComandaItemTipo;
  quantity: number;
  peso?: number;       // em KG — preenchido quando tipo === 'KG'
  price: number;       // preço unitário ou por KG
  subtotal: number;    // calculado
  notes?: string;
  createdAt: string;
}

export interface ComandaPayment {
  id: string;
  comandaId: string;
  method: PaymentMethod;
  amount: number;
  change: number;
  notes?: string;
  paidAt: string;
}

export interface Comanda {
  id: string;
  numero: string;
  status: ComandaStatus;
  tableId?: string;
  table?: { id: string; number: number; name?: string };
  createdById?: string;
  createdBy?: { id: string; name: string };
  observacao?: string;
  totalValue: number;
  openedAt: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  items: ComandaItem[];
  payments: ComandaPayment[];
}

export interface RelatorioComandas {
  date: string;
  totalComandas: number;
  abertas: number;
  finalizadas: number;
  canceladas: number;
  faturamento: number;
  ticketMedio: number;
  totalKgVendido: number;
  porMetodo: Record<string, number>;
}
