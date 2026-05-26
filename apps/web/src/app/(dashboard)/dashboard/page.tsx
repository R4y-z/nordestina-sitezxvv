'use client';

import { useEffect, useState } from 'react';
import {
  TrendingUp, ShoppingBag, Calculator, Truck,
  Table2, ChefHat, RefreshCw, ArrowRight,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import Link from 'next/link';
import { api } from '@/lib/api';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { formatCurrency, getOrderStatusLabel, getOrderStatusColor, getOrderTypeLabel, formatDate } from '@/lib/utils';
import type { DashboardOverview } from '@/types';
import toast from 'react-hot-toast';

const TYPE_COLORS: Record<string, string> = {
  TABLE: '#8B4513', DELIVERY: '#F59E0B', TAKEAWAY: '#4A2010', QUENTINHA: '#10B981',
};

export default function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [revenueChart, setRevenueChart] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [ordersByType, setOrdersByType] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [ov, rc, tp, ot, ro] = await Promise.all([
        api.get('/dashboard/overview'),
        api.get('/dashboard/revenue-chart?days=7'),
        api.get('/dashboard/top-products?limit=5&days=30'),
        api.get('/dashboard/orders-by-type'),
        api.get('/dashboard/recent-orders?limit=8'),
      ]);
      setOverview(ov.data);
      setRevenueChart(rc.data);
      setTopProducts(tp.data);
      setOrdersByType(ot.data);
      setRecentOrders(ro.data);
    } catch {
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleRefresh = () => { setRefreshing(true); loadData(); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Visão geral do restaurante em tempo real</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} className="btn-outline">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Faturamento Hoje"
          value={overview?.today.revenue || 0}
          isCurrency
          icon={TrendingUp}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          loading={loading}
        />
        <KpiCard
          title="Pedidos Hoje"
          value={overview?.today.orders || 0}
          icon={ShoppingBag}
          iconColor="text-brown-600"
          iconBg="bg-brown-50"
          loading={loading}
        />
        <KpiCard
          title="Ticket Médio"
          value={overview?.today.avgTicket || 0}
          isCurrency
          icon={Calculator}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          loading={loading}
        />
        <KpiCard
          title="Faturamento Mês"
          value={overview?.month.revenue || 0}
          isCurrency
          icon={TrendingUp}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          loading={loading}
        />
      </div>

      {/* Live status */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pedidos Ativos', value: overview?.live.activeOrders || 0, icon: ShoppingBag, href: '/pedidos', color: 'text-amber-600 bg-amber-50' },
          { label: 'Mesas Ocupadas', value: overview?.live.occupiedTables || 0, icon: Table2, href: '/mesas', color: 'text-brown-700 bg-brown-50' },
          { label: 'Delivery Pendente', value: overview?.live.pendingDeliveries || 0, icon: Truck, href: '/delivery', color: 'text-blue-600 bg-blue-50' },
          { label: 'Na Cozinha', value: overview?.live.kitchenOrders || 0, icon: ChefHat, href: '/cozinha', color: 'text-orange-600 bg-orange-50' },
        ].map(item => (
          <Link key={item.href} href={item.href} className="card p-4 flex items-center gap-3 hover:shadow-card-hover transition-shadow group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900 leading-none">{loading ? '—' : item.value}</p>
              <p className="text-xs text-stone-500 mt-0.5">{item.label}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-stone-300 ml-auto group-hover:text-amber-500 transition-colors" />
          </Link>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-stone-900">Faturamento — Últimos 7 dias</h3>
              <p className="text-xs text-stone-400 mt-0.5">Receita diária em reais</p>
            </div>
          </div>
          {loading ? (
            <div className="h-52 bg-stone-100 rounded-lg animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueChart}>
                <defs>
                  <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `R$${v.toLocaleString('pt-BR')}`} />
                <Tooltip
                  formatter={(v: number) => [formatCurrency(v), 'Faturamento']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Area dataKey="revenue" stroke="#F59E0B" strokeWidth={2} fill="url(#revGradient)" dot={{ r: 3, fill: '#F59E0B' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Orders by type pie */}
        <div className="card p-5">
          <h3 className="font-semibold text-stone-900 mb-4">Pedidos por Tipo — Hoje</h3>
          {loading ? (
            <div className="h-52 bg-stone-100 rounded-lg animate-pulse" />
          ) : ordersByType.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-stone-400 text-sm">Sem pedidos hoje</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={ordersByType} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                  {ordersByType.map((entry) => (
                    <Cell key={entry.type} fill={TYPE_COLORS[entry.type] || '#9ca3af'} />
                  ))}
                </Pie>
                <Legend formatter={(v) => getOrderTypeLabel(v)} wrapperStyle={{ fontSize: 11 }} />
                <Tooltip formatter={(v, n) => [v, getOrderTypeLabel(n as string)]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-stone-900">Mais Vendidos — 30 dias</h3>
          </div>
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-stone-100 rounded animate-pulse" />)}</div>
          ) : (
            <div className="space-y-2">
              {topProducts.map((p, i) => (
                <div key={p.productId || i} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-stone-400">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-stone-700 truncate">{p.name}</span>
                      <span className="text-sm font-semibold text-stone-900 ml-2">{p.quantity}</span>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${(p.quantity / (topProducts[0]?.quantity || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
            <h3 className="font-semibold text-stone-900">Pedidos Recentes</h3>
            <Link href="/pedidos" className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-stone-100 rounded animate-pulse" />)}</div>
          ) : (
            <div className="divide-y divide-stone-50">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center gap-3 px-5 py-3 hover:bg-stone-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-stone-900">{order.orderNumber}</span>
                      <span className={`badge text-xs ${getOrderStatusColor(order.status)}`}>
                        {getOrderStatusLabel(order.status)}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {order.table ? `Mesa ${order.table.number}` : order.customer?.name || 'Cliente'} · {formatDate(order.createdAt, 'time')}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-stone-900">{formatCurrency(order.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
