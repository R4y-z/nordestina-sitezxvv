'use client';

import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Plus, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function FinanceiroPage() {
  const [summary, setSummary] = useState<any>(null);
  const [cashFlow, setCashFlow] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    return { from: firstDay, to: today };
  });
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ category: '', description: '', amount: '', date: new Date().toISOString().slice(0, 10), supplier: '' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, cf, exp] = await Promise.all([
        api.get(`/financial/summary?from=${period.from}&to=${period.to}`),
        api.get('/financial/cash-flow?days=30'),
        api.get(`/financial/expenses?from=${period.from}&to=${period.to}`),
      ]);
      setSummary(s.data);
      setCashFlow(cf.data);
      setExpenses(exp.data);
    } catch { toast.error('Erro ao carregar financeiro'); }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { loadData(); }, [loadData]);

  const saveExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    try {
      await api.post('/financial/expenses', { ...expenseForm, amount: parseFloat(expenseForm.amount) });
      toast.success('Despesa registrada');
      setShowExpenseForm(false);
      setExpenseForm({ category: '', description: '', amount: '', date: new Date().toISOString().slice(0, 10), supplier: '' });
      loadData();
    } catch { toast.error('Erro ao registrar despesa'); }
  };

  const metrics = [
    { label: 'Receita', value: summary?.revenue || 0, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50', isCurrency: true },
    { label: 'Despesas', value: summary?.expenses || 0, icon: TrendingDown, color: 'text-red-500 bg-red-50', isCurrency: true },
    { label: 'Lucro', value: summary?.profit || 0, icon: DollarSign, color: 'text-brown-700 bg-brown-50', isCurrency: true },
    { label: 'Margem', value: `${summary?.margin || 0}%`, icon: TrendingUp, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Financeiro</h1>
          <p className="page-subtitle">Controle de receitas, despesas e lucro</p>
        </div>
        <button onClick={() => setShowExpenseForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Nova Despesa
        </button>
      </div>

      {/* Period filter */}
      <div className="card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Calendar className="w-4 h-4 text-stone-400" />
          <div className="flex items-center gap-2">
            <input type="date" value={period.from} onChange={e => setPeriod(p => ({ ...p, from: e.target.value }))} className="input w-40" />
            <span className="text-stone-400 text-sm">até</span>
            <input type="date" value={period.to} onChange={e => setPeriod(p => ({ ...p, to: e.target.value }))} className="input w-40" />
          </div>
          {/* Quick periods */}
          {[
            { label: 'Hoje', fn: () => { const t = new Date().toISOString().slice(0, 10); setPeriod({ from: t, to: t }); } },
            { label: 'Esta semana', fn: () => { const d = new Date(); const mon = new Date(d); mon.setDate(d.getDate() - d.getDay()); setPeriod({ from: mon.toISOString().slice(0, 10), to: d.toISOString().slice(0, 10) }); } },
            { label: 'Este mês', fn: () => { const d = new Date(); setPeriod({ from: new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10), to: d.toISOString().slice(0, 10) }); } },
          ].map(q => (
            <button key={q.label} onClick={q.fn} className="btn-sm btn-outline">{q.label}</button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(m => (
          <div key={m.label} className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-stone-500">{m.label}</p>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${m.color}`}>
                <m.icon className="w-4.5 h-4.5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-stone-900">
              {loading ? '—' : m.isCurrency ? formatCurrency(m.value as number) : m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Payment methods */}
      {!loading && summary?.paymentsByMethod?.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-stone-900 mb-4">Receita por Forma de Pagamento</h3>
          <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {summary.paymentsByMethod.map((p: any) => (
              <div key={p.method} className="bg-stone-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-stone-900">{formatCurrency(p.amount)}</p>
                <p className="text-xs text-stone-500 mt-0.5">{p.method} ({p.count})</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cash flow chart */}
      <div className="card p-5">
        <h3 className="font-semibold text-stone-900 mb-4">Fluxo de Caixa — 30 dias</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={cashFlow}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}
              tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="revenue" name="Receita" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Expenses table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100">
          <h3 className="font-semibold text-stone-900">Despesas do Período</h3>
        </div>
        {expenses.length === 0 ? (
          <div className="p-12 text-center text-stone-400 text-sm">Nenhuma despesa no período</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Data</th><th>Categoria</th><th>Descrição</th><th>Fornecedor</th><th>Valor</th></tr>
            </thead>
            <tbody>
              {expenses.map(e => (
                <tr key={e.id}>
                  <td>{formatDate(e.date, 'date')}</td>
                  <td><span className="badge bg-stone-100 text-stone-600">{e.category}</span></td>
                  <td>{e.description}</td>
                  <td>{e.supplier || '—'}</td>
                  <td><span className="text-red-600 font-semibold">-{formatCurrency(e.amount)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Expense form modal */}
      {showExpenseForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowExpenseForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="p-6">
              <h3 className="font-bold text-xl text-stone-900 mb-5">Nova Despesa</h3>
              <div className="space-y-3">
                <div>
                  <label className="label">Categoria</label>
                  <select value={expenseForm.category} onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value }))} className="input">
                    <option value="">Selecione...</option>
                    {['Insumos', 'Folha de Pagamento', 'Aluguel', 'Energia', 'Água', 'Internet', 'Equipamentos', 'Manutenção', 'Marketing', 'Outros'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Descrição *</label>
                  <input value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} className="input" placeholder="Ex: Compra de ingredientes" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Valor *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">R$</span>
                      <input value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} type="number" step="0.01" className="input pl-9" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Data</label>
                    <input value={expenseForm.date} onChange={e => setExpenseForm(f => ({ ...f, date: e.target.value }))} type="date" className="input" />
                  </div>
                </div>
                <div>
                  <label className="label">Fornecedor</label>
                  <input value={expenseForm.supplier} onChange={e => setExpenseForm(f => ({ ...f, supplier: e.target.value }))} className="input" placeholder="Nome do fornecedor" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowExpenseForm(false)} className="flex-1 btn-outline">Cancelar</button>
                <button onClick={saveExpense} className="flex-1 btn-primary">Registrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
