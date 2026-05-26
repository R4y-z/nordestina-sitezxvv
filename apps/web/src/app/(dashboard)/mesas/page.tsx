'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Users, Clock, ShoppingBag, X, Plus, CheckCircle, XCircle, AlertCircle, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatCurrency, timeAgo } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import type { Role } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE:   'bg-emerald-50  border-emerald-200  text-emerald-700',
  OCCUPIED:    'bg-red-50      border-red-200       text-red-700',
  RESERVED:    'bg-amber-50    border-amber-200     text-amber-700',
  MAINTENANCE: 'bg-stone-50   border-stone-200     text-stone-500',
};

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE:   'Livre',
  OCCUPIED:    'Ocupada',
  RESERVED:    'Reservada',
  MAINTENANCE: 'Manutenção',
};

/** Roles que podem operar mesas */
const CAN_OPERATE: Role[] = ['ADMIN', 'MANAGER', 'CASHIER', 'WAITER'];
/** Roles que podem criar pedidos */
const CAN_ORDER:   Role[] = ['ADMIN', 'MANAGER', 'CASHIER', 'WAITER'];
/** Roles que podem colocar em manutenção */
const CAN_MAINTAIN: Role[] = ['ADMIN', 'MANAGER', 'CASHIER'];

export default function MesasPage() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [selected, setSelected] = useState<any | null>(null);
  const [actioning, setActioning] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const role = (user?.role ?? '') as Role;
  const canOperate = CAN_OPERATE.includes(role);
  const canOrder   = CAN_ORDER.includes(role);
  const canMaintain = CAN_MAINTAIN.includes(role);

  const loadTables = useCallback(async () => {
    try {
      const { data } = await api.get('/tables/map');
      setTables(data);
    } catch {
      toast.error('Erro ao carregar mesas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTables();
    const interval = setInterval(loadTables, 30_000);
    return () => clearInterval(interval);
  }, [loadTables]);

  const tableAction = async (id: string, action: 'open' | 'close' | 'status', status?: string) => {
    setActioning(true);
    try {
      if (action === 'open') {
        await api.patch(`/tables/${id}/open`);
        toast.success('Mesa aberta');
      } else if (action === 'close') {
        await api.patch(`/tables/${id}/close`);
        toast.success('Mesa fechada');
      } else if (action === 'status' && status) {
        await api.patch(`/tables/${id}/status`, { status });
        toast.success(`Mesa marcada como ${STATUS_LABELS[status]}`);
      }
      setSelected(null);
      loadTables();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erro ao atualizar mesa');
    } finally {
      setActioning(false);
    }
  };

  const filtered = filter ? tables.filter(t => t.status === filter) : tables;

  const stats = {
    total:     tables.length,
    available: tables.filter(t => t.status === 'AVAILABLE').length,
    occupied:  tables.filter(t => t.status === 'OCCUPIED').length,
    reserved:  tables.filter(t => t.status === 'RESERVED').length,
  };

  // Atualiza `selected` sempre que `tables` mudar (mantém dados frescos no modal)
  useEffect(() => {
    if (!selected) return;
    const fresh = tables.find(t => t.id === selected.id);
    if (fresh) setSelected(fresh);
  }, [tables]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mesas</h1>
          <p className="page-subtitle">{stats.occupied} ocupada{stats.occupied !== 1 ? 's' : ''} de {stats.total}</p>
        </div>
        <button onClick={loadTables} className="btn-outline">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total',     value: stats.total,     color: 'text-stone-700  bg-stone-100'  },
          { label: 'Livres',    value: stats.available, color: 'text-emerald-700 bg-emerald-100' },
          { label: 'Ocupadas',  value: stats.occupied,  color: 'text-red-700    bg-red-100'    },
          { label: 'Reservadas',value: stats.reserved,  color: 'text-amber-700  bg-amber-100'  },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className={cn('text-3xl font-bold', s.color.split(' ')[0])}>{s.value}</p>
            <p className="text-xs text-stone-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['', 'AVAILABLE', 'OCCUPIED', 'RESERVED'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              'btn-sm rounded-full border',
              filter === s
                ? 'bg-brown-700 text-white border-brown-700'
                : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300',
            )}
          >
            {s === '' ? 'Todas' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Table grid */}
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-32 bg-stone-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        Array.from(new Set(tables.map(t => t.area || 'Salão'))).map(area => {
          const areaTables = filtered.filter(t => (t.area || 'Salão') === area);
          if (areaTables.length === 0) return null;
          return (
            <div key={area}>
              <h3 className="text-sm font-semibold text-stone-500 mb-3 uppercase tracking-wider">{area}</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {areaTables.map(table => (
                  <div
                    key={table.id}
                    onClick={() => canOperate && setSelected(table)}
                    className={cn(
                      'relative p-4 rounded-xl border-2 transition-all hover:shadow-md',
                      STATUS_COLORS[table.status] || 'bg-white border-stone-200',
                      canOperate ? 'cursor-pointer' : 'cursor-default',
                    )}
                  >
                    <div className="text-center">
                      <p className="text-2xl font-bold">{table.number}</p>
                      <p className="text-xs font-medium mt-0.5">{STATUS_LABELS[table.status]}</p>
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center gap-1 text-xs opacity-70">
                        <Users className="w-3 h-3" />
                        <span>{table.capacity} lugares</span>
                      </div>
                      {table.status === 'OCCUPIED' && (
                        <>
                          <div className="flex items-center gap-1 text-xs opacity-70">
                            <ShoppingBag className="w-3 h-3" />
                            <span>{table.activeOrders} pedido{table.activeOrders !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="text-xs font-semibold">{formatCurrency(table.totalValue)}</div>
                          {table.since && (
                            <div className="flex items-center gap-1 text-xs opacity-60">
                              <Clock className="w-3 h-3" />
                              <span>{timeAgo(table.since)}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* ─── Painel de ações da mesa ─────────────────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in overflow-hidden">

            {/* Header */}
            <div className={cn('p-4 flex items-center justify-between', STATUS_COLORS[selected.status])}>
              <div>
                <p className="font-bold text-lg">Mesa {selected.number}</p>
                <p className="text-sm font-medium opacity-80">{STATUS_LABELS[selected.status]} · {selected.capacity} lugares</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 rounded-lg hover:bg-black/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info ocupação */}
            {selected.status === 'OCCUPIED' && (
              <div className="px-4 pt-3 flex items-center justify-between text-sm text-stone-600">
                <span className="flex items-center gap-1">
                  <ShoppingBag className="w-4 h-4" />
                  {selected.activeOrders} pedido{selected.activeOrders !== 1 ? 's' : ''} em aberto
                </span>
                <span className="font-semibold text-stone-900">{formatCurrency(selected.totalValue)}</span>
              </div>
            )}

            {/* Ações */}
            <div className="p-4 space-y-2">

              {/* Novo Pedido */}
              {canOrder && selected.status === 'OCCUPIED' && (
                <button
                  onClick={() => {
                    setSelected(null);
                    router.push(`/pedidos?newOrder=1&tableId=${selected.id}&tableNum=${selected.number}`);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500 text-brown-950 hover:bg-amber-400 font-semibold transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Novo Pedido para Mesa {selected.number}
                </button>
              )}

              {/* Abrir mesa (livre ou reservada → ocupada) */}
              {canOperate && ['AVAILABLE', 'RESERVED'].includes(selected.status) && (
                <button
                  disabled={actioning}
                  onClick={() => tableAction(selected.id, 'open')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 font-semibold transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-5 h-5" />
                  Abrir Mesa (Marcar Ocupada)
                </button>
              )}

              {/* Fechar mesa */}
              {canOperate && selected.status === 'OCCUPIED' && (
                <button
                  disabled={actioning}
                  onClick={() => tableAction(selected.id, 'close')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-stone-700 text-white hover:bg-stone-600 font-semibold transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5" />
                  Fechar Mesa
                </button>
              )}

              {/* Marcar Livre */}
              {canOperate && selected.status !== 'AVAILABLE' && (
                <button
                  disabled={actioning}
                  onClick={() => tableAction(selected.id, 'status', 'AVAILABLE')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-semibold transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-5 h-5" />
                  Marcar como Livre
                </button>
              )}

              {/* Marcar Reservada */}
              {canOperate && selected.status !== 'RESERVED' && (
                <button
                  disabled={actioning}
                  onClick={() => tableAction(selected.id, 'status', 'RESERVED')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-amber-300 text-amber-700 hover:bg-amber-50 font-semibold transition-colors disabled:opacity-50"
                >
                  <AlertCircle className="w-5 h-5" />
                  Marcar como Reservada
                </button>
              )}

              {/* Manutenção (somente caixa/gerente/admin) */}
              {canMaintain && selected.status !== 'MAINTENANCE' && (
                <button
                  disabled={actioning}
                  onClick={() => tableAction(selected.id, 'status', 'MAINTENANCE')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-stone-300 text-stone-500 hover:bg-stone-50 font-semibold transition-colors disabled:opacity-50"
                >
                  <Wrench className="w-5 h-5" />
                  Colocar em Manutenção
                </button>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
