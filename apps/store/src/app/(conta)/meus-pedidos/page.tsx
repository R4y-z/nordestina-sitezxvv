'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, ChevronRight, RefreshCw } from 'lucide-react';
import { storeApi } from '@/lib/api';
import { formatCurrency, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils';
import type { Order } from '@/types';
import { cn } from '@/lib/utils';

export default function MeusPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data } = await storeApi.get('/customers/me/orders');
      setOrders(data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { loadOrders(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-stone-900">Meus Pedidos</h1>
        <button onClick={loadOrders} className="p-2 rounded-xl hover:bg-stone-100 transition-colors">
          <RefreshCw className="w-4 h-4 text-stone-400" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-stone-200" />
          <p className="text-stone-500 font-medium">Você ainda não fez nenhum pedido</p>
          <Link href="/cardapio" className="btn-brand mt-4 inline-flex">Ver Cardápio</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <Link key={order.id} href={`/pedido/${order.id}`} className="card p-4 flex items-center gap-4 hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-stone-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-stone-900">#{order.orderNumber}</span>
                  <span className={cn('badge', ORDER_STATUS_COLORS[order.status])}>{ORDER_STATUS_LABELS[order.status]}</span>
                </div>
                <p className="text-sm text-stone-500">
                  {order.items.length} iten{order.items.length !== 1 ? 's' : 's'} · {formatDate(order.createdAt, 'datetime')}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-brand-600">{formatCurrency(order.total)}</p>
                <ChevronRight className="w-4 h-4 text-stone-300 ml-auto mt-1 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
