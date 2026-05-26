'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Check, Clock, Bike, Package, X, ChevronRight, RefreshCw } from 'lucide-react';
import { storeApi } from '@/lib/api';
import { formatCurrency, formatDate, ORDER_STATUS_LABELS, timeAgo } from '@/lib/utils';
import type { Order } from '@/types';
import { cn } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';

const STEPS = [
  { status: 'PENDING', label: 'Aguardando', icon: Clock },
  { status: 'CONFIRMED', label: 'Confirmado', icon: Check },
  { status: 'PREPARING', label: 'Preparando', icon: Package },
  { status: 'READY', label: 'Pronto', icon: Check },
  { status: 'DELIVERING', label: 'Na entrega', icon: Bike },
  { status: 'DELIVERED', label: 'Entregue', icon: Check },
];

export default function PedidoPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOrder = useCallback(async () => {
    try {
      const { data } = await storeApi.get(`/orders/${id}/track`);
      setOrder(data);
    } catch {}
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    loadOrder();
    // Poll for updates every 30s while not delivered/cancelled
    const interval = setInterval(() => {
      if (order?.status !== 'DELIVERED' && order?.status !== 'CANCELLED') {
        loadOrder();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [loadOrder, order?.status]);

  if (loading) {
    return (
      <div className="container-store py-12 max-w-xl mx-auto">
        <div className="space-y-4">
          <div className="h-8 skeleton rounded-lg w-48" />
          <div className="h-40 skeleton rounded-2xl" />
          <div className="h-32 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-store py-12 text-center max-w-xl mx-auto">
        <p className="text-stone-400 mb-4">Pedido não encontrado</p>
        <Link href="/cardapio" className="btn-brand">Ir ao cardápio</Link>
      </div>
    );
  }

  const currentStepIdx = STEPS.findIndex(s => s.status === order.status);
  const isCancelled = order.status === 'CANCELLED';
  const pixPayment = order.payments?.find(p => p.method === 'PIX' && p.status === 'PENDING');

  return (
    <div className="container-store py-8 max-w-xl mx-auto">
      {/* Header */}
      <div className={cn('card p-5 mb-5', isCancelled && 'border-red-200 bg-red-50')}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-stone-400 mb-1">Pedido</p>
            <p className="text-2xl font-black text-stone-900">#{order.orderNumber}</p>
          </div>
          <button onClick={loadOrder} className="p-2 rounded-xl hover:bg-stone-100 transition-colors">
            <RefreshCw className="w-4 h-4 text-stone-400" />
          </button>
        </div>

        {isCancelled ? (
          <div className="flex items-center gap-2 text-red-600">
            <X className="w-5 h-5" />
            <span className="font-semibold">Pedido cancelado</span>
          </div>
        ) : (
          <div className="relative">
            <div className="flex items-center justify-between relative z-10">
              {STEPS.slice(0, order.type === 'TAKEOUT' ? 5 : 6).map((step, i) => {
                const isCompleted = i <= currentStepIdx;
                const isCurrent = i === currentStepIdx;
                return (
                  <div key={step.status} className="flex flex-col items-center gap-1.5">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
                      isCompleted ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-stone-200 text-stone-300',
                      isCurrent && 'ring-4 ring-brand-200',
                    )}>
                      {isCompleted ? <Check className="w-4 h-4" /> : <step.icon className="w-3.5 h-3.5" />}
                    </div>
                    <span className={cn('text-xs font-medium', isCompleted ? 'text-brand-600' : 'text-stone-300')}>{step.label}</span>
                  </div>
                );
              })}
            </div>
            {/* Progress bar */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-stone-200 -z-0">
              <div
                className="h-full bg-brand-500 transition-all duration-500"
                style={{ width: currentStepIdx <= 0 ? '0%' : `${(currentStepIdx / (STEPS.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between text-sm">
          <span className="text-stone-400">{timeAgo(order.createdAt)}</span>
          {order.delivery?.estimatedTime && (
            <span className="flex items-center gap-1 text-stone-600">
              <Clock className="w-3.5 h-3.5" />
              ~{order.delivery.estimatedTime}min
            </span>
          )}
          {order.delivery?.deliverer && (
            <span className="text-stone-600">
              <Bike className="w-3.5 h-3.5 inline mr-1" />
              {order.delivery.deliverer.name}
            </span>
          )}
        </div>
      </div>

      {/* PIX QR code */}
      {pixPayment?.pixQrCode && (
        <div className="card p-5 mb-5 text-center">
          <h3 className="font-bold text-stone-900 mb-1">Pague com PIX</h3>
          <p className="text-sm text-stone-400 mb-4">Escaneie o QR Code ou copie o código</p>
          <div className="flex justify-center mb-4">
            <QRCodeSVG value={pixPayment.pixQrCode} size={200} level="M" />
          </div>
          <div className="bg-stone-50 rounded-xl p-3 text-xs text-stone-500 font-mono break-all mb-3">{pixPayment.pixCode}</div>
          <button
            onClick={() => { navigator.clipboard.writeText(pixPayment.pixCode || ''); toast.success('Código copiado!'); }}
            className="btn-brand-sm w-full"
          >
            Copiar código PIX
          </button>
          <div className="text-3xl font-bold text-brand-600 mt-3">{formatCurrency(pixPayment.amount)}</div>
        </div>
      )}

      {/* Order items */}
      <div className="card overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-stone-100">
          <h3 className="font-semibold text-stone-900">Itens do pedido</h3>
        </div>
        <div className="divide-y divide-stone-50">
          {order.items.map(item => (
            <div key={item.id} className="flex items-center gap-3 px-5 py-3">
              <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center text-sm font-bold text-stone-600">
                {item.quantity}×
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-stone-900">{item.product.name}</p>
                {item.addons && item.addons.length > 0 && (
                  <p className="text-xs text-stone-400">{item.addons.map(a => a.addon.name).join(', ')}</p>
                )}
                {item.notes && <p className="text-xs text-stone-400 italic">"{item.notes}"</p>}
              </div>
              <span className="text-sm font-semibold text-stone-900">{formatCurrency(item.total)}</span>
            </div>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-stone-100 space-y-1">
          <div className="flex justify-between text-sm text-stone-500">
            <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-sm text-emerald-600">
              <span>Desconto</span><span>-{formatCurrency(order.discount)}</span>
            </div>
          )}
          {order.deliveryFee > 0 && (
            <div className="flex justify-between text-sm text-stone-500">
              <span>Taxa de entrega</span><span>{formatCurrency(order.deliveryFee)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-stone-900 pt-1 border-t border-stone-100">
            <span>Total</span>
            <span className="text-brand-600">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Link href="/meus-pedidos" className="w-full btn-outline flex items-center justify-center gap-2">
          <Package className="w-4 h-4" /> Ver todos os pedidos
        </Link>
        <Link href="/cardapio" className="w-full btn-brand flex items-center justify-center gap-2">
          Fazer novo pedido <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
