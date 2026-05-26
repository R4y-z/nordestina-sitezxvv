'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, User, LogOut, Package, ChevronDown, Menu, X } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { useStoreAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';

export default function StoreHeader() {
  const { itemCount } = useCart();
  const { customer, logout } = useStoreAuth();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'Churrascaria Nordestina';

  return (
    <header className="sticky-header">
      <div className="container-store h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-sm leading-none">CN</span>
          </div>
          <span className="font-black text-xl text-dark-950 hidden sm:block">{storeName}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/" className="text-sm font-medium text-stone-600 hover:text-stone-900 px-3 py-2 rounded-lg hover:bg-stone-100 transition-colors">Início</Link>
          <Link href="/cardapio" className="text-sm font-medium text-stone-600 hover:text-stone-900 px-3 py-2 rounded-lg hover:bg-stone-100 transition-colors">Cardápio</Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Cart */}
          <Link href="/carrinho" className="relative p-2.5 rounded-xl hover:bg-stone-100 transition-colors">
            <ShoppingCart className="w-5 h-5 text-stone-700" />
            {itemCount > 0 && (
              <span className="cart-badge">{itemCount > 9 ? '9+' : itemCount}</span>
            )}
          </Link>

          {/* User */}
          {customer ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-stone-100 transition-colors"
              >
                <div className="w-7 h-7 bg-dark-700 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{customer.name.charAt(0)}</span>
                </div>
                <span className="text-sm font-medium text-stone-700 hidden sm:block max-w-[100px] truncate">{customer.name.split(' ')[0]}</span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-stone-100 z-20 overflow-hidden animate-fade-in">
                    <div className="px-4 py-3 border-b border-stone-100">
                      <p className="font-semibold text-sm text-stone-900">{customer.name}</p>
                      <p className="text-xs text-stone-400 truncate">{customer.email}</p>
                    </div>
                    <Link href="/meus-pedidos" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition-colors">
                      <Package className="w-4 h-4" /> Meus Pedidos
                    </Link>
                    <Link href="/perfil" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition-colors">
                      <User className="w-4 h-4" /> Meu Perfil
                    </Link>
                    <button onClick={() => { logout(); setUserMenuOpen(false); router.push('/'); }} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-stone-100">
                      <LogOut className="w-4 h-4" /> Sair
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link href="/login" className="btn-brand-sm text-sm">
              <User className="w-4 h-4" /> Entrar
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-xl hover:bg-stone-100">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-100 bg-white px-4 py-3 space-y-1 animate-fade-in">
          <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-stone-700">Início</Link>
          <Link href="/cardapio" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-stone-700">Cardápio</Link>
        </div>
      )}
    </header>
  );
}
