'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { CartItem, Product, ProductAddon } from '@/types';
import toast from 'react-hot-toast';

interface CartContextType {
  items: CartItem[];
  total: number;
  itemCount: number;
  addItem: (product: Product, quantity: number, addons: ProductAddon[], notes?: string) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  clearCart: () => void;
  couponCode: string;
  setCouponCode: (code: string) => void;
  discount: number;
  setDiscount: (value: number) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);

  // Persist cart
  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      try { setItems(JSON.parse(saved)); } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const total = items.reduce((sum, item) => sum + item.subtotal * item.quantity, 0) - discount;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const addItem = useCallback((product: Product, quantity: number, addons: ProductAddon[], notes?: string) => {
    const addonTotal = addons.reduce((s, a) => s + a.price, 0);
    const subtotal = product.price + addonTotal;
    setItems(prev => {
      // Check for existing identical item
      const existingIdx = prev.findIndex(
        i => i.product.id === product.id &&
          JSON.stringify(i.addons.map(a => a.id).sort()) === JSON.stringify(addons.map(a => a.id).sort()) &&
          i.notes === notes,
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], quantity: updated[existingIdx].quantity + quantity };
        return updated;
      }
      return [...prev, { product, quantity, addons, notes, subtotal }];
    });
    toast.success(`${product.name} adicionado ao carrinho`);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateQuantity = useCallback((index: number, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter((_, i) => i !== index));
      return;
    }
    setItems(prev => prev.map((item, i) => i === index ? { ...item, quantity } : item));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setCouponCode('');
    setDiscount(0);
    localStorage.removeItem('cart');
  }, []);

  return (
    <CartContext.Provider value={{ items, total, itemCount, addItem, removeItem, updateQuantity, clearCart, couponCode, setCouponCode, discount, setDiscount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
