import { cn, formatCurrency } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  change?: { value: number; label: string };
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  isCurrency?: boolean;
  loading?: boolean;
}

export function KpiCard({
  title, value, change, icon: Icon, iconColor = 'text-amber-600',
  iconBg = 'bg-amber-50', isCurrency = false, prefix, suffix, loading,
}: KpiCardProps) {
  const displayValue = isCurrency && typeof value === 'number'
    ? formatCurrency(value)
    : `${prefix || ''}${value}${suffix || ''}`;

  if (loading) {
    return (
      <div className="kpi-card">
        <div className="animate-pulse space-y-3">
          <div className="flex justify-between items-start">
            <div className="h-3 bg-stone-200 rounded w-24" />
            <div className="w-10 h-10 bg-stone-200 rounded-xl" />
          </div>
          <div className="h-7 bg-stone-200 rounded w-32" />
          <div className="h-3 bg-stone-200 rounded w-20" />
        </div>
      </div>
    );
  }

  return (
    <div className="kpi-card group">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-stone-500">{title}</p>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
      </div>
      <p className="text-2xl font-bold text-stone-900 mb-1">{displayValue}</p>
      {change && (
        <div className="flex items-center gap-1">
          <span className={cn('text-xs font-medium', change.value >= 0 ? 'text-emerald-600' : 'text-red-500')}>
            {change.value >= 0 ? '+' : ''}{change.value}%
          </span>
          <span className="text-xs text-stone-400">{change.label}</span>
        </div>
      )}
    </div>
  );
}
