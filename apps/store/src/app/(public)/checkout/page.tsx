'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Bike, Store, CreditCard, Smartphone, Banknote, ChevronDown, Check, AlertCircle } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { useStoreAuth } from '@/context/auth-context';
import { storeApi } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import type { CustomerAddress, DeliveryNeighborhood } from '@/types';
import toast from 'react-hot-toast';
import Link from 'next/link';

type OrderType = 'DELIVERY' | 'TAKEOUT';
type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH';

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: any; desc: string }[] = [
  { value: 'PIX', label: 'PIX', icon: Smartphone, desc: 'Pagamento instantâneo' },
  { value: 'CREDIT_CARD', label: 'Crédito', icon: CreditCard, desc: 'Débito na entrega' },
  { value: 'DEBIT_CARD', label: 'Débito', icon: CreditCard, desc: 'Débito na entrega' },
  { value: 'CASH', label: 'Dinheiro', icon: Banknote, desc: 'Troco na entrega' },
];

export default function CheckoutPage() {
  const { items, total, discount, couponCode, clearCart } = useCart();
  const { customer } = useStoreAuth();
  const router = useRouter();

  const [orderType, setOrderType] = useState<OrderType>('DELIVERY');
  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(null);
  const [neighborhoods, setNeighborhoods] = useState<DeliveryNeighborhood[]>([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<DeliveryNeighborhood | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [changeFor, setChangeFor] = useState('');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);

  // Guest delivery info
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestAddress, setGuestAddress] = useState({ street: '', number: '', neighborhood: '', complement: '' });

  useEffect(() => {
    if (items.length === 0) router.push('/cardapio');
  }, [items.length, router]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await storeApi.get('/delivery/neighborhoods');
        setNeighborhoods(data.filter((n: DeliveryNeighborhood) => n.active));
        if (data.length > 0) setSelectedNeighborhood(data[0]);
      } catch {}
    };
    load();
    if (customer?.addresses?.length) {
      const def = customer.addresses.find(a => a.isDefault) || customer.addresses[0];
      setSelectedAddress(def);
    }
  }, [customer]);

  const subtotal = items.reduce((sum, item) => sum + item.subtotal * item.quantity, 0) - discount;
  const deliveryFee = orderType === 'DELIVERY' ? (selectedNeighborhood?.fee || 0) : 0;
  const finalTotal = subtotal + deliveryFee;

  const placeOrder = async () => {
    if (orderType === 'DELIVERY' && !customer && (!guestName || !guestPhone)) {
      toast.error('Informe seu nome e telefone');
      return;
    }
    if (orderType === 'DELIVERY' && !selectedNeighborhood) {
      toast.error('Selecione o bairro de entrega');
      return;
    }

    setPlacing(true);
    try {
      const orderData: any = {
        type: orderType,
        paymentMethod,
        notes,
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          notes: item.notes,
          addonIds: item.addons.map(a => a.id),
        })),
        couponCode: couponCode || undefined,
      };

      if (orderType === 'DELIVERY') {
        if (customer && selectedAddress) {
          orderData.addressId = selectedAddress.id;
          orderData.deliveryNeighborhoodId = selectedNeighborhood?.id;
        } else {
          orderData.guestName = guestName;
          orderData.guestPhone = guestPhone;
          orderData.deliveryAddress = `${guestAddress.street}, ${guestAddress.number}`;
          orderData.deliveryNeighborhood = guestAddress.neighborhood;
          orderData.deliveryComplement = guestAddress.complement;
        }
      }

      if (paymentMethod === 'CASH' && changeFor) {
        orderData.changeFor = parseFloat(changeFor);
      }

      const { data } = await storeApi.post('/orders/store', orderData);
      clearCart();
      router.push(`/pedido/${data.id}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erro ao realizar pedido');
    } finally { setPlacing(false); }
  };

  if (items.length === 0) return null;

  return (
    <div className="container-store py-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Finalizar Pedido</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Order type */}
          <div className="card p-5">
            <h2 className="font-semibold text-stone-900 mb-4">Como deseja receber?</h2>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: 'DELIVERY', label: 'Delivery', icon: Bike, desc: 'Receba em casa' },
                { value: 'TAKEOUT', label: 'Retirar', icon: Store, desc: 'No balcão' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setOrderType(opt.value)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                    orderType === opt.value
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-stone-200 text-stone-500 hover:border-stone-300',
                  )}
                >
                  <opt.icon className="w-6 h-6" />
                  <div className="text-center">
                    <p className="font-semibold text-sm">{opt.label}</p>
                    <p className="text-xs opacity-70">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Address */}
          {orderType === 'DELIVERY' && (
            <div className="card p-5">
              <h2 className="font-semibold text-stone-900 mb-4">
                <MapPin className="w-4 h-4 inline mr-2 text-brand-500" />
                Endereço de entrega
              </h2>

              {customer ? (
                <div className="space-y-3">
                  {customer.addresses?.map(addr => (
                    <label
                      key={addr.id}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
                        selectedAddress?.id === addr.id ? 'border-brand-500 bg-brand-50' : 'border-stone-200',
                      )}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddress?.id === addr.id}
                        onChange={() => setSelectedAddress(addr)}
                        className="mt-0.5 accent-brand-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-stone-900">
                          {addr.street}, {addr.number}
                          {addr.complement && ` — ${addr.complement}`}
                        </p>
                        <p className="text-xs text-stone-400">{addr.neighborhood}, {addr.city}</p>
                        {addr.isDefault && <span className="text-xs text-brand-600 font-medium">Principal</span>}
                      </div>
                    </label>
                  ))}
                  {/* Neighborhood selector */}
                  <div>
                    <label className="label">Bairro (para calcular taxa)</label>
                    <select value={selectedNeighborhood?.id || ''} onChange={e => setSelectedNeighborhood(neighborhoods.find(n => n.id === e.target.value) || null)} className="input">
                      <option value="">Selecione o bairro</option>
                      {neighborhoods.map(n => <option key={n.id} value={n.id}>{n.name} — {formatCurrency(n.fee)}</option>)}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700"><Link href="/login?redirect=/checkout" className="font-semibold underline">Entre na sua conta</Link> para salvar seus endereços.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Nome *</label>
                      <input value={guestName} onChange={e => setGuestName(e.target.value)} className="input" placeholder="Seu nome" />
                    </div>
                    <div>
                      <label className="label">Telefone *</label>
                      <input value={guestPhone} onChange={e => setGuestPhone(e.target.value)} className="input" placeholder="(11) 99999-9999" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="label">Rua *</label>
                      <input value={guestAddress.street} onChange={e => setGuestAddress(a => ({ ...a, street: e.target.value }))} className="input" placeholder="Rua das Flores" />
                    </div>
                    <div>
                      <label className="label">Número *</label>
                      <input value={guestAddress.number} onChange={e => setGuestAddress(a => ({ ...a, number: e.target.value }))} className="input" placeholder="123" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Bairro *</label>
                    <select value={selectedNeighborhood?.id || ''} onChange={e => { const n = neighborhoods.find(x => x.id === e.target.value); setSelectedNeighborhood(n || null); setGuestAddress(a => ({ ...a, neighborhood: n?.name || '' })); }} className="input">
                      <option value="">Selecione seu bairro</option>
                      {neighborhoods.map(n => <option key={n.id} value={n.id}>{n.name} — {formatCurrency(n.fee)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Complemento</label>
                    <input value={guestAddress.complement} onChange={e => setGuestAddress(a => ({ ...a, complement: e.target.value }))} className="input" placeholder="Apto, bloco..." />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment */}
          <div className="card p-5">
            <h2 className="font-semibold text-stone-900 mb-4">Forma de Pagamento</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {PAYMENT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPaymentMethod(opt.value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-medium transition-all',
                    paymentMethod === opt.value
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-stone-200 text-stone-500 hover:border-stone-300',
                  )}
                >
                  <opt.icon className="w-5 h-5" />
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>

            {paymentMethod === 'CASH' && (
              <div>
                <label className="label">Troco para (opcional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">R$</span>
                  <input
                    value={changeFor}
                    onChange={e => setChangeFor(e.target.value)}
                    type="number"
                    step="0.01"
                    placeholder={String(Math.ceil(finalTotal))}
                    className="input pl-9"
                  />
                </div>
                {changeFor && parseFloat(changeFor) > finalTotal && (
                  <p className="text-sm text-emerald-600 mt-1">Troco: {formatCurrency(parseFloat(changeFor) - finalTotal)}</p>
                )}
              </div>
            )}

            {paymentMethod === 'PIX' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-700">QR Code do PIX será gerado após confirmar o pedido.</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="card p-5">
            <label className="label font-semibold text-stone-900">Observações do pedido</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Alguma observação geral para o pedido?"
              className="input h-20 resize-none py-2.5 text-sm"
            />
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="card p-5 sticky top-20">
            <h2 className="font-bold text-stone-900 mb-4">Resumo</h2>
            <div className="space-y-2 mb-4">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-stone-600">{item.quantity}× {item.product.name}</span>
                  <span className="text-stone-900 font-medium">{formatCurrency(item.subtotal * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-stone-100 pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span>{formatCurrency(items.reduce((s, i) => s + i.subtotal * i.quantity, 0))}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Desconto</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              {orderType === 'DELIVERY' && (
                <div className="flex justify-between text-stone-600">
                  <span>Taxa de entrega</span>
                  <span>{selectedNeighborhood ? formatCurrency(deliveryFee) : '—'}</span>
                </div>
              )}
            </div>
            <div className="border-t border-stone-100 pt-3 mb-5">
              <div className="flex justify-between font-bold text-stone-900">
                <span>Total</span>
                <span className="text-brand-600 text-lg">{formatCurrency(finalTotal)}</span>
              </div>
            </div>

            <button
              onClick={placeOrder}
              disabled={placing}
              className="w-full btn-brand py-4 text-base"
            >
              {placing ? 'Enviando...' : 'Confirmar Pedido'}
            </button>

            <p className="text-xs text-center text-stone-400 mt-3">
              Ao confirmar, você concorda com os termos de uso.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
