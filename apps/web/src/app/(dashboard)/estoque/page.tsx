'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Search, AlertTriangle, Package,
  TrendingDown, TrendingUp, Edit, ArrowDownCircle, ArrowUpCircle,
  RefreshCw, Sliders,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

// ─── Tipos de movimentação com label e mapeamento correto para o backend ─────
const MOVEMENT_TYPES = [
  { value: 'ENTRADA', label: 'Entrada',    color: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
  { value: 'SAIDA',   label: 'Saída',      color: 'border-red-400     bg-red-50     text-red-700'     },
  { value: 'AJUSTE',  label: 'Ajuste',     color: 'border-blue-400    bg-blue-50    text-blue-700'    },
  { value: 'PERDA',   label: 'Perda',      color: 'border-amber-400   bg-amber-50   text-amber-700'   },
];

const UNITS = ['UN', 'KG', 'G', 'L', 'ML', 'CX', 'PCT', 'FD'];

const EMPTY_FORM = {
  name:        '',
  unit:        'UN',
  currentQty:  '',
  minQty:      '',
  costPerUnit: '',
};

const EMPTY_MOVEMENT = { type: 'ENTRADA', quantity: '', notes: '', cost: '' };

// ─── Página ───────────────────────────────────────────────────────────────────
export default function EstoquePage() {
  const [items,         setItems]         = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [showForm,      setShowForm]      = useState(false);
  const [showMovement,  setShowMovement]  = useState(false);
  const [editing,       setEditing]       = useState<any>(null);
  const [selectedItem,  setSelectedItem]  = useState<any>(null);
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [movement,      setMovement]      = useState(EMPTY_MOVEMENT);
  const [saving,        setSaving]        = useState(false);

  // ─── Load ───────────────────────────────────────────────────────────────────
  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/stock');
      // aceita array direto ou paginado
      const arr = Array.isArray(data) ? data : (data.items ?? data.data ?? []);
      setItems(arr);
    } catch { toast.error('Erro ao carregar estoque'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  // ─── Salvar item ────────────────────────────────────────────────────────────
  const save = async () => {
    if (!form.name || !form.currentQty) {
      toast.error('Nome e quantidade são obrigatórios');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name:        form.name.trim(),
        unit:        form.unit,
        currentQty:  parseFloat(form.currentQty)  || 0,
        minQty:      parseFloat(form.minQty)       || 0,
        costPerUnit: parseFloat(form.costPerUnit)  || 0,
      };
      if (editing) {
        await api.put(`/stock/${editing.id}`, payload);
        toast.success('Item atualizado!');
      } else {
        await api.post('/stock', payload);
        toast.success('Item criado!');
      }
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      loadItems();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erro ao salvar item');
    } finally { setSaving(false); }
  };

  // ─── Registrar movimentação ─────────────────────────────────────────────────
  const registerMovement = async () => {
    if (!selectedItem || !movement.quantity) {
      toast.error('Informe a quantidade');
      return;
    }
    setSaving(true);
    try {
      // URL: /stock/:id/movement — backend aceita ID na URL E mapeie tipo PT→EN
      await api.post(`/stock/${selectedItem.id}/movement`, {
        type:     movement.type,                       // ENTRADA, SAIDA, AJUSTE, PERDA
        quantity: parseFloat(movement.quantity),
        notes:    movement.notes || undefined,
        cost:     parseFloat(movement.cost) || 0,      // backend aceita 'cost' como alias
      });
      toast.success('Movimentação registrada!');
      setShowMovement(false);
      setSelectedItem(null);
      setMovement(EMPTY_MOVEMENT);
      loadItems();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erro ao registrar movimentação');
    } finally { setSaving(false); }
  };

  // ─── Abrir edição ───────────────────────────────────────────────────────────
  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      name:        item.name,
      unit:        item.unit,
      currentQty:  String(item.currentQty),
      minQty:      String(item.minQty),
      costPerUnit: String(item.costPerUnit),
    });
    setShowForm(true);
  };

  // ─── Filtragem ──────────────────────────────────────────────────────────────
  const filtered  = items.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()));
  const lowStock  = items.filter(i => i.currentQty <= i.minQty && i.currentQty > 0);
  const zeroStock = items.filter(i => i.currentQty === 0);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Estoque</h1>
          <p className="page-subtitle">{items.length} iten{items.length !== 1 ? 's' : ''} cadastrado{items.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadItems} className="btn-outline px-3" title="Atualizar">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); }}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" /> Novo Item
          </button>
        </div>
      </div>

      {/* Alerta de estoque baixo */}
      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">Estoque baixo detectado</p>
            <p className="text-sm text-amber-700 mt-0.5">
              {lowStock.map(i => i.name).join(', ')} {lowStock.length === 1 ? 'está' : 'estão'} abaixo do mínimo definido.
            </p>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total de Itens',   value: items.length,                                     icon: Package,       color: 'text-brown-700 bg-brown-50'   },
          { label: 'Estoque Baixo',    value: lowStock.length,                                   icon: AlertTriangle, color: 'text-amber-600 bg-amber-50'   },
          { label: 'Em Estoque',       value: items.filter(i => i.currentQty > i.minQty).length, icon: TrendingUp,    color: 'text-emerald-600 bg-emerald-50'},
          { label: 'Zerados',          value: zeroStock.length,                                  icon: TrendingDown,  color: 'text-red-500 bg-red-50'       },
        ].map(s => (
          <div key={s.label} className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-stone-500">{s.label}</p>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-stone-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar item de estoque..."
          className="input pl-9"
        />
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qtd. Atual</th>
                <th>Mínimo</th>
                <th>Unidade</th>
                <th>Custo/Un.</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>{[...Array(7)].map((_, j) => <td key={j}><div className="h-4 bg-stone-100 rounded animate-pulse" /></td>)}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-stone-400 py-12">
                    {search ? `Nenhum item encontrado para "${search}"` : 'Nenhum item cadastrado'}
                  </td>
                </tr>
              ) : filtered.map(item => {
                const isEmpty = item.currentQty === 0;
                const isLow   = !isEmpty && item.currentQty <= item.minQty;
                return (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'w-2 h-2 rounded-full shrink-0',
                          isEmpty ? 'bg-red-500' : isLow ? 'bg-amber-400' : 'bg-emerald-400',
                        )} />
                        <span className="font-medium text-stone-900">{item.name}</span>
                        {item.product && (
                          <span className="text-xs text-stone-400">← {item.product.name}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={cn('font-semibold', isEmpty ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-stone-900')}>
                        {item.currentQty}
                      </span>
                    </td>
                    <td><span className="text-sm text-stone-500">{item.minQty}</span></td>
                    <td><span className="badge bg-stone-100 text-stone-600">{item.unit}</span></td>
                    <td>
                      <span className="text-sm text-stone-500">
                        {item.costPerUnit > 0 ? `R$ ${item.costPerUnit.toFixed(2)}` : '—'}
                      </span>
                    </td>
                    <td>
                      <span className={cn('badge', isEmpty ? 'bg-red-100 text-red-700' : isLow ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')}>
                        {isEmpty ? 'Zerado' : isLow ? 'Baixo' : 'Normal'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(item)}
                          className="btn-sm btn-ghost px-2"
                          title="Editar"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setSelectedItem(item); setMovement({ ...EMPTY_MOVEMENT, type: 'ENTRADA' }); setShowMovement(true); }}
                          className="btn-sm btn-outline text-xs flex items-center gap-1"
                          title="Movimentar estoque"
                        >
                          <Sliders className="w-3 h-3" /> Movimentar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>


      {/* ── Modal: Criar / Editar item ─────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="p-6">
              <h3 className="font-bold text-xl text-stone-900 mb-5">
                {editing ? 'Editar Item de Estoque' : 'Novo Item de Estoque'}
              </h3>
              <div className="space-y-4">

                <div>
                  <label className="label">Nome *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="input"
                    placeholder="Ex: Farinha de trigo"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Unidade</label>
                    <select
                      value={form.unit}
                      onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                      className="input"
                    >
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Custo por Unidade (R$)</label>
                    <input
                      value={form.costPerUnit}
                      onChange={e => setForm(f => ({ ...f, costPerUnit: e.target.value }))}
                      type="number"
                      step="0.01"
                      className="input"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Qtd. Atual *</label>
                    <input
                      value={form.currentQty}
                      onChange={e => setForm(f => ({ ...f, currentQty: e.target.value }))}
                      type="number"
                      step="0.001"
                      className="input"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="label">Qtd. Mínima</label>
                    <input
                      value={form.minQty}
                      onChange={e => setForm(f => ({ ...f, minQty: e.target.value }))}
                      type="number"
                      step="0.001"
                      className="input"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)} className="flex-1 btn-outline">Cancelar</button>
                <button onClick={save} disabled={saving} className="flex-1 btn-primary disabled:opacity-50">
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ── Modal: Movimentação ────────────────────────────────────────────────── */}
      {showMovement && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMovement(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="p-6">
              <h3 className="font-bold text-xl text-stone-900 mb-1">Movimentação de Estoque</h3>
              <p className="text-stone-500 text-sm mb-5">
                {selectedItem.name} — Atual: <strong>{selectedItem.currentQty} {selectedItem.unit}</strong>
              </p>

              <div className="space-y-4">

                {/* Tipo */}
                <div>
                  <label className="label">Tipo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {MOVEMENT_TYPES.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setMovement(m => ({ ...m, type: t.value }))}
                        className={cn(
                          'flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl border-2 transition-all',
                          movement.type === t.value ? t.color : 'border-stone-200 text-stone-500 hover:border-stone-300',
                        )}
                      >
                        {t.value === 'ENTRADA' && <ArrowDownCircle className="w-4 h-4" />}
                        {t.value === 'SAIDA'   && <ArrowUpCircle   className="w-4 h-4" />}
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantidade */}
                <div>
                  <label className="label">
                    {movement.type === 'AJUSTE' ? 'Nova Quantidade (absoluta)' : `Quantidade (${selectedItem.unit})`} *
                  </label>
                  <input
                    value={movement.quantity}
                    onChange={e => setMovement(m => ({ ...m, quantity: e.target.value }))}
                    type="number"
                    step="0.001"
                    min="0"
                    className="input text-lg font-semibold"
                    placeholder={movement.type === 'AJUSTE' ? String(selectedItem.currentQty) : '0'}
                    autoFocus
                  />
                  {/* Preview do saldo resultante */}
                  {movement.quantity && (
                    <p className="text-xs text-stone-400 mt-1">
                      {movement.type === 'ENTRADA' && `Saldo após: ${(selectedItem.currentQty + parseFloat(movement.quantity)).toFixed(3)} ${selectedItem.unit}`}
                      {movement.type === 'SAIDA'   && `Saldo após: ${Math.max(0, selectedItem.currentQty - parseFloat(movement.quantity)).toFixed(3)} ${selectedItem.unit}`}
                      {movement.type === 'AJUSTE'  && `Saldo ajustado para: ${parseFloat(movement.quantity).toFixed(3)} ${selectedItem.unit}`}
                      {movement.type === 'PERDA'   && `Saldo após: ${Math.max(0, selectedItem.currentQty - parseFloat(movement.quantity)).toFixed(3)} ${selectedItem.unit}`}
                    </p>
                  )}
                </div>

                {/* Motivo */}
                <div>
                  <label className="label">Motivo / Observação</label>
                  <input
                    value={movement.notes}
                    onChange={e => setMovement(m => ({ ...m, notes: e.target.value }))}
                    className="input"
                    placeholder="Ex: Compra de fornecedor, inventário..."
                  />
                </div>

                {/* Custo (só para entradas) */}
                {movement.type === 'ENTRADA' && (
                  <div>
                    <label className="label">Custo Total da Compra (R$)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">R$</span>
                      <input
                        value={movement.cost}
                        onChange={e => setMovement(m => ({ ...m, cost: e.target.value }))}
                        type="number"
                        step="0.01"
                        className="input pl-9"
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowMovement(false)} className="flex-1 btn-outline">Cancelar</button>
                <button onClick={registerMovement} disabled={saving} className="flex-1 btn-primary disabled:opacity-50">
                  {saving ? 'Registrando...' : 'Registrar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
