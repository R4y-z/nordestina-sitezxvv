'use client';

import { useState } from 'react';
import { BarChart2, Download, Calendar, TrendingUp, Package, Truck, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

const REPORT_TYPES = [
  { id: 'sales', label: 'Vendas', icon: TrendingUp, description: 'Receita, ticket médio, formas de pagamento' },
  { id: 'products', label: 'Produtos', icon: Package, description: 'Mais vendidos, margem, performance' },
  { id: 'delivery', label: 'Delivery', icon: Truck, description: 'Entregas, taxa de sucesso, rotas' },
  { id: 'employees', label: 'Funcionários', icon: Users, description: 'Vendas por operador, produtividade' },
];

export default function RelatoriosPage() {
  const [activeReport, setActiveReport] = useState('sales');
  const [period, setPeriod] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    return { from: firstDay, to: today };
  });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      const { data: result } = await api.get(`/reports/${activeReport}?from=${period.from}&to=${period.to}`);
      setData(result);
    } catch { toast.error('Erro ao carregar relatório'); }
    finally { setLoading(false); }
  };

  const exportReport = async (format: 'csv' | 'pdf') => {
    toast.success(`Exportando ${format.toUpperCase()}...`);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Relatórios</h1>
          <p className="page-subtitle">Análises e exportação de dados</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportReport('csv')} className="btn-outline text-sm">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={() => exportReport('pdf')} className="btn-outline text-sm">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Report type selector */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {REPORT_TYPES.map(r => (
          <button
            key={r.id}
            onClick={() => setActiveReport(r.id)}
            className={`card p-4 text-left transition-all ${activeReport === r.id ? 'ring-2 ring-amber-500 bg-amber-50' : 'hover:shadow-md'}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${activeReport === r.id ? 'bg-amber-100 text-amber-600' : 'bg-stone-100 text-stone-500'}`}>
              <r.icon className="w-5 h-5" />
            </div>
            <p className={`font-semibold text-sm ${activeReport === r.id ? 'text-amber-700' : 'text-stone-900'}`}>{r.label}</p>
            <p className="text-xs text-stone-400 mt-0.5">{r.description}</p>
          </button>
        ))}
      </div>

      {/* Period and load */}
      <div className="card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Calendar className="w-4 h-4 text-stone-400" />
          <div className="flex items-center gap-2">
            <input type="date" value={period.from} onChange={e => setPeriod(p => ({ ...p, from: e.target.value }))} className="input w-40" />
            <span className="text-stone-400 text-sm">até</span>
            <input type="date" value={period.to} onChange={e => setPeriod(p => ({ ...p, to: e.target.value }))} className="input w-40" />
          </div>
          {[
            { label: 'Este mês', fn: () => { const d = new Date(); setPeriod({ from: new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10), to: d.toISOString().slice(0, 10) }); } },
            { label: 'Mês anterior', fn: () => { const d = new Date(); const fd = new Date(d.getFullYear(), d.getMonth() - 1, 1); const ld = new Date(d.getFullYear(), d.getMonth(), 0); setPeriod({ from: fd.toISOString().slice(0, 10), to: ld.toISOString().slice(0, 10) }); } },
            { label: 'Este ano', fn: () => { const d = new Date(); setPeriod({ from: `${d.getFullYear()}-01-01`, to: d.toISOString().slice(0, 10) }); } },
          ].map(q => (
            <button key={q.label} onClick={q.fn} className="btn-sm btn-outline">{q.label}</button>
          ))}
          <button onClick={loadReport} disabled={loading} className="btn-primary ml-auto">
            {loading ? 'Carregando...' : 'Gerar Relatório'}
          </button>
        </div>
      </div>

      {/* Report content */}
      {!data ? (
        <div className="card p-16 text-center">
          <BarChart2 className="w-14 h-14 mx-auto mb-4 text-stone-200" />
          <p className="text-stone-400 font-medium">Selecione um relatório e clique em "Gerar Relatório"</p>
          <p className="text-stone-300 text-sm mt-1">Configure o período e gere análises detalhadas</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Sales report */}
          {activeReport === 'sales' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Receita Total', value: formatCurrency(data.totalRevenue || 0) },
                  { label: 'Total de Pedidos', value: data.totalOrders || 0 },
                  { label: 'Ticket Médio', value: formatCurrency(data.avgTicket || 0) },
                  { label: 'Cancelamentos', value: data.cancelledOrders || 0 },
                ].map(s => (
                  <div key={s.label} className="kpi-card">
                    <p className="text-sm text-stone-500 mb-2">{s.label}</p>
                    <p className="text-2xl font-bold text-stone-900">{s.value}</p>
                  </div>
                ))}
              </div>
              {data.dailyRevenue?.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-semibold text-stone-900 mb-4">Receita por Dia</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data.dailyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={v => v.slice(5)} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Bar dataKey="revenue" name="Receita" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {data.byPaymentMethod?.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-semibold text-stone-900 mb-4">Por Forma de Pagamento</h3>
                  <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {data.byPaymentMethod.map((p: any) => (
                      <div key={p.method} className="bg-stone-50 rounded-xl p-3 text-center">
                        <p className="text-lg font-bold text-stone-900">{formatCurrency(p.amount)}</p>
                        <p className="text-xs text-stone-500 mt-0.5">{p.method} ({p.count})</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Products report */}
          {activeReport === 'products' && data.topProducts?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-100">
                <h3 className="font-semibold text-stone-900">Produtos Mais Vendidos</h3>
              </div>
              <table className="data-table">
                <thead>
                  <tr><th>#</th><th>Produto</th><th>Qtd. Vendida</th><th>Receita</th><th>Margem</th></tr>
                </thead>
                <tbody>
                  {data.topProducts.map((p: any, i: number) => (
                    <tr key={p.productId}>
                      <td><span className="font-bold text-stone-400">#{i + 1}</span></td>
                      <td><span className="font-medium text-stone-900">{p.productName}</span></td>
                      <td>{p.quantity}</td>
                      <td><span className="font-semibold text-stone-900">{formatCurrency(p.revenue)}</span></td>
                      <td><span className={`text-sm font-medium ${p.margin > 50 ? 'text-emerald-600' : p.margin > 30 ? 'text-amber-600' : 'text-red-500'}`}>{p.margin?.toFixed(0)}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Delivery report */}
          {activeReport === 'delivery' && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Entregas', value: data.total || 0 },
                { label: 'Entregues', value: data.delivered || 0 },
                { label: 'Falharam', value: data.failed || 0 },
                { label: 'Taxa de Sucesso', value: `${data.successRate || 0}%` },
              ].map(s => (
                <div key={s.label} className="kpi-card">
                  <p className="text-sm text-stone-500 mb-2">{s.label}</p>
                  <p className="text-2xl font-bold text-stone-900">{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Employees report */}
          {activeReport === 'employees' && data.employees?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-100">
                <h3 className="font-semibold text-stone-900">Desempenho por Funcionário</h3>
              </div>
              <table className="data-table">
                <thead>
                  <tr><th>Funcionário</th><th>Pedidos</th><th>Receita</th><th>Ticket Médio</th></tr>
                </thead>
                <tbody>
                  {data.employees.map((e: any) => (
                    <tr key={e.userId}>
                      <td><span className="font-medium text-stone-900">{e.userName}</span></td>
                      <td>{e.orders}</td>
                      <td><span className="font-semibold text-stone-900">{formatCurrency(e.revenue)}</span></td>
                      <td>{formatCurrency(e.avgTicket)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
