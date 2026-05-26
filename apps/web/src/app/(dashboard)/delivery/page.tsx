'use client';

import { useEffect, useState, useCallback } from 'react';
import { Truck, MapPin, Clock, User, RefreshCw, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { formatCurrency, timeAgo, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  WAITING: 'Aguardando', ASSIGNED: 'Atribuído', PICKING_UP: 'Coletando',
  ON_THE_WAY: 'Na Rota', DELIVERED: 'Entregue', FAILED: 'Falhou',
};
const STATUS_COLORS: Record<string, string> = {
  WAITING: 'bg-yellow-100 text-yellow-800', ASSIGNED: 'bg-blue-100 text-blue-800',
  PICKING_UP: 'bg-orange-100 text-orange-800', ON_THE_WAY: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800', FAILED: 'bg-red-100 text-red-800',
};

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [deliverers, setDeliverers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [del, dlr, st] = await Promise.all([
        api.get(`/delivery${filterStatus ? `?status=${filterStatus}` : ''}`),
        api.get('/delivery/deliverers'),
        api.get('/delivery/stats'),
      ]);
      setDeliveries(del.data);
      setDeliverers(dlr.data);
      setStats(st.data);
    } catch { toast.error('Erro ao carregar delivery'); }
    finally { setLoading(false); }
  }, [filterStatus]);

  useEffect(() => { loadData(); }, [loadData]);

  const assignDeliverer = async (deliveryId: string, delivererId: string) => {
    try {
      await api.patch(`/delivery/${deliveryId}/assign`, { delivererId });
      toast.success('Entregador atribuído!');
      loadData();
    } catch { toast.error('Erro ao atribuir entregador'); }
  };

  const updateStatus = async (deliveryId: string, status: string) => {
    try {
      await api.patch(`/delivery/${deliveryId}/status`, { status });
      toast.success('Status atualizado');
      loadData();
    } catch { toast.error('Erro ao atualizar status'); }
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Delivery</h1>
          <p className="page-subtitle">{stats.total || 0} entrega{stats.total !== 1 ? 's' : ''} hoje</p>
        </div>
        <button onClick={loadData} className="btn-outline"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Aguardando', value: stats.waiting || 0, color: 'text-yellow-700 bg-yellow-100' },
          { label: 'Na Rota', value: stats.onTheWay || 0, color: 'text-purple-700 bg-purple-100' },
          { label: 'Entregues Hoje', value: stats.deliveredToday || 0, color: 'text-emerald-700 bg-emerald-100' },
          { label: 'Total Hoje', value: stats.total || 0, color: 'text-brown-700 bg-brown-100' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className={cn('text-3xl font-bold', s.color.split(' ')[0])}>{s.value}</p>
            <p className="text-xs text-stone-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['', 'WAITING', 'ASSIGNED', 'ON_THE_WAY', 'DELIVERED'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={cn('btn-sm rounded-full border', filterStatus === s ? 'bg-brown-700 text-white border-brown-700' : 'bg-white text-stone-600 border-stone-200')}>
            {s === '' ? 'Todos' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Deliveries list */}
      <div className="space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => <div key={i} className="h-28 bg-stone-100 rounded-xl animate-pulse" />)
        ) : deliveries.length === 0 ? (
          <div className="card p-12 text-center text-stone-400">
            <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma entrega encontrada</p>
          </div>
        ) : deliveries.map(delivery => (
          <div key={delivery.id} className="card p-4">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-stone-900">{delivery.order?.orderNumber}</span>
                  <span className={cn('badge', STATUS_COLORS[delivery.status])}>{STATUS_LABELS[delivery.status]}</span>
                </div>
                {delivery.order?.customer && (
                  <div className="flex items-center gap-1 text-sm text-stone-600 mb-1">
                    <User className="w-3.5 h-3.5" />
                    {delivery.order.customer.name} · {delivery.order.customer.phone}
                  </div>
                )}
                {delivery.order && (
                  <div className="flex items-center gap-1 text-xs text-stone-400 mb-2">
                    <MapPin className="w-3.5 h-3.5" />
                    {delivery.order.deliveryAddress} — {delivery.order.deliveryNeighborhood}
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-semibold text-stone-900">{formatCurrency(delivery.order?.total || 0)}</span>
                  <span className="text-stone-400">·</span>
                  <span className="text-stone-500">Taxa: {formatCurrency(delivery.fee)}</span>
                  {delivery.estimatedTime && (
                    <><span className="text-stone-400">·</span>
                    <span className="flex items-center gap-1 text-stone-500"><Clock className="w-3 h-3" />{delivery.estimatedTime}min</span></>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 items-end">
                {/* Entregador */}
                {delivery.status === 'WAITING' && (
                  <select
                    onChange={e => e.target.value && assignDeliverer(delivery.id, e.target.value)}
                    className="input text-sm w-44"
                    defaultValue=""
                  >
                    <option value="">Atribuir entregador</option>
                    {deliverers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                )}
                {delivery.deliverer && (
                  <div className="flex items-center gap-1 text-sm text-stone-600">
                    <User className="w-3.5 h-3.5" />
                    {delivery.deliverer.name}
                  </div>
                )}
                {/* Status actions */}
                {delivery.status === 'ASSIGNED' && (
                  <button onClick={() => updateStatus(delivery.id, 'ON_THE_WAY')} className="btn-sm bg-purple-500 text-white hover:bg-purple-600">
                    Saiu para entrega
                  </button>
                )}
                {delivery.status === 'ON_THE_WAY' && (
                  <button onClick={() => updateStatus(delivery.id, 'DELIVERED')} className="btn-sm bg-emerald-500 text-white hover:bg-emerald-600">
                    Confirmar entrega
                  </button>
                )}
                <span className="text-xs text-stone-400">{timeAgo(delivery.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
