'use client';

import { useEffect, useState, useCallback } from 'react';
import { DollarSign, Plus, Minus, Lock, Unlock, CreditCard, Smartphone, Banknote, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Dinheiro', icon: Banknote },
  { value: 'PIX', label: 'PIX', icon: Smartphone },
  { value: 'CREDIT_CARD', label: 'Crédito', icon: CreditCard },
  { value: 'DEBIT_CARD', label: 'Débito', icon: CreditCard },
];

export default function CaixaPage() {
  const { user } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openingAmount, setOpeningAmount] = useState('');
  const [closingAmount, setClosingAmount] = useState('');
  const [bleedAmount, setBleedAmount] = useState('');
  const [bleedReason, setBleedReason] = useState('');
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [payingOrder, setPayingOrder] = useState<any>(null);
  const [paymentData, setPaymentData] = useState({ method: 'CASH', amount: '', change: '0' });

  const loadSession = useCallback(async () => {
    try {
      const { data } = await api.get('/cashier/session/active');
      setSession(data);
    } catch { setSession(null); }
    finally { setLoading(false); }
  }, []);

  const loadActiveOrders = useCallback(async () => {
    try {
      const { data } = await api.get('/orders?status=READY&limit=20');
      setActiveOrders(data.items || []);
    } catch {}
  }, []);

  useEffect(() => {
    loadSession();
    loadActiveOrders();
  }, [loadSession, loadActiveOrders]);

  const openSession = async () => {
    try {
      await api.post('/cashier/session/open', { openingAmount: parseFloat(openingAmount) || 0 });
      toast.success('Caixa aberto com sucesso!');
      loadSession();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Erro ao abrir caixa'); }
  };

  const closeSession = async () => {
    if (!session) return;
    try {
      await api.patch(`/cashier/session/${session.id}/close`, { closingAmount: parseFloat(closingAmount) || 0 });
      toast.success('Caixa fechado com sucesso!');
      setSession(null);
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Erro ao fechar caixa'); }
  };

  const registerBleed = async () => {
    if (!session || !bleedAmount || !bleedReason) return;
    try {
      await api.post(`/cashier/session/${session.id}/bleed`, { amount: parseFloat(bleedAmount), reason: bleedReason });
      toast.success('Sangria registrada');
      setBleedAmount('');
      setBleedReason('');
      loadSession();
    } catch { toast.error('Erro ao registrar sangria'); }
  };

  const processPayment = async () => {
    if (!payingOrder) return;
    try {
      await api.post(`/cashier/payment/${payingOrder.id}`, {
        payments: [{ method: paymentData.method, amount: parseFloat(paymentData.amount) || payingOrder.total, change: parseFloat(paymentData.change) || 0 }],
      });
      toast.success('Pagamento processado com sucesso!');
      setPayingOrder(null);
      loadActiveOrders();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Erro ao processar pagamento'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Caixa</h1>
          <p className="page-subtitle">{session ? `Aberto às ${formatDate(session.openedAt, 'time')}` : 'Caixa fechado'}</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${session ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          {session ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          {session ? 'Aberto' : 'Fechado'}
        </div>
      </div>

      {!session ? (
        /* Abrir caixa */
        <div className="max-w-md mx-auto">
          <div className="card p-6">
            <h3 className="font-bold text-stone-900 mb-4">Abrir Caixa</h3>
            <div className="form-group mb-4">
              <label className="label">Valor de abertura (troco)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">R$</span>
                <input value={openingAmount} onChange={e => setOpeningAmount(e.target.value)}
                  type="number" step="0.01" min="0" placeholder="0,00" className="input pl-9" />
              </div>
            </div>
            <button onClick={openSession} className="w-full btn-accent">
              <Unlock className="w-4 h-4" /> Abrir Caixa
            </button>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Session info */}
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="font-semibold text-stone-900 mb-4">Resumo do Caixa</h3>
              <div className="space-y-3">
                {[
                  { label: 'Abertura', value: formatCurrency(session.openingAmount) },
                  { label: 'Total Vendas', value: formatCurrency(session.totalSales) },
                  { label: 'Dinheiro', value: formatCurrency(session.totalCash) },
                  { label: 'PIX', value: formatCurrency(session.totalPix) },
                  { label: 'Cartão', value: formatCurrency(session.totalCard) },
                ].map(item => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-stone-500">{item.label}</span>
                    <span className="font-semibold text-stone-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sangria */}
            <div className="card p-5">
              <h3 className="font-semibold text-stone-900 mb-3">Registrar Sangria</h3>
              <div className="space-y-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">R$</span>
                  <input value={bleedAmount} onChange={e => setBleedAmount(e.target.value)}
                    type="number" placeholder="Valor" className="input pl-9" />
                </div>
                <input value={bleedReason} onChange={e => setBleedReason(e.target.value)}
                  placeholder="Motivo da sangria" className="input" />
                <button onClick={registerBleed} disabled={!bleedAmount || !bleedReason} className="w-full btn-outline">
                  <Minus className="w-4 h-4" /> Registrar Sangria
                </button>
              </div>
            </div>

            {/* Fechar caixa */}
            <div className="card p-5">
              <h3 className="font-semibold text-stone-900 mb-3">Fechar Caixa</h3>
              <div className="relative mb-3">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">R$</span>
                <input value={closingAmount} onChange={e => setClosingAmount(e.target.value)}
                  type="number" placeholder="Valor em caixa" className="input pl-9" />
              </div>
              <button onClick={closeSession} className="w-full btn-danger">
                <Lock className="w-4 h-4" /> Fechar Caixa
              </button>
            </div>
          </div>

          {/* Pagamentos pendentes */}
          <div className="lg:col-span-2">
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-100">
                <h3 className="font-semibold text-stone-900">Pedidos para Pagamento</h3>
                <p className="text-xs text-stone-400 mt-0.5">Pedidos com status "Pronto" ou "Entregue"</p>
              </div>
              {activeOrders.length === 0 ? (
                <div className="p-12 text-center text-stone-400 text-sm">Nenhum pedido aguardando pagamento</div>
              ) : (
                <div className="divide-y divide-stone-50">
                  {activeOrders.map(order => (
                    <div key={order.id} className="flex items-center gap-4 px-5 py-4 hover:bg-stone-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-stone-900">{order.orderNumber}</span>
                          {order.table && <span className="text-xs bg-brown-100 text-brown-700 px-1.5 py-0.5 rounded">Mesa {order.table.number}</span>}
                        </div>
                        <p className="text-xs text-stone-400 mt-0.5">{order.items?.length} iten{order.items?.length !== 1 ? 's' : 's'}</p>
                      </div>
                      <span className="font-bold text-lg text-stone-900">{formatCurrency(order.total)}</span>
                      <button
                        onClick={() => { setPayingOrder(order); setPaymentData({ method: 'CASH', amount: String(order.total), change: '0' }); }}
                        className="btn-accent"
                      >
                        <Receipt className="w-4 h-4" /> Cobrar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment modal */}
      {payingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPayingOrder(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="p-6">
              <h3 className="font-bold text-xl text-stone-900 mb-1">Receber Pagamento</h3>
              <p className="text-stone-500 text-sm mb-5">Pedido {payingOrder.orderNumber}</p>
              <div className="text-center mb-5">
                <p className="text-sm text-stone-500">Total a receber</p>
                <p className="text-4xl font-bold text-stone-900">{formatCurrency(payingOrder.total)}</p>
              </div>
              {/* Payment methods */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {PAYMENT_METHODS.map(pm => (
                  <button
                    key={pm.value}
                    onClick={() => setPaymentData(p => ({ ...p, method: pm.value }))}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                      paymentData.method === pm.value
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-stone-200 text-stone-500 hover:border-stone-300'
                    }`}
                  >
                    <pm.icon className="w-5 h-5" />
                    {pm.label}
                  </button>
                ))}
              </div>
              <div className="space-y-3 mb-5">
                <div>
                  <label className="label">Valor recebido</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">R$</span>
                    <input value={paymentData.amount} onChange={e => {
                      const v = e.target.value;
                      const change = Math.max(0, parseFloat(v || '0') - payingOrder.total).toFixed(2);
                      setPaymentData(p => ({ ...p, amount: v, change }));
                    }} type="number" step="0.01" className="input pl-9" />
                  </div>
                </div>
                {paymentData.method === 'CASH' && parseFloat(paymentData.change) > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                    <p className="text-sm text-emerald-700">Troco: <strong>{formatCurrency(parseFloat(paymentData.change))}</strong></p>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setPayingOrder(null)} className="flex-1 btn-outline">Cancelar</button>
                <button onClick={processPayment} className="flex-1 btn-accent">Confirmar Pagamento</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
