'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Plus, Search, RefreshCw, X, Ticket, Scale, Package,
  CreditCard, Smartphone, Banknote, CheckCircle, Ban,
  Clock, ChevronRight, Trash2, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { formatCurrency, timeAgo } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import type { Comanda, ComandaItem, ComandaStatus, PaymentMethod, Product, Role } from '@/types';

// ─── Constantes ──────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<ComandaStatus, string> = {
  ABERTA:     'Aberta',
  FECHAMENTO: 'Fechamento',
  FINALIZADA: 'Finalizada',
  CANCELADA:  'Cancelada',
};

const STATUS_COLOR: Record<ComandaStatus, string> = {
  ABERTA:     'bg-emerald-100 text-emerald-800 border-emerald-200',
  FECHAMENTO: 'bg-amber-100   text-amber-800   border-amber-200',
  FINALIZADA: 'bg-stone-100   text-stone-600   border-stone-200',
  CANCELADA:  'bg-red-100     text-red-700     border-red-200',
};

const STATUS_CARD: Record<ComandaStatus, string> = {
  ABERTA:     'border-emerald-300 bg-white',
  FECHAMENTO: 'border-amber-300   bg-amber-50',
  FINALIZADA: 'border-stone-200   bg-stone-50',
  CANCELADA:  'border-red-200     bg-red-50/30',
};

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { value: 'CASH',        label: 'Dinheiro', icon: Banknote    },
  { value: 'PIX',         label: 'PIX',      icon: Smartphone  },
  { value: 'CREDIT_CARD', label: 'Crédito',  icon: CreditCard  },
  { value: 'DEBIT_CARD',  label: 'Débito',   icon: CreditCard  },
];

const FILTER_TABS: { value: '' | ComandaStatus; label: string }[] = [
  { value: '',           label: 'Todas'      },
  { value: 'ABERTA',     label: 'Abertas'    },
  { value: 'FECHAMENTO', label: 'Fechamento' },
  { value: 'FINALIZADA', label: 'Finalizadas'},
];

const CAN_FECHAR: Role[] = ['ADMIN', 'MANAGER', 'CASHIER'];
const CAN_CANCEL: Role[] = ['ADMIN', 'MANAGER', 'CASHIER'];

// ─── Página ───────────────────────────────────────────────────────────────────

