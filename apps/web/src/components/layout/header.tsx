'use client';

import { Bell, Search, ChevronDown, User, LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { getRoleLabel } from '@/lib/utils';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/pedidos': 'Pedidos',
  '/cardapio/categorias': 'Categorias',
  '/cardapio/produtos': 'Produtos',
  '/mesas': 'Mesas',
  '/cozinha': 'Cozinha',
  '/caixa': 'Caixa',
  '/delivery': 'Delivery',
  '/estoque': 'Estoque',
  '/financeiro': 'Financeiro',
  '/clientes': 'Clientes',
  '/funcionarios': 'Funcionários',
  '/relatorios': 'Relatórios',
  '/configuracoes': 'Configurações',
};

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const title = PAGE_TITLES[pathname] || 'Nordestina Sistema';

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-stone-200 flex items-center px-6 gap-4">
      {/* Page title */}
      <div className="flex-1 ml-10 lg:ml-0">
        <h1 className="text-base font-semibold text-stone-900">{title}</h1>
        <p className="text-xs text-stone-400 capitalize">{dateStr}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(v => !v)}
            className="flex items-center gap-2.5 h-9 pl-2 pr-3 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <div className="w-7 h-7 bg-brown-700 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-stone-900 leading-none">{user?.name}</p>
              <p className="text-xs text-stone-400 mt-0.5">{getRoleLabel(user?.role || '')}</p>
            </div>
            <ChevronDown className={cn('w-3.5 h-3.5 text-stone-400 transition-transform', showUserMenu && 'rotate-180')} />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl border border-stone-200 shadow-lg z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-stone-100">
                  <p className="text-sm font-semibold text-stone-900">{user?.name}</p>
                  <p className="text-xs text-stone-400">{user?.email}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
