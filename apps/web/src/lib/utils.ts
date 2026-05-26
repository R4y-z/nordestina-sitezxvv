import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatDate(date: string | Date, format: 'date' | 'datetime' | 'time' = 'datetime'): string {
  const d = new Date(date);
  if (format === 'date') return d.toLocaleDateString('pt-BR');
  if (format === 'time') return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export function getOrderStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'Pendente',
    CONFIRMED: 'Confirmado',
    PREPARING: 'Em Preparo',
    READY: 'Pronto',
    DELIVERING: 'Saiu para Entrega',
    DELIVERED: 'Entregue',
    CANCELLED: 'Cancelado',
    REFUNDED: 'Reembolsado',
  };
  return map[status] || status;
}

export function getOrderStatusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    PREPARING: 'bg-orange-100 text-orange-800',
    READY: 'bg-green-100 text-green-800',
    DELIVERING: 'bg-purple-100 text-purple-800',
    DELIVERED: 'bg-gray-100 text-gray-600',
    CANCELLED: 'bg-red-100 text-red-800',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
}

export function getOrderTypeLabel(type: string): string {
  const map: Record<string, string> = {
    TABLE: 'Mesa',
    DELIVERY: 'Delivery',
    TAKEAWAY: 'Retirada',
    QUENTINHA: 'Quentinha',
  };
  return map[type] || type;
}

export function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    ADMIN: 'Administrador',
    MANAGER: 'Gerente',
    CASHIER: 'Caixa',
    WAITER: 'Garçom',
    KITCHEN: 'Cozinha',
    DELIVERY: 'Entregador',
  };
  return map[role] || role;
}
