'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, User, LogOut } from 'lucide-react';
import { useStoreAuth } from '@/context/auth-context';
import StoreHeader from '@/components/layout/store-header';
import StoreFooter from '@/components/layout/store-footer';

export default function ContaLayout({ children }: { children: React.ReactNode }) {
  const { customer, loading, logout } = useStoreAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !customer) router.push('/login?redirect=' + encodeURIComponent(router.toString()));
  }, [customer, loading, router]);

  if (loading || !customer) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <StoreHeader />
      <div className="flex-1 container-store py-8">
        <div className="grid md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="md:col-span-1">
            <div className="card p-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-dark-700 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white font-bold">{customer.name.charAt(0)}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-stone-900 truncate">{customer.name}</p>
                  <p className="text-xs text-stone-400 truncate">{customer.email}</p>
                </div>
              </div>
            </div>
            <nav className="card overflow-hidden">
              <Link href="/meus-pedidos" className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 border-b border-stone-100">
                <Package className="w-4 h-4 text-stone-400" /> Meus Pedidos
              </Link>
              <Link href="/perfil" className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 border-b border-stone-100">
                <User className="w-4 h-4 text-stone-400" /> Meu Perfil
              </Link>
              <button onClick={() => { logout(); router.push('/'); }} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50">
                <LogOut className="w-4 h-4" /> Sair
              </button>
            </nav>
          </aside>

          {/* Content */}
          <main className="md:col-span-3">{children}</main>
        </div>
      </div>
      <StoreFooter />
    </div>
  );
}
