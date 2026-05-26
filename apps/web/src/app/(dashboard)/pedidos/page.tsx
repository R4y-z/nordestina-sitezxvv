'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, RefreshCw, Eye, X, Clock, Ban, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, getOrderStatusLabel, getOrderStatusColor, getOrderTypeLabel } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import type { Order, OrderStatus, Role } from '@/types';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'PENDING',    label: 'Pendente'       },
  { value: 'CONFIRMED',  label: 'Confirmado'     },
  { value: 'PREPARING',  label: 'Em Preparo'     },
  { value: 'READY',      label: 'Pronto'         },
  { value: 'DELIVERING', label: 'Saiu p/ Entrega'},
  { value: 'DELIVERED',  label: 'Entregue'       },
  { value: 'CANCELLED',  label: 'Cancelado'      },
];

const TYPE_OPTIONS = [
  { value: '',          label: 'Todos os tipos' },
  { value: 'TABLE',     label: 'Mesa'           },
  { value: 'DELIVERY',  label: 'Delivery'       },
  { value: 'TAKEAWAY',  label: 'Retirada'       },
  { value: 'QUENTINHA', label: 'Quentinha'      },
];

/**
 * Próximo status possível para avanço rápido.
 * Controle por role acontece em canAdvance().
 */
const NEXT_STATUS: Record<string, OrderStatus> = {
  PENDING:    'CONFIRMED',
  CONFIRMED:  'PREPARING',
  PREPARING:  'READY',
  READY:      'DELIVERING',
  DELIVERING: 'DELIVERED',
};

const NEXT_STATUS_LABEL: Record<string, string> = {
  PENDING:    'Confirmar',
  CONFIRMED:  'Enviar p/ Cozinha',
  PREPARING:  'Marcar Pronto',
  READY:      'Saiu p/ Entrega',
  DELIVERING: 'Entregue',
};

/** Quem pode criar pedidos */
const CAN_CREATE: Role[] = ['ADMIN', 'MANAGER', 'CASHIER', 'WAITER'];
/** Quem pode cancelar pedidos */
const CAN_CANCEL: Role[] = ['ADMIN', 'MANAGER', 'CASHIER', 'WAITER'];

/**
 * Garçom só avança até PREPARING (envia para cozinha).
 * Delivery avança a partir de READY.
 * Kitchen avança CONFIRMED→PREPARING→READY.
 * Cashier/Manager/Admin podem avançar qualquer status.
 */
function canAdvance(role: Role, currentStatus: string): boolean {
  if (['ADMIN', 'MANAGER', 'CASHIER'].includes(role)) return true;
  if (role === 'WAITER')   return ['PENDING', 'CONFIRMED'].includes(currentStatus);
  if (role === 'KITCHEN')  return ['CONFIRMED', 'PREPARING'].includes(currentStatus);
  if (role === 'DELIVERY') return ['READY', 'DELIVERING'].includes(currentStatus);
  return false;
}

// ─── Formulário de novo pedido ───────────────────────────────────────────────

interface NewOrderForm {
  type: string;
  tableId: string;
  tableNum: string;
  notes: string;
}

const EMPTY_FORM: NewOrderForm = { type: 'TABLE', tableId: '', tableNum: '', notes: '' };

