import {
  ArrowDownRight,
  ArrowUpRight,
  Ban,
  ClipboardList,
  DollarSign,
  Minus,
  Receipt,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react'

import type { DashboardMetrics } from '@/api/dashboard/schema'
import { formatCurrency } from '@/helpers/formatters'
import { cn } from '@/lib/utils'

interface DashboardKpisProps {
  metrics: DashboardMetrics
}

const KPI_CONFIG = [
  {
    key: 'orders',
    title: 'Orders',
    subtitle: 'This month',
    value: (m: DashboardMetrics) => m.total_order_count,
    format: (n: number) => String(n),
    prev: (m: DashboardMetrics) => m.last_month_order_count,
    icon: ShoppingCart,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
  },
  {
    key: 'unprocessed',
    title: 'Unprocessed',
    subtitle: 'Pending review',
    value: (m: DashboardMetrics) => m.unprocessed_orders,
    format: (n: number) => String(n),
    prev: null,
    icon: ClipboardList,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
  },
  {
    key: 'pending',
    title: 'Pending',
    subtitle: 'Invoices',
    value: (m: DashboardMetrics) => m.pending_invoices,
    format: (n: number) => String(n),
    prev: null,
    icon: Receipt,
    iconBg: 'bg-orange-500/10',
    iconColor: 'text-orange-500',
  },
  {
    key: 'totalSales',
    title: 'Total Sales',
    subtitle: 'This month',
    value: (m: DashboardMetrics) => m.total.total_sales,
    format: (n: number) => formatCurrency(n),
    prev: (m: DashboardMetrics) => m.total.last_month_total_sales,
    icon: DollarSign,
    iconBg: 'bg-green-500/10',
    iconColor: 'text-green-500',
  },
  {
    key: 'avgOrder',
    title: 'Avg Order',
    subtitle: 'Per order value',
    value: (m: DashboardMetrics) => m.total.average_order_value,
    format: (n: number) => formatCurrency(n),
    prev: (m: DashboardMetrics) => m.total.last_month_average_order_value,
    icon: TrendingUp,
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-500',
  },
  {
    key: 'outstanding',
    title: 'Outstanding',
    subtitle: 'Unpaid balance',
    value: (m: DashboardMetrics) => m.total.outstanding_invoices,
    format: (n: number) => formatCurrency(n),
    prev: null,
    icon: Ban,
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-500',
  },
] as const

function getChange(
  current: number,
  previous: number
): { pct: number; direction: 'up' | 'down' | 'same' } | null {
  if (previous === 0) return null
  const pct = Math.round(((current - previous) / previous) * 100)
  const direction = pct > 0 ? 'up' : pct < 0 ? 'down' : 'same'
  return { pct, direction }
}

export const DashboardKpis = ({ metrics }: DashboardKpisProps) => {
  return (
    <div className='grid min-w-0 grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6'>
      {KPI_CONFIG.map((config) => {
        const value = config.value(metrics)
        const prev = config.prev ? config.prev(metrics) : null
        const change = prev != null ? getChange(value, prev) : null
        const Icon = config.icon

        return (
          <div
            key={config.key}
            className='rounded-[10px] border border-border bg-background px-3.5 py-3.5 sm:px-4 sm:py-4'
          >
            {/* Header row: title + icon */}
            <div className='flex items-start justify-between'>
              <div>
                <div className='text-[12px] font-semibold text-foreground sm:text-[13px]'>
                  {config.title}
                </div>
                <div className='mt-0.5 text-[11px] text-text-quaternary'>
                  {config.subtitle}
                </div>
              </div>
              <div
                className={cn(
                  'flex size-8 items-center justify-center rounded-[8px]',
                  config.iconBg
                )}
              >
                <Icon className={cn('size-4', config.iconColor)} strokeWidth={2} />
              </div>
            </div>

            {/* Value */}
            <div className='mt-3 truncate text-[18px] font-bold tabular-nums leading-none tracking-tight sm:text-[22px]'>
              {config.format(value)}
            </div>

            {/* Change indicator */}
            <div className='mt-2 h-3.5'>
              {change ? (
                <div
                  className={cn(
                    'flex items-center gap-0.5 text-[11px] font-medium tabular-nums leading-none',
                    change.direction === 'up' && 'text-green-600 dark:text-green-400',
                    change.direction === 'down' && 'text-destructive',
                    change.direction === 'same' && 'text-text-tertiary'
                  )}
                >
                  {change.direction === 'up' && <ArrowUpRight className='size-3' />}
                  {change.direction === 'down' && <ArrowDownRight className='size-3' />}
                  {change.direction === 'same' && <Minus className='size-3' />}
                  {change.direction === 'same'
                    ? '0%'
                    : `${change.direction === 'up' ? '+' : ''}${change.pct}%`}
                  <span className='ml-0.5 text-text-quaternary'>vs last month</span>
                </div>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
