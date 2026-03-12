import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

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
    value: (m: DashboardMetrics) => m.total_order_count,
    format: (n: number) => String(n),
    prev: (m: DashboardMetrics) => m.last_month_order_count,
  },
  {
    key: 'unprocessed',
    title: 'Unprocessed',
    value: (m: DashboardMetrics) => m.unprocessed_orders,
    format: (n: number) => String(n),
    prev: null,
  },
  {
    key: 'pending',
    title: 'Pending Invoices',
    value: (m: DashboardMetrics) => m.pending_invoices,
    format: (n: number) => String(n),
    prev: null,
  },
  {
    key: 'totalSales',
    title: 'Total Sales',
    value: (m: DashboardMetrics) => m.total.total_sales,
    format: (n: number) => formatCurrency(n),
    prev: (m: DashboardMetrics) => m.total.last_month_total_sales,
    hidden: true,
  },
  {
    key: 'avgOrder',
    title: 'Avg Order',
    value: (m: DashboardMetrics) => m.total.average_order_value,
    format: (n: number) => formatCurrency(n),
    prev: (m: DashboardMetrics) => m.total.last_month_average_order_value,
    hidden: true,
  },
  {
    key: 'outstanding',
    title: 'Outstanding',
    value: (m: DashboardMetrics) => m.total.outstanding_invoices,
    format: (n: number) => formatCurrency(n),
    prev: null,
    hidden: true,
  },
] as const

function getChange(current: number, previous: number): { pct: number; direction: 'up' | 'down' | 'same' } | null {
  if (previous === 0) return null
  const pct = Math.round(((current - previous) / previous) * 100)
  const direction = pct > 0 ? 'up' : pct < 0 ? 'down' : 'same'
  return { pct, direction }
}

export const DashboardKpis = ({ metrics }: DashboardKpisProps) => {
  return (
    <div className='grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6'>
      {KPI_CONFIG.map((config) => {
        const value = config.value(metrics)
        const prev = config.prev ? config.prev(metrics) : null
        const change = prev != null ? getChange(value, prev) : null
        const isHidden = 'hidden' in config && config.hidden

        return (
          <div
            key={config.key}
            className='rounded-[8px] border border-border bg-background px-3 py-3 sm:px-4 sm:py-4'
          >
            <div className='text-[11px] font-medium uppercase tracking-[0.04em] text-text-tertiary sm:text-[12px]'>
              {config.title}
            </div>
            <div className='mt-1 truncate text-[16px] font-semibold tabular-nums leading-none tracking-tight sm:mt-1.5 sm:text-[20px]'>
              {isHidden ? '—' : config.format(value)}
            </div>
            {change && !isHidden && (
              <span
                className={cn(
                  'mt-1.5 inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums leading-none',
                  change.direction === 'up' && 'text-green-600 dark:text-green-400',
                  change.direction === 'down' && 'text-destructive',
                  change.direction === 'same' && 'text-text-tertiary'
                )}
              >
                {change.direction === 'up' && <ArrowUpRight className='size-3' />}
                {change.direction === 'down' && <ArrowDownRight className='size-3' />}
                {change.direction === 'same' && <Minus className='size-3' />}
                {change.direction === 'same' ? '0%' : `${Math.abs(change.pct)}%`}
                <span className='text-text-tertiary'> vs last mo</span>
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