export default function PedidosPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const role = (user?.role ?? '') as Role;

  const [orders, setOrders]     = useState<Order[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [filters, setFilters]   = useState({
    status: '',
    type: '',
    date: new Date().toISOString().slice(0, 10),
  });
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);
  const [total, setTotal]   = useState(0);

  // Modal novo pedido
  const [showCreate, setShowCreate] = useState(false);
  const [tables, setTables]         = useState<any[]>([]);
  const [form, setForm]             = useState<NewOrderForm>(EMPTY_FORM);
  const [creating, setCreating]     = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const canCreate = CAN_CREATE.includes(role);
  const canCancel = CAN_CANCEL.includes(role);

  // Pré-preenche quando vem da página de mesas (?newOrder=1&tableId=…)
  useEffect(() => {
    const newOrder = searchParams.get('newOrder');
    const tableId  = searchParams.get('tableId') ?? '';
    const tableNum = searchParams.get('tableNum') ?? '';
    if (newOrder === '1' && canCreate) {
      setForm({ type: 'TABLE', tableId, tableNum, notes: '' });
      setShowCreate(true);
      loadTables();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (filters.status) params.set('status', filters.status);
      if (filters.type)   params.set('type',   filters.type);
      if (filters.date)   params.set('date',   filters.date);

      const { data } = await api.get(`/orders?${params}`);
      setOrders(data.items);
      setTotal(data.total);
    } catch {
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  const loadTables = async () => {
    try {
      const { data } = await api.get('/tables/map');
      setTables(data);
    } catch { /* silencioso */ }
  };

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // ─── Ações ───────────────────────────────────────────────────────────────

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      toast.success('Status atualizado');
      loadOrders();
      if (selected?.id === orderId) {
        const { data } = await api.get(`/orders/${orderId}`);
        setSelected(data);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erro ao atualizar status');
    }
  };

  const cancelOrder = async (orderId: string) => {
    if (!confirm('Cancelar este pedido?')) return;
    setCancelling(true);
    try {
      await api.patch(`/orders/${orderId}/cancel`);
      toast.success('Pedido cancelado');
      loadOrders();
      if (selected?.id === orderId) setSelected(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erro ao cancelar pedido');
    } finally {
      setCancelling(false);
    }
  };

  const createOrder = async () => {
    if (form.type === 'TABLE' && !form.tableId) {
      toast.error('Selecione uma mesa');
      return;
    }
    setCreating(true);
    try {
      await api.post('/orders', {
        type:    form.type,
        tableId: form.type === 'TABLE' ? form.tableId : undefined,
        notes:   form.notes || undefined,
        items:   [],
      });
      toast.success('Pedido criado! Adicione os itens.');
      setShowCreate(false);
      setForm(EMPTY_FORM);
      loadOrders();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erro ao criar pedido');
    } finally {
      setCreating(false);
    }
  };

  // ─── Filtragem local ──────────────────────────────────────────────────────

  const filtered = orders.filter(o =>
    !search ||
    o.orderNumber.includes(search) ||
    o.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
    String(o.table?.number).includes(search),
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pedidos</h1>
          <p className="page-subtitle">{total} pedido{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadOrders} className="btn-outline">
            <RefreshCw className="w-4 h-4" />
          </button>
          {canCreate && (
            <button
              onClick={() => { loadTables(); setShowCreate(true); }}
              className="btn-accent flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Novo Pedido
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar pedido, cliente, mesa..."
              className="input pl-9"
            />
          </div>
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="input w-44">
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))} className="input w-40">
            {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input
            type="date"
            value={filters.date}
            onChange={e => setFilters(f => ({ ...f, date: e.target.value }))}
            className="input w-40"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Tipo</th>
                <th>Cliente / Mesa</th>
                <th>Itens</th>
                <th>Total</th>
                <th>Status</th>
                <th>Horário</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j}><div className="h-4 bg-stone-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-stone-400 py-12">
                    Nenhum pedido encontrado
                  </td>
                </tr>
              ) : filtered.map(order => (
                <tr key={order.id}>
                  <td><span className="font-mono font-semibold text-stone-900">{order.orderNumber}</span></td>
                  <td><span className="text-xs font-medium text-stone-600">{getOrderTypeLabel(order.type)}</span></td>
                  <td>
                    <span className="text-sm text-stone-700">
                      {order.table ? `Mesa ${order.table.number}` : order.customer?.name || '—'}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm text-stone-500">
                      {order.items?.length || 0} ite{order.items?.length !== 1 ? 'ns' : 'm'}
                    </span>
                  </td>
                  <td><span className="font-semibold text-stone-900">{formatCurrency(order.total)}</span></td>
                  <td>
                    <span className={`badge ${getOrderStatusColor(order.status)}`}>
                      {getOrderStatusLabel(order.status)}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1 text-xs text-stone-400">
                      <Clock className="w-3 h-3" />
                      {formatDate(order.createdAt, 'time')}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelected(order)} className="btn-sm btn-ghost px-2">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {/* Avançar status — visível conforme role */}
                      {NEXT_STATUS[order.status] && canAdvance(role, order.status) && (
                        <button
                          onClick={() => updateStatus(order.id, NEXT_STATUS[order.status])}
                          className="btn-sm bg-amber-500 text-brown-950 hover:bg-amber-400 px-2.5 text-xs font-medium"
                        >
                          {NEXT_STATUS_LABEL[order.status]}
                        </button>
                      )}
                      {/* Cancelar — visível para garçom, caixa, gerente/admin */}
                      {canCancel && !['CANCELLED', 'DELIVERED'].includes(order.status) && (
                        <button
                          onClick={() => cancelOrder(order.id)}
                          className="btn-sm btn-ghost px-2 text-red-400 hover:text-red-600"
                          title="Cancelar pedido"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginação simples */}
      {total > 15 && (
        <div className="flex justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-outline btn-sm">Anterior</button>
          <span className="text-sm text-stone-500 self-center">Página {page}</span>
          <button disabled={page * 15 >= total} onClick={() => setPage(p => p + 1)} className="btn-outline btn-sm">Próxima</button>
        </div>
      )}

      {/* ─── Modal detalhe do pedido ─────────────────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-stone-900">Pedido {selected.orderNumber}</h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  {getOrderTypeLabel(selected.type)} · {formatDate(selected.createdAt)}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100">
                <X className="w-4 h-4 text-stone-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`badge ${getOrderStatusColor(selected.status)}`}>{getOrderStatusLabel(selected.status)}</span>
                {selected.table    && <span className="badge bg-stone-100 text-stone-600">Mesa {selected.table.number}</span>}
                {selected.customer && <span className="text-sm text-stone-600">{selected.customer.name}</span>}
              </div>

              {/* Items */}
              <div>
                <p className="text-sm font-semibold text-stone-700 mb-2">Itens</p>
                <div className="space-y-2">
                  {selected.items?.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div>
                        <span className="font-medium text-stone-900">{item.quantity}x {item.name}</span>
                        {item.notes && <p className="text-xs text-stone-400">Obs: {item.notes}</p>}
                        {item.addons?.map(a => (
                          <p key={a.name} className="text-xs text-stone-400">+ {a.name}</p>
                        ))}
                      </div>
                      <span className="text-stone-700">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-stone-100 pt-3 space-y-1">
                <div className="flex justify-between text-sm text-stone-500">
                  <span>Subtotal</span><span>{formatCurrency(selected.subtotal)}</span>
                </div>
                {selected.discount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Desconto</span><span>-{formatCurrency(selected.discount)}</span>
                  </div>
                )}
                {selected.deliveryFee > 0 && (
                  <div className="flex justify-between text-sm text-stone-500">
                    <span>Taxa de entrega</span><span>{formatCurrency(selected.deliveryFee)}</span>
                  </div>
                )}
                {selected.serviceFee > 0 && (
                  <div className="flex justify-between text-sm text-stone-500">
                    <span>Taxa de serviço (10%)</span><span>{formatCurrency(selected.serviceFee)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-stone-900 text-base pt-1 border-t border-stone-100">
                  <span>Total</span><span>{formatCurrency(selected.total)}</span>
                </div>
              </div>

              {/* Ações do detalhe */}
              <div className="space-y-2 pt-1">
                {/* Avançar status */}
                {NEXT_STATUS[selected.status] && canAdvance(role, selected.status) && (
                  <button
                    onClick={() => updateStatus(selected.id, NEXT_STATUS[selected.status])}
                    className="w-full btn-accent flex items-center justify-center gap-2"
                  >
                    {NEXT_STATUS_LABEL[selected.status]}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
                {/* Cancelar pedido */}
                {canCancel && !['CANCELLED', 'DELIVERED'].includes(selected.status) && (
                  <button
                    disabled={cancelling}
                    onClick={() => cancelOrder(selected.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 font-semibold transition-colors disabled:opacity-50"
                  >
                    <Ban className="w-4 h-4" />
                    {cancelling ? 'Cancelando...' : 'Cancelar Pedido'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal novo pedido ───────────────────────────────────────────────── */}
      {showCreate && canCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-stone-100">
              <h3 className="font-bold text-stone-900">Novo Pedido</h3>
              <button onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100">
                <X className="w-4 h-4 text-stone-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Tipo */}
              <div>
                <label className="label">Tipo do Pedido</label>
                <div className="grid grid-cols-2 gap-2">
                  {TYPE_OPTIONS.filter(t => t.value).map(t => (
                    <button
                      key={t.value}
                      onClick={() => setForm(f => ({ ...f, type: t.value, tableId: '' }))}
                      className={`px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                        form.type === t.value
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-stone-200 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mesa (somente para tipo TABLE) */}
              {form.type === 'TABLE' && (
                <div>
                  <label className="label">Mesa *</label>
                  <select
                    value={form.tableId}
                    onChange={e => {
                      const t = tables.find(x => x.id === e.target.value);
                      setForm(f => ({ ...f, tableId: e.target.value, tableNum: t ? String(t.number) : '' }));
                    }}
                    className="input"
                  >
                    <option value="">Selecione uma mesa</option>
                    {tables
                      .filter(t => ['AVAILABLE', 'OCCUPIED'].includes(t.status))
                      .map(t => (
                        <option key={t.id} value={t.id}>
                          Mesa {t.number} — {t.status === 'OCCUPIED' ? 'Ocupada' : 'Livre'}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Observações */}
              <div>
                <label className="label">Observações (opcional)</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Ex.: sem cebola, entrar pela lateral..."
                  className="input h-20 resize-none py-2.5 text-sm"
                />
              </div>

              <p className="text-xs text-stone-400">
                Após criar o pedido, adicione os itens pelo botão de detalhes.
              </p>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); }}
                  className="flex-1 btn-ghost"
                >
                  Cancelar
                </button>
                <button
                  onClick={createOrder}
                  disabled={creating || (form.type === 'TABLE' && !form.tableId)}
                  className="flex-1 btn-accent disabled:opacity-50"
                >
                  {creating ? 'Criando...' : 'Criar Pedido'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
