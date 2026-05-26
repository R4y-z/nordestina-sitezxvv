'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ShoppingBag, UtensilsCrossed, Table2, ChefHat,
  Calculator, Truck, Package, TrendingUp, Users, UserCheck,
  BarChart3, Settings, ChevronLeft, ChevronRight, LogOut,
  Bell, X, Menu, ChevronDown, Ticket,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import type { Role } from '@/types';

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  roles?: Role[];
  children?: { label: string; href: string; roles?: Role[] }[];
}

const NAV_ITEMS: NavItem[] = [
  // Visível apenas para admin/gerente
  { label: 'Dashboard',    href: '/dashboard',   icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER'] },

  // Garçom, caixa e gerência precisam de pedidos
  { label: 'Pedidos',      href: '/pedidos',      icon: ShoppingBag,    roles: ['ADMIN', 'MANAGER', 'CASHIER', 'WAITER'] },

  // Comandas — self-service por KG (churrascaria nordestina)
  { label: 'Comandas',     href: '/comandas',     icon: Ticket,         roles: ['ADMIN', 'MANAGER', 'CASHIER', 'WAITER'] },

  // Cardápio é gerencial (criar/editar produtos e categorias)
  {
    label: 'Cardápio', icon: UtensilsCrossed, roles: ['ADMIN', 'MANAGER'],
    children: [
      { label: 'Categorias', href: '/cardapio/categorias' },
      { label: 'Produtos',   href: '/cardapio/produtos'   },
    ],
  },

  // Mesas: garçom e caixa operam, gerência administra
  { label: 'Mesas',        href: '/mesas',        icon: Table2,         roles: ['ADMIN', 'MANAGER', 'CASHIER', 'WAITER'] },

  // Áreas específicas por função
  { label: 'Cozinha',      href: '/cozinha',      icon: ChefHat,        roles: ['ADMIN', 'MANAGER', 'KITCHEN'] },
  { label: 'Caixa',        href: '/caixa',        icon: Calculator,     roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
  { label: 'Delivery',     href: '/delivery',     icon: Truck,          roles: ['ADMIN', 'MANAGER', 'DELIVERY'] },

  // Operacional restrito — WAITER não acessa
  { label: 'Estoque',      href: '/estoque',      icon: Package,        roles: ['ADMIN', 'MANAGER'] },
  { label: 'Financeiro',   href: '/financeiro',   icon: TrendingUp,     roles: ['ADMIN', 'MANAGER'] },
  { label: 'Clientes',     href: '/clientes',     icon: Users,          roles: ['ADMIN', 'MANAGER', 'CASHIER'] },

  // Exclusivo admin/gerente
  { label: 'Funcionários', href: '/funcionarios', icon: UserCheck,      roles: ['ADMIN', 'MANAGER'] },
  { label: 'Relatórios',   href: '/relatorios',   icon: BarChart3,      roles: ['ADMIN', 'MANAGER'] },
  { label: 'Configurações',href: '/configuracoes',icon: Settings,       roles: ['ADMIN'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const userRole = user?.role as Role;

  const canSeeItem = (item: NavItem) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const toggleExpand = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label],
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-sidebar-border shrink-0',
        collapsed ? 'justify-center' : 'gap-3',
      )}>
        <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shrink-0">
          <UtensilsCrossed className="w-4 h-4 text-brown-950" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-white text-sm leading-none">Nordestina Sistema</p>
            <p className="text-sidebar-muted text-xs mt-0.5">Restaurante</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.filter(canSeeItem).map((item) => {
          if (item.children) {
            const isExpanded = expandedItems.includes(item.label);
            const hasActiveChild = item.children.some(c => c.href && isActive(c.href));

            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleExpand(item.label)}
                  className={cn(
                    'w-full flex items-center rounded-lg transition-all duration-150 group',
                    collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5 gap-3',
                    hasActiveChild ? 'bg-amber-500/10 text-amber-400' : 'text-sidebar-text hover:bg-sidebar-hover',
                  )}
                >
                  <item.icon className={cn('w-[18px] h-[18px] shrink-0', hasActiveChild ? 'text-amber-400' : 'text-sidebar-muted group-hover:text-sidebar-text')} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                      <ChevronDown className={cn('w-4 h-4 text-sidebar-muted transition-transform', isExpanded && 'rotate-180')} />
                    </>
                  )}
                </button>
                {!collapsed && isExpanded && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-sidebar-border pl-3">
                    {item.children.filter(c => !c.roles || c.roles.includes(userRole)).map(child => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'block px-3 py-2 rounded-lg text-sm transition-all duration-150',
                          isActive(child.href)
                            ? 'bg-amber-500/10 text-amber-400 font-medium'
                            : 'text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-hover',
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                'flex items-center rounded-lg transition-all duration-150 group',
                collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5 gap-3',
                isActive(item.href!)
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'text-sidebar-text hover:bg-sidebar-hover',
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={cn(
                'w-[18px] h-[18px] shrink-0 transition-colors',
                isActive(item.href!) ? 'text-amber-400' : 'text-sidebar-muted group-hover:text-sidebar-text',
              )} />
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
              {!collapsed && isActive(item.href!) && (
                <div className="ml-auto w-1.5 h-1.5 bg-amber-400 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className={cn(
        'border-t border-sidebar-border p-3 shrink-0',
        collapsed ? 'flex flex-col items-center gap-2' : 'space-y-2',
      )}>
        {!collapsed && (
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg">
            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shrink-0">
              <span className="text-brown-950 text-xs font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-sidebar-muted text-xs truncate">{user?.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className={cn(
            'flex items-center gap-2 text-sidebar-muted hover:text-red-400 transition-colors rounded-lg py-2 w-full',
            collapsed ? 'justify-center px-2' : 'px-3',
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="text-sm">Sair</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-brown-900 rounded-lg flex items-center justify-center text-white"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar-bg" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-sidebar-muted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden lg:flex flex-col bg-sidebar-bg border-r border-sidebar-border transition-all duration-300 shrink-0 h-screen sticky top-0',
        collapsed ? 'w-16' : 'w-60',
      )}>
        <SidebarContent />
        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="absolute -right-3 top-20 w-6 h-6 bg-brown-700 border border-sidebar-border rounded-full flex items-center justify-center text-white hover:bg-amber-500 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>
    </>
  );
}
