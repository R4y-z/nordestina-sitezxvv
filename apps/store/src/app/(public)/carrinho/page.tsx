'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, X } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { storeApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CarrinhoPage() {
  const { items, total, itemCount, removeItem, updateQuantity, couponCode, setCouponCode, discount, setDiscount, clearCart } = useCart();
  const router = useRouter();
  const [couponInput, setCouponInput] = useState(couponCode);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    try {
      const { data } = await storeApi.post('/coupons/validate', { code: couponInput.trim(), subtotal: total });
      setCouponCode(couponInput.trim());
      setDiscount(data.discountAmount);
      toast.success(`Cupom aplicado: -${formatCurrency(data.discountAmount)}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Cupom inválido');
    } finally { setApplyingCoupon(false); }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponInput('');
    setDiscount(0);
  };

  if (items.length === 0) {
    return (
      <div className="container-store py-16 text-center max-w-lg mx-auto">
        <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-stone-200" />
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Carrinho vazio</h1>
        <p className="text-stone-400 mb-8">Adicione itens do nosso cardápio para começar seu pedido.</p>
        <Link href="/cardapio" className="btn-brand py-3.5 px-8">Ver Cardápio</Link>
      </div>
    );
  }

  const subtotal = items.reduce((sum, item) => sum + item.subtotal * item.quantity, 0);

  return (
    <div className="container-store py-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-stone-900 mb-6">
        Seu Carrinho <span className="text-stone-400 font-normal text-lg">({itemCount} iten{itemCount !== 1 ? 's' : 's'})</span>
      </h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="card p-4 flex items-start gap-4">
              <div className="w-16 h-16 bg-stone-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                {item.product.image ? (
                  <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl opacity-30">🍽️</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-stone-900">{item.product.name}</p>
                {item.addons.length > 0 && (
                  <p className="text-xs text-stone-400 mt-0.5">+{item.addons.map(a => a.name).join(', ')}</p>
                )}
                {item.notes && (
                  <p className="text-xs text-stone-400 italic mt-0.5">Obs: {item.notes}</p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 bg-stone-100 rounded-lg p-0.5">
                    <button onClick={() => updateQuantity(idx, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-stone-200 transition-colors">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(idx, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-stone-200 transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-stone-900">{formatCurrency(item.subtotal * item.quantity)}</span>
                    <button onClick={() => removeItem(idx)} className="text-stone-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button onClick={clearCart} className="text-sm text-stone-400 hover:text-red-500 transition-colors flex items-center gap-1.5 mt-2">
            <X className="w-4 h-4" /> Limpar carrinho
          </button>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="card p-5 sticky top-20">
            <h2 className="font-bold text-stone-900 mb-4">Resumo do Pedido</h2>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Desconto ({couponCode})</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-stone-400">
                <span>Taxa de entrega</span>
                <span>calculada no checkout</span>
              </div>
            </div>

            <div className="border-t border-stone-100 pt-3 mb-5">
              <div className="flex justify-between font-bold text-stone-900">
                <span>Total</span>
                <span className="text-brand-600 text-lg">{formatCurrency(Math.max(0, subtotal - discount))}</span>
              </div>
            </div>

            {/* Coupon */}
            {!couponCode ? (
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                  <input
                    value={couponInput}
                    onChange={e => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                    placeholder="Cupom de desconto"
                    className="input pl-9 py-2 text-sm"
                  />
                </div>
                <button onClick={applyCoupon} disabled={applyingCoupon || !couponInput.trim()} className="btn-outline px-3 py-2 text-sm">
                  {applyingCoupon ? '...' : 'OK'}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mb-4">
                <span className="text-sm font-medium text-emerald-700"><Tag className="w-3.5 h-3.5 inline mr-1" />{couponCode}</span>
                <button onClick={removeCoupon} className="text-emerald-500 hover:text-red-500"><X className="w-4 h-4" /></button>
              </div>
            )}

            <button onClick={() => router.push('/checkout')} className="w-full btn-brand py-3.5">
              Continuar <ArrowRight className="w-4 h-4" />
            </button>

            <Link href="/cardapio" className="block text-center text-sm text-stone-400 hover:text-stone-700 mt-3 transition-colors">
              Adicionar mais itens
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