export default function ComandasPage() {
  const { user } = useAuth();
  const role = (user?.role ?? '') as Role;

  // ── State: lista ──────────────────────────────────────────────────────────
  const [comandas,  setComandas]  = useState<Comanda[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<'' | ComandaStatus>('');
  const [search,    setSearch]    = useState('');
  const [date,      setDate]      = useState(new Date().toISOString().slice(0, 10));

  // ── State: detalhe ────────────────────────────────────────────────────────
  const [detail,    setDetail]    = useState<Comanda | null>(null);

  // ── State: nova comanda ───────────────────────────────────────────────────
  const [showCreate,  setShowCreate]  = useState(false);
  const [obsCreate,   setObsCreate]   = useState('');
  const [creating,    setCreating]    = useState(false);

  // ── State: busca rápida por número ────────────────────────────────────────
  const [quickNum,   setQuickNum]    = useState('');
  const [searching,  setSearching]   = useState(false);

  // ── State: lançar item ────────────────────────────────────────────────────
  const [showItem,   setShowItem]    = useState(false);
  const [products,   setProducts]    = useState<Product[]>([]);
  const [prodSearch, setProdSearch]  = useState('');
  const [selProduct, setSelProduct]  = useState<Product | null>(null);
  const [itemTipo,   setItemTipo]    = useState<'UNITARIO' | 'KG'>('UNITARIO');
  const [itemPeso,   setItemPeso]    = useState('');
  const [itemQty,    setItemQty]     = useState('1');
  const [itemPrice,  setItemPrice]   = useState('');
  const [itemName,   setItemName]    = useState('');
  const [itemNotes,  setItemNotes]   = useState('');
  const [addingItem, setAddingItem]  = useState(false);

  // ── State: fechar conta ───────────────────────────────────────────────────
  const [showFechar,  setShowFechar]  = useState(false);
  const [pmMethod,    setPmMethod]    = useState<PaymentMethod>('CASH');
  const [pmAmount,    setPmAmount]    = useState('');
  const [pmNotes,     setPmNotes]     = useState('');
  const [fechando,    setFechando]    = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  // ─── Carregamento ─────────────────────────────────────────────────────────

  const loadComandas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ date });
      if (filter) params.set('status', filter);
      const { data } = await api.get(`/comandas?${params}&limit=100`);
      setComandas(data.items ?? data);
    } catch {
      toast.error('Erro ao carregar comandas');
    } finally {
      setLoading(false);
    }
  }, [filter, date]);

  const loadProducts = async () => {
    if (products.length > 0) return;
    try {
      const { data } = await api.get('/menu/products?active=true&limit=200');
      setProducts(data.items ?? data);
    } catch { /* silencioso */ }
  };

  useEffect(() => { loadComandas(); }, [loadComandas]);

  // Refresh automático a cada 30 s
  useEffect(() => {
    const t = setInterval(loadComandas, 30_000);
    return () => clearInterval(t);
  }, [loadComandas]);

  // ─── Ações ────────────────────────────────────────────────────────────────

  const createComanda = async () => {
    setCreating(true);
    try {
      const { data } = await api.post('/comandas', { observacao: obsCreate || undefined });
      toast.success(`Comanda ${data.numero} criada!`);
      setShowCreate(false);
      setObsCreate('');
      loadComandas();
      openDetail(data.id);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erro ao criar comanda');
    } finally { setCreating(false); }
  };

  const openDetail = async (id: string) => {
    try {
      const { data } = await api.get(`/comandas/${id}`);
      setDetail(data);
    } catch { toast.error('Erro ao carregar comanda'); }
  };

  const quickSearch = async () => {
    if (!quickNum.trim()) return;
    setSearching(true);
    try {
      const { data } = await api.get(`/comandas/numero/${quickNum.trim().toUpperCase()}`);
      setDetail(data);
      setQuickNum('');
    } catch { toast.error(`Comanda "${quickNum}" não encontrada`); }
    finally { setSearching(false); }
  };

  const addItem = async () => {
    if (!detail) return;
    const price = parseFloat(itemPrice);
    if (!selProduct && !itemName) { toast.error('Selecione ou nomeie o produto'); return; }
    if (isNaN(price) || price <= 0) { toast.error('Informe um preço válido'); return; }
    if (itemTipo === 'KG' && (!itemPeso || parseFloat(itemPeso) <= 0)) {
      toast.error('Informe o peso em KG'); return;
    }

    setAddingItem(true);
    try {
      const { data } = await api.post(`/comandas/${detail.id}/items`, {
        productId: selProduct?.id,
        name:      selProduct?.name ?? itemName,
        tipo:      itemTipo,
        quantity:  itemTipo === 'UNITARIO' ? parseFloat(itemQty) || 1 : 1,
        peso:      itemTipo === 'KG' ? parseFloat(itemPeso) : undefined,
        price,
        notes:     itemNotes || undefined,
      });
      setDetail(data);
      resetItemForm();
      toast.success('Item lançado!');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erro ao lançar item');
    } finally { setAddingItem(false); }
  };

  const removeItem = async (itemId: string) => {
    if (!detail) return;
    try {
      const { data } = await api.delete(`/comandas/${detail.id}/items/${itemId}`);
      setDetail(data);
      toast.success('Item removido');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erro ao remover item');
    }
  };

  const fecharConta = async () => {
    if (!detail) return;
    const amount = parseFloat(pmAmount);
    if (isNaN(amount) || amount <= 0) { toast.error('Informe o valor recebido'); return; }

    setFechando(true);
    try {
      const troco = Math.max(0, amount - detail.totalValue);
      const { data } = await api.patch(`/comandas/${detail.id}/fechar`, {
        method: pmMethod,
        amount,
        change: troco,
        notes:  pmNotes || undefined,
      });
      setDetail(data);
      setShowFechar(false);
      setPmAmount('');
      setPmNotes('');
      toast.success(`Comanda ${data.numero} finalizada!`);
      loadComandas();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erro ao fechar conta');
    } finally { setFechando(false); }
  };

  const cancelarComanda = async (id: string) => {
    if (!confirm('Cancelar esta comanda?')) return;
    try {
      const { data } = await api.patch(`/comandas/${id}/cancelar`);
      toast.success('Comanda cancelada');
      setDetail(null);
      loadComandas();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erro ao cancelar');
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const resetItemForm = () => {
    setSelProduct(null);
    setItemTipo('UNITARIO');
    setItemPeso('');
    setItemQty('1');
    setItemPrice('');
    setItemName('');
    setItemNotes('');
    setProdSearch('');
  };

  const selectProduct = (p: Product) => {
    setSelProduct(p);
    setItemTipo(p.isKgProduct ? 'KG' : 'UNITARIO');
    setItemPrice(String(p.promotionalPrice ?? p.price));
    setItemName(p.name);
  };

  const subtotalPreview = () => {
    const price = parseFloat(itemPrice) || 0;
    if (itemTipo === 'KG') return (parseFloat(itemPeso) || 0) * price;
    return (parseFloat(itemQty) || 1) * price;
  };

  const troco = detail
    ? Math.max(0, (parseFloat(pmAmount) || 0) - detail.totalValue)
    : 0;

  // ─── Filtragem local ──────────────────────────────────────────────────────

  const filtered = comandas.filter(c =>
    !search ||
    c.numero.toLowerCase().includes(search.toLowerCase()) ||
    c.observacao?.toLowerCase().includes(search.toLowerCase()),
  );

  const prodFiltered = products.filter(p =>
    !prodSearch ||
    p.name.toLowerCase().includes(prodSearch.toLowerCase()),
  );

  // ─── Stats ────────────────────────────────────────────────────────────────

  const stats = {
    abertas:    comandas.filter(c => c.status === 'ABERTA').length,
    fechamento: comandas.filter(c => c.status === 'FECHAMENTO').length,
    total:      comandas.filter(c => c.status === 'FINALIZADA').reduce((s, c) => s + c.totalValue, 0),
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Cabeçalho ──────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Ticket className="w-6 h-6 text-amber-500" />
            Comandas
          </h1>
          <p className="page-subtitle">
            {stats.abertas} abertas · {stats.fechamento} em fechamento · {formatCurrency(stats.total)} faturado hoje
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="input w-36 text-sm"
          />
          <button onClick={loadComandas} className="btn-outline px-3">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-accent flex items-center gap-2 px-5 py-2.5 text-base font-semibold"
          >
            <Plus className="w-5 h-5" /> Nova Comanda
          </button>
        </div>
      </div>

      {/* ── Busca rápida por número ─────────────────────────────────────────── */}
      <div className="card p-4 flex gap-3">
        <div className="relative flex-1">
          <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            ref={searchRef}
            value={quickNum}
            onChange={e => setQuickNum(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && quickSearch()}
            placeholder="Buscar comanda pelo número (ex: 0525-003)..."
            className="input pl-9 text-base"
          />
        </div>
        <button
          onClick={quickSearch}
          disabled={searching || !quickNum.trim()}
          className="btn-accent px-5 disabled:opacity-50"
        >
          {searching ? '...' : 'Buscar'}
        </button>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filtrar pelo número ou observação..."
            className="input pl-9 text-sm"
          />
        </div>
      </div>

      {/* ── Filtro de status ────────────────────────────────────────────────── */}
      <div className="flex gap-2">
        {FILTER_TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium border transition-all',
              filter === t.value
                ? 'bg-brown-700 text-white border-brown-700'
                : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400',
            )}
          >
            {t.label}
            {t.value === 'ABERTA'     && stats.abertas    > 0 && (
              <span className="ml-1.5 bg-emerald-500 text-white text-xs px-1.5 py-0.5 rounded-full">{stats.abertas}</span>
            )}
            {t.value === 'FECHAMENTO' && stats.fechamento > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">{stats.fechamento}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Grid de comandas ────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-40 bg-stone-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Ticket className="w-12 h-12 mx-auto mb-3 text-stone-200" />
          <p className="text-stone-500">Nenhuma comanda encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(c => (
            <button
              key={c.id}
              onClick={() => openDetail(c.id)}
              className={cn(
                'relative text-left p-4 rounded-xl border-2 transition-all hover:shadow-md hover:-translate-y-0.5',
                STATUS_CARD[c.status],
              )}
            >
              {/* Número em destaque */}
              <p className="text-2xl font-black text-stone-900 tracking-tight">{c.numero}</p>

              {/* Badge status */}
              <span className={cn('inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold border', STATUS_COLOR[c.status])}>
                {STATUS_LABEL[c.status]}
              </span>

              {/* Detalhes */}
              <div className="mt-3 space-y-1">
                <p className="text-lg font-bold text-stone-900">{formatCurrency(c.totalValue)}</p>
                <p className="text-xs text-stone-500">
                  {c.items.length} item{c.items.length !== 1 ? 's' : ''}
                </p>
                {c.observacao && (
                  <p className="text-xs text-stone-400 truncate">{c.observacao}</p>
                )}
                <div className="flex items-center gap-1 text-xs text-stone-400">
                  <Clock className="w-3 h-3" />
                  <span>{timeAgo(c.openedAt)}</span>
                </div>
              </div>

              {/* Seta de ação */}
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
            </button>
          ))}
        </div>
      )}


      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: Nova comanda                                                  */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-lg">Nova Comanda</h3>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="text-center py-4">
                <p className="text-stone-500 text-sm">Número gerado automaticamente</p>
                <p className="text-4xl font-black text-amber-500 mt-1">AUTO</p>
                <p className="text-xs text-stone-400 mt-1">Formato: MMDD-NNN (ex: 0525-001)</p>
              </div>
              <div>
                <label className="label">Observação (opcional)</label>
                <input
                  value={obsCreate}
                  onChange={e => setObsCreate(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createComanda()}
                  placeholder="Ex.: família Silva, mesa 3..."
                  className="input"
                  autoFocus
                />
              </div>
              <button
                onClick={createComanda}
                disabled={creating}
                className="w-full btn-accent py-4 text-base font-bold disabled:opacity-50"
              >
                {creating ? 'Criando...' : '✓ Criar Comanda'}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: Detalhe da comanda                                            */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {detail && !showItem && !showFechar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDetail(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto animate-fade-in">

            {/* Header */}
            <div className={cn(
              'flex items-center justify-between p-5',
              detail.status === 'ABERTA'     ? 'bg-emerald-50  border-b border-emerald-200' :
              detail.status === 'FECHAMENTO' ? 'bg-amber-50    border-b border-amber-200'   :
              detail.status === 'FINALIZADA' ? 'bg-stone-50    border-b border-stone-200'   :
              'bg-red-50 border-b border-red-200',
            )}>
              <div>
                <p className="text-2xl font-black text-stone-900">{detail.numero}</p>
                <span className={cn('inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border', STATUS_COLOR[detail.status])}>
                  {STATUS_LABEL[detail.status]}
                </span>
                {detail.observacao && (
                  <p className="text-xs text-stone-500 mt-0.5">{detail.observacao}</p>
                )}
              </div>
              <button onClick={() => setDetail(null)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-black/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Itens */}
            <div className="p-5">
              {detail.items.length === 0 ? (
                <div className="text-center py-8 text-stone-400">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum item lançado</p>
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  {detail.items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-stone-50 border border-stone-100">
                      <div className="shrink-0">
                        {item.tipo === 'KG'
                          ? <Scale className="w-4 h-4 text-amber-500" />
                          : <Package className="w-4 h-4 text-stone-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-stone-900 truncate">{item.name}</p>
                        <p className="text-xs text-stone-500">
                          {item.tipo === 'KG'
                            ? `${item.peso?.toFixed(3)} KG × ${formatCurrency(item.price)}/KG`
                            : `${item.quantity}× ${formatCurrency(item.price)}`}
                        </p>
                        {item.notes && <p className="text-xs text-stone-400 italic">Obs: {item.notes}</p>}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-bold text-stone-900">{formatCurrency(item.subtotal)}</p>
                        {detail.status !== 'FINALIZADA' && detail.status !== 'CANCELADA' && (
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-300 hover:text-red-500 transition-colors mt-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Total */}
              <div className="flex items-center justify-between py-3 border-t border-stone-200 mb-4">
                <span className="font-semibold text-stone-700">Total</span>
                <span className="text-2xl font-black text-stone-900">{formatCurrency(detail.totalValue)}</span>
              </div>

              {/* Pagamentos já realizados */}
              {detail.payments.length > 0 && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                  {detail.payments.map(p => (
                    <div key={p.id} className="flex justify-between text-sm">
                      <span className="text-emerald-700 font-medium">{p.method}</span>
                      <span className="text-emerald-800 font-semibold">{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Ações */}
              <div className="space-y-2">
                {/* Lançar item */}
                {(detail.status === 'ABERTA' || detail.status === 'FECHAMENTO') && (
                  <button
                    onClick={() => { loadProducts(); setShowItem(true); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 text-brown-950 hover:bg-amber-400 font-semibold text-base transition-colors"
                  >
                    <Plus className="w-5 h-5" /> Lançar Item
                  </button>
                )}

                {/* Fechar conta */}
                {CAN_FECHAR.includes(role) && (detail.status === 'ABERTA' || detail.status === 'FECHAMENTO') && (
                  <button
                    onClick={() => { setPmAmount(String(detail.totalValue.toFixed(2))); setShowFechar(true); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-stone-800 text-white hover:bg-stone-700 font-semibold text-base transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" /> Fechar Conta
                  </button>
                )}

                {/* Cancelar */}
                {CAN_CANCEL.includes(role) && (detail.status === 'ABERTA' || detail.status === 'FECHAMENTO') && (
                  <button
                    onClick={() => cancelarComanda(detail.id)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 font-medium transition-colors"
                  >
                    <Ban className="w-4 h-4" /> Cancelar Comanda
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: Lançar item                                                   */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {detail && showItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowItem(false); resetItemForm(); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-auto animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-stone-900 text-lg">Lançar Item</h3>
                <p className="text-xs text-stone-400">Comanda {detail.numero}</p>
              </div>
              <button onClick={() => { setShowItem(false); resetItemForm(); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Busca de produto */}
              <div>
                <label className="label">Produto do cardápio</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    value={prodSearch}
                    onChange={e => setProdSearch(e.target.value)}
                    placeholder="Buscar produto..."
                    className="input pl-9"
                    autoFocus
                  />
                </div>
                {prodSearch && (
                  <div className="mt-1.5 border border-stone-200 rounded-xl overflow-hidden max-h-44 overflow-y-auto shadow-sm">
                    {prodFiltered.length === 0 ? (
                      <p className="p-3 text-sm text-stone-400 text-center">Nenhum produto encontrado</p>
                    ) : (
                      prodFiltered.slice(0, 12).map(p => (
                        <button
                          key={p.id}
                          onClick={() => { selectProduct(p); setProdSearch(''); }}
                          className={cn(
                            'w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-amber-50 transition-colors text-left',
                            selProduct?.id === p.id && 'bg-amber-50',
                          )}
                        >
                          <span className="font-medium text-stone-800">{p.name}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            {p.isKgProduct && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">KG</span>
                            )}
                            <span className="text-stone-500">{formatCurrency(p.promotionalPrice ?? p.price)}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
                {selProduct && (
                  <div className="mt-2 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <span className="text-sm font-semibold text-amber-800">{selProduct.name}</span>
                    <button onClick={() => { setSelProduct(null); setItemPrice(''); setItemName(''); }} className="text-amber-400 hover:text-amber-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Ou nome manual */}
              {!selProduct && (
                <div>
                  <label className="label">Ou nome manual</label>
                  <input
                    value={itemName}
                    onChange={e => setItemName(e.target.value)}
                    placeholder="Ex.: Buffet livre, Bebida avulsa..."
                    className="input"
                  />
                </div>
              )}

              {/* Tipo: KG ou Unitário */}
              <div>
                <label className="label">Tipo de cobrança</label>
                <div className="grid grid-cols-2 gap-2">
                  {([['UNITARIO', 'Unitário', Package], ['KG', 'Por KG', Scale]] as const).map(([val, lbl, Icon]) => (
                    <button
                      key={val}
                      onClick={() => setItemTipo(val)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 font-semibold text-sm transition-all',
                        itemTipo === val
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-stone-200 text-stone-500 hover:border-stone-300',
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Peso / Quantidade */}
              {itemTipo === 'KG' ? (
                <div>
                  <label className="label">Peso (KG)</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={itemPeso}
                    onChange={e => setItemPeso(e.target.value)}
                    placeholder="0.742"
                    className="input input-lg text-2xl font-bold"
                    autoFocus
                  />
                  <p className="text-xs text-stone-400 mt-1">Ex.: 0.742 = 742 gramas</p>
                </div>
              ) : (
                <div>
                  <label className="label">Quantidade</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={itemQty}
                    onChange={e => setItemQty(e.target.value)}
                    className="input input-lg text-2xl font-bold"
                  />
                </div>
              )}

              {/* Preço */}
              <div>
                <label className="label">
                  {itemTipo === 'KG' ? 'Preço por KG (R$)' : 'Preço unitário (R$)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-medium">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={itemPrice}
                    onChange={e => setItemPrice(e.target.value)}
                    placeholder="79.90"
                    className="input pl-10 text-lg font-bold"
                  />
                </div>
              </div>

              {/* Observação */}
              <div>
                <label className="label">Observação (opcional)</label>
                <input
                  value={itemNotes}
                  onChange={e => setItemNotes(e.target.value)}
                  placeholder="Ex.: sem acompanhamento"
                  className="input"
                />
              </div>

              {/* Preview subtotal */}
              {subtotalPreview() > 0 && (
                <div className="flex items-center justify-between bg-stone-900 text-white rounded-xl px-5 py-4">
                  <span className="text-stone-300 font-medium">
                    {itemTipo === 'KG'
                      ? `${parseFloat(itemPeso) || 0} KG × ${formatCurrency(parseFloat(itemPrice) || 0)}/KG`
                      : `${parseFloat(itemQty) || 1}× ${formatCurrency(parseFloat(itemPrice) || 0)}`}
                  </span>
                  <span className="text-2xl font-black text-amber-400">
                    {formatCurrency(subtotalPreview())}
                  </span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setShowItem(false); resetItemForm(); }}
                  className="flex-1 btn-ghost"
                >
                  Voltar
                </button>
                <button
                  onClick={addItem}
                  disabled={addingItem || subtotalPreview() <= 0}
                  className="flex-1 btn-accent py-3.5 font-bold text-base disabled:opacity-50"
                >
                  {addingItem ? 'Lançando...' : '+ Lançar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: Fechar conta                                                  */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {detail && showFechar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFechar(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-stone-900 text-lg">Fechar Conta</h3>
                <p className="text-xs text-stone-400">Comanda {detail.numero}</p>
              </div>
              <button onClick={() => setShowFechar(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Resumo dos itens */}
              <div className="bg-stone-50 rounded-xl p-4 space-y-1.5 border border-stone-100">
                {detail.items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-stone-600">
                      {item.tipo === 'KG'
                        ? `${item.name} (${item.peso?.toFixed(3)} KG)`
                        : `${item.quantity}× ${item.name}`}
                    </span>
                    <span className="font-medium text-stone-900">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-stone-900 text-base pt-2 border-t border-stone-200">
                  <span>TOTAL</span>
                  <span className="text-xl text-amber-600">{formatCurrency(detail.totalValue)}</span>
                </div>
              </div>

              {/* Forma de pagamento */}
              <div>
                <label className="label">Forma de Pagamento</label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setPmMethod(opt.value)}
                      className={cn(
                        'flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 font-semibold text-sm transition-all',
                        pmMethod === opt.value
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-stone-200 text-stone-600 hover:border-stone-300',
                      )}
                    >
                      <opt.icon className="w-4 h-4" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Valor recebido */}
              <div>
                <label className="label">Valor Recebido (R$)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-lg font-bold">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min={detail.totalValue}
                    value={pmAmount}
                    onChange={e => setPmAmount(e.target.value)}
                    className="input pl-12 text-2xl font-black"
                    autoFocus
                  />
                </div>
              </div>

              {/* Troco */}
              {pmMethod === 'CASH' && troco > 0 && (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <span className="font-semibold text-emerald-700">Troco</span>
                  <span className="text-2xl font-black text-emerald-600">{formatCurrency(troco)}</span>
                </div>
              )}

              {/* Valor insuficiente */}
              {parseFloat(pmAmount) > 0 && parseFloat(pmAmount) < detail.totalValue && pmMethod !== 'MIXED' && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-600">Valor insuficiente (faltam {formatCurrency(detail.totalValue - parseFloat(pmAmount))})</p>
                </div>
              )}

              {/* Observação */}
              <div>
                <label className="label">Observação (opcional)</label>
                <input
                  value={pmNotes}
                  onChange={e => setPmNotes(e.target.value)}
                  placeholder="Ex.: pagamento parcelado..."
                  className="input"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowFechar(false)} className="flex-1 btn-ghost">
                  Voltar
                </button>
                <button
                  onClick={fecharConta}
                  disabled={
                    fechando ||
                    !pmAmount ||
                    (parseFloat(pmAmount) < detail.totalValue && pmMethod !== 'MIXED')
                  }
                  className="flex-1 bg-stone-900 text-white py-3.5 rounded-xl font-bold text-base hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  {fechando ? 'Finalizando...' : 'Finalizar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
