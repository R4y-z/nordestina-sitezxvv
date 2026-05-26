export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  order: number;
  active: boolean;
  products?: Product[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  costPrice: number;
  categoryId: string;
  category?: Category;
  available: boolean;
  showOnStore: boolean;
  preparationTime: number;
  image?: string;
  addons?: ProductAddon[];
}

export interface ProductAddon {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  addons: ProductAddon[];
  notes?: string;
  subtotal: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  addresses?: CustomerAddress[];
}

export interface CustomerAddress {
  id: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode?: string;
  isDefault: boolean;
}

export interface DeliveryNeighborhood {
  id: string;
  name: string;
  fee: number;
  estimatedTime: number;
  active: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  type: 'DELIVERY' | 'TAKEOUT' | 'TABLE';
  status: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  items: OrderItem[];
  payments?: Payment[];
  delivery?: {
    id: string;
    status: string;
    estimatedTime?: number;
    deliverer?: { name: string };
  };
  deliveryAddress?: string;
  deliveryNeighborhood?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  total: number;
  notes?: string;
  addons?: { addon: ProductAddon; quantity: number }[];
}

export interface Payment {
  id: string;
  method: string;
  amount: number;
  status: string;
  pixCode?: string;
  pixQrCode?: string;
}
