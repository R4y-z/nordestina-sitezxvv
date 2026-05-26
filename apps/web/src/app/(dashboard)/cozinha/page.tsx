'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, ChefHat, Clock, CheckCircle, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { timeAgo, getOrderTypeLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function CozinhaPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const [ordersRes, statsRes] = await Promise.all([
        api.get('/kitchen/orders'),
        api.get('/kitchen/stats'),
      ]);
      setOrders(ordersRes.data);
      setStats(statsRes.data);
    } catch { toast.error('Erro ao carregar cozinha'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 15000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const handlePreparing = async (orderId: string) => {
    setUpdating(orderId);
    try {
      await api.patch(`/kitchen/orders/${orderId}/preparing`);
      toast.success('Em preparo!');
      loadOrders();
    } catch { toast.error('Erro ao atualizar'); }
    finally { setUpdating(null); }
  };

  const handleReady = async (orderId: string) => {
    setUpdating(orderId);
    try {
      await api.patch(`/kitchen/orders/${orderId}/ready`);
      toast.success('Pedido pronto! 🎉');
      loadOrders();
    } catch { toast.error('Erro ao atualizar'); }
    finally { setUpdating(null); }
  };

  const confirming = orders.filter(o => o.status === 'CONFIRMED');
  const preparing = orders.filter(o => o.status === 'PREPARING');

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cozinha</h1>
          <p className="page-subtitle">{orders.length} pedido{orders.length !== 1 ? 's' : ''} em andamento</p>
        </div>
        <button onClick={loadOrders} className="btn-outline"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'A Confirmar', value: stats.confirming || confirming.length, color: 'text-yellow-700 bg-yellow-100' },
          { label: 'Em Preparo', value: stats.preparing || preparing.length, color: 'text-orange-700 bg-orange-100' },
          { label: 'Prontos Hoje', value: stats.completedToday || 0, color: 'text-emerald-700 bg-emerald-100' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className={cn('text-3xl font-bold', s.color.split(' ')[0])}>{s.value}</p>
            <p className="text-xs text-stone-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Aguardando preparo */}
        <div className="card overflow-hidden">
          <div className="bg-yellow-50 border-b border-yellow-100 px-5 py-3">
            <h2 className="font-semibold text-yellow-800 flex items-center gap-2">
              <ChefHat className="w-4 h-4" />
              Aguardando Preparo ({confirming.length})
            </h2>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-stone-100 rounded-lg animate-pulse" />)}</div>
          ) : confirming.length === 0 ? (
            <div className="p-10 text-center text-stone-400 text-sm">Nenhum pedido aguardando</div>
          ) : (
            <div className="divide-y divide-stone-50">
              {confirming.map(order => (
                <div key={order.id} className="p-4 hover:bg-stone-50">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-bold text-stone-900 font-mono">{order.orderNumber}</span>
                      <span className="ml-2 text-xs text-stone-500">{getOrderTypeLabel(order.type)}</span>
                      {order.table && <span className="ml-1 text-xs bg-brown-100 text-brown-700 px-1.5 py-0.5 rounded">Mesa {order.table.number}</span>}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-stone-400">
                      <Clock className="w-3 h-3" />
                      {timeAgo(order.createdAt)}
                    </div>
                  </div>
                  <ul className="text-sm text-stone-600 space-y-0.5 mb-3">
                    {order.items?.map((item: any) => (
                      <li key={item.id} className="flex gap-2">
                        <span className="font-semibold text-brown-700">{item.quantity}x</span>
                        <span>{item.name}</span>
                        {item.notes && <span className="text-amber-600 text-xs">({item.notes})</span>}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handlePreparing(order.id)}
                    disabled={updating === order.id}
                    className="btn-sm bg-yellow-500 text-yellow-900 hover:bg-yellow-400 w-full"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Iniciar Preparo
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Em preparo */}
        <div className="card overflow-hidden">
          <div className="bg-orange-50 border-b border-orange-100 px-5 py-3">
            <h2 className="font-semibold text-orange-800 flex items-center gap-2">
              <ChefHat className="w-4 h-4" />
              Em Preparo ({preparing.length})
            </h2>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-stone-100 rounded-lg animate-pulse" />)}</div>
          ) : preparing.length === 0 ? (
            <div className="p-10 text-center text-stone-400 text-sm">Nenhum pedido em preparo</div>
          ) : (
            <div className="divide-y divide-stone-50">
              {preparing.map(order => (
                <div key={order.id} className="p-4 hover:bg-stone-50">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-bold text-stone-900 font-mono">{order.orderNumber}</span>
                      <span className="ml-2 text-xs text-stone-500">{getOrderTypeLabel(order.type)}</span>
                      {order.table && <span className="ml-1 text-xs bg-brown-100 text-brown-700 px-1.5 py-0.5 rounded">Mesa {order.table.number}</span>}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-orange-500 font-medium">
                      <Clock className="w-3 h-3" />
                      {order.preparingAt ? timeAgo(order.preparingAt) : '—'}
                    </div>
                  </div>
                  <ul className="text-sm text-stone-600 space-y-0.5 mb-3">
                    {order.items?.map((item: any) => (
                      <li key={item.id} className="flex gap-2">
                        <span className="font-semibold text-brown-700">{item.quantity}x</span>
                        <span>{item.name}</span>
                        {item.notes && <span className="text-amber-600 text-xs">({item.notes})</span>}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleReady(order.id)}
                    disabled={updating === order.id}
                    className="btn-sm bg-emerald-500 text-white hover:bg-emerald-600 w-full"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Marcar Pronto
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
