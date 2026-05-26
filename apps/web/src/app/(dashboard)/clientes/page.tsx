'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, User, Phone, ShoppingBag, Star, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ClientesPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const loadCustomers = useCallback(async () => {
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const { data } = await api.get(`/customers${params}`);
      // A API retorna { items, total, page, totalPages } — garantir que é sempre array
      const arr = Array.isArray(data)
        ? data
        : Array.isArray(data.items)
          ? data.items
          : Array.isArray(data.customers)
            ? data.customers
            : Array.isArray(data.data)
              ? data.data
              : [];
      setCustomers(arr);
    } catch { toast.error('Erro ao carregar clientes'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => loadCustomers(), 300);
    return () => clearTimeout(t);
  }, [loadCustomers]);

  const viewCustomer = async (c: any) => {
    setSelected(c);
    setLoadingOrders(true);
    try {
      const { data } = await api.get(`/customers/${c.id}/orders`);
      setOrders(data);
    } catch {}
    finally { setLoadingOrders(false); }
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">{customers.length} cliente{customers.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, telefone ou e-mail..." className="input pl-9" />
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Customers list */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-100">
            <p className="text-sm font-semibold text-stone-700">Lista de Clientes</p>
          </div>
          <div className="divide-y divide-stone-50 max-h-[600px] overflow-y-auto">
            {loading ? (
              [...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 bg-stone-100 rounded-full animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-stone-100 rounded animate-pulse w-32" />
                    <div className="h-3 bg-stone-100 rounded animate-pulse w-24" />
                  </div>
                </div>
              ))
            ) : customers.length === 0 ? (
              <div className="p-10 text-center text-stone-400 text-sm">Nenhum cliente encontrado</div>
            ) : customers.map(c => (
              <button
                key={c.id}
                onClick={() => viewCustomer(c)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors text-left ${selected?.id === c.id ? 'bg-amber-50' : ''}`}
              >
                <div className="w-10 h-10 bg-brown-700 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white text-sm font-bold">{c.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-900 truncate">{c.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {c.phone && <span className="text-xs text-stone-400">{c.phone}</span>}
                    {c._count?.orders > 0 && (
                      <span className="text-xs text-amber-600 font-medium">{c._count.orders} pedidos</span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-300 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Customer detail */}
        <div className="lg:col-span-3">
          {!selected ? (
            <div className="card p-12 text-center">
              <User className="w-12 h-12 mx-auto mb-3 text-stone-200" />
              <p className="text-stone-400 text-sm">Selecione um cliente para ver os detalhes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Profile card */}
              <div className="card p-5">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-brown-700 rounded-2xl flex items-center justify-center shrink-0">
                    <span className="text-white text-xl font-bold">{selected.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-stone-900">{selected.name}</h2>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {selected.phone && (
                        <span className="flex items-center gap-1.5 text-sm text-stone-500">
                          <Phone className="w-3.5 h-3.5" />{selected.phone}
                        </span>
                      )}
                      {selected.email && (
                        <span className="text-sm text-stone-500">{selected.email}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-stone-100">
                  {[
                    { label: 'Total Pedidos', value: selected._count?.orders || 0, icon: ShoppingBag },
                    { label: 'Total Gasto', value: formatCurrency(selected.totalSpent || 0), icon: null },
                    { label: 'Pontos', value: selected.loyaltyPoints || 0, icon: Star },
                  ].map(s => (
                    <div key={s.label} className="text-center bg-stone-50 rounded-xl p-3">
                      <p className="text-lg font-bold text-stone-900">{s.value}</p>
                      <p className="text-xs text-stone-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {selected.addresses?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-stone-100">
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Endereços</p>
                    <div className="space-y-1">
                      {selected.addresses.map((addr: any) => (
                        <p key={addr.id} className="text-sm text-stone-600">
                          {addr.street}, {addr.number} — {addr.neighborhood}, {addr.city}
                          {addr.isDefault && <span className="ml-2 badge bg-amber-100 text-amber-700 text-xs">Principal</span>}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Orders */}
              <div className="card overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100">
                  <h3 className="font-semibold text-stone-900">Histórico de Pedidos</h3>
                </div>
                {loadingOrders ? (
                  <div className="p-6 space-y-2">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-stone-100 rounded animate-pulse" />)}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="p-8 text-center text-stone-400 text-sm">Nenhum pedido encontrado</div>
                ) : (
                  <div className="divide-y divide-stone-50 max-h-72 overflow-y-auto">
                    {orders.map((order: any) => (
                      <div key={order.id} className="flex items-center gap-4 px-5 py-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-stone-900">{order.orderNumber}</span>
                            <span className="text-xs text-stone-400">{formatDate(order.createdAt, 'datetime')}</span>
                          </div>
                          <p className="text-xs text-stone-400 mt-0.5">{order.items?.length} iten{order.items?.length !== 1 ? 's' : 's'}</p>
                        </div>
                        <span className="font-semibold text-stone-900">{formatCurrency(order.total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
