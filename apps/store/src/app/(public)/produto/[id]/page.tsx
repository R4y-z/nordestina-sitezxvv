'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Clock, Plus, Minus, ShoppingCart, Star } from 'lucide-react';
import { storeApi } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { useCart } from '@/context/cart-context';
import type { Product, ProductAddon } from '@/types';
import toast from 'react-hot-toast';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<ProductAddon[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await storeApi.get(`/menu/products/${id}`);
        setProduct(data);
      } catch { router.push('/cardapio'); }
      finally { setLoading(false); }
    };
    load();
  }, [id, router]);

  const toggleAddon = (addon: ProductAddon) => {
    setSelectedAddons(prev =>
      prev.find(a => a.id === addon.id)
        ? prev.filter(a => a.id !== addon.id)
        : [...prev, addon],
    );
  };

  const addonTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
  const subtotal = product ? (product.price + addonTotal) * quantity : 0;

  const handleAdd = () => {
    if (!product) return;
    addItem(product, quantity, selectedAddons, notes || undefined);
    router.push('/carrinho');
  };

  if (loading) {
    return (
      <div className="container-store py-8">
        <div className="h-8 skeleton rounded-lg w-32 mb-6" />
        <div className="grid md:grid-cols-2 gap-8">
          <div className="h-80 skeleton rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 skeleton rounded-lg w-3/4" />
            <div className="h-4 skeleton rounded-lg" />
            <div className="h-4 skeleton rounded-lg w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="container-store py-6 max-w-4xl">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar ao cardápio
      </button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="relative h-72 md:h-full min-h-72 bg-stone-100 rounded-2xl overflow-hidden">
          {product.image ? (
            <Image src={product.image} alt={product.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-8xl opacity-20">🍽️</span>
            </div>
          )}
          {!product.available && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-bold text-lg">Indisponível no momento</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.category && (
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full mb-3" style={{ color: product.category.color }}>
              {product.category.name}
            </div>
          )}
          <h1 className="text-2xl font-black text-stone-900 mb-2">{product.name}</h1>
          {product.description && (
            <p className="text-stone-500 text-sm leading-relaxed mb-4">{product.description}</p>
          )}
          {product.preparationTime > 0 && (
            <div className="flex items-center gap-2 text-sm text-stone-400 mb-4">
              <Clock className="w-4 h-4" />
              <span>Tempo de preparo: ~{product.preparationTime} min</span>
            </div>
          )}

          <div className="text-3xl font-black text-brand-600 mb-6">{formatCurrency(product.price)}</div>

          {/* Addons */}
          {product.addons && product.addons.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-stone-900 mb-3">Adicionais</h3>
              <div className="space-y-2">
                {product.addons.map(addon => (
                  <label
                    key={addon.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all',
                      selectedAddons.find(a => a.id === addon.id)
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-stone-200 hover:border-stone-300',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={!!selectedAddons.find(a => a.id === addon.id)}
                        onChange={() => toggleAddon(addon)}
                        className="w-4 h-4 accent-brand-500"
                      />
                      <span className="text-sm font-medium text-stone-800">{addon.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-brand-600">+{formatCurrency(addon.price)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mb-6">
            <label className="label">Observações (opcional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: sem cebola, bem passado..."
              className="input h-20 resize-none py-2.5 text-sm"
            />
          </div>

          {/* Quantity + Add to cart */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-stone-100 rounded-xl p-1">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-stone-200 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-bold text-stone-900">{quantity}</span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-stone-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAdd}
              disabled={!product.available}
              className="flex-1 btn-brand py-3.5"
            >
              <ShoppingCart className="w-5 h-5" />
              Adicionar — {formatCurrency(subtotal)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
