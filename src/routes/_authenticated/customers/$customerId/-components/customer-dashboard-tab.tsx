import { useQuery } from '@tanstack/react-query'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

import { getDashboardQuery } from '@/api/dashboard/query'
import type { DashboardMetrics } from '@/api/dashboard/schema'
import { DashboardOrdersChart, OrdersChangeBadge } from '@/routes/_authenticated/-components/dashboard-orders-chart'
import { getErrorMessage } from '@/helpers/error'
import { formatCurrency } from '@/helpers/formatters'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface CustomerDashboardTabProps {
  customerId: string
  projectId: number | null
}

// ── KPI config ───────────────────────────────────────────────

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
    title: 'Pending',
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
  },
  {
    key: 'avgOrder',
    title: 'Avg Order',
    value: (m: DashboardMetrics) => m.total.average_order_value,
    format: (n: number) => formatCurrency(n),
    prev: (m: DashboardMetrics) => m.total.last_month_average_order_value,
  },
  {
    key: 'outstanding',
    title: 'Outstanding',
    value: (m: DashboardMetrics) => m.total.outstanding_invoices,
    format: (n: number) => formatCurrency(n),
    prev: null,
  },
] as const

function getChange(current: number, previous: number): { pct: number; direction: 'up' | 'down' | 'same' } | null {
  if (previous === 0) return null
  const pct = Math.round(((current - previous) / previous) * 100)
  const direction = pct > 0 ? 'up' : pct < 0 ? 'down' : 'same'
  return { pct, direction }
}

// ── Component ────────────────────────────────────────────────

export const CustomerDashboardTab = ({
  customerId,
  projectId,
}: CustomerDashboardTabProps) => {
  const params = {
    customer_id: customerId,
    project_id: projectId ?? undefined,
  }
  const { data, isLoading, error } = useQuery({
    ...getDashboardQuery(params),
    enabled: !!customerId,
  })

  if (error) {
    return (
      <div className='flex flex-1 items-center justify-center py-16'>
        <div className='text-center'>
          <p className='text-[13px] font-medium text-destructive'>
            Unable to load dashboard
          </p>
          <p className='mt-1 text-[13px] text-text-tertiary'>
            {getErrorMessage(error)}
          </p>
        </div>
      </div>
    )
  }

  if (isLoading || !data) {
    return <DashboardSkeleton />
  }

  return (
    <div className='flex min-w-0 flex-col gap-5'>
      {/* KPI cards */}
      <div className='grid min-w-0 grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3'>
        {KPI_CONFIG.map((config) => {
          const value = config.value(data)
          const prev = config.prev ? config.prev(data) : null
          const change = prev != null ? getChange(value, prev) : null

          return (
            <div
              key={config.key}
              className='rounded-[8px] border border-border bg-background px-3 py-3 sm:px-4 sm:py-4'
            >
              <div className='truncate text-[11px] font-medium uppercase tracking-[0.04em] text-text-tertiary sm:text-[12px]'>
                {config.title}
              </div>
              <div className='mt-1 truncate text-[16px] font-semibold tabular-nums leading-none tracking-tight sm:mt-1.5 sm:text-[20px]'>
                {config.format(value)}
              </div>
              {change && (
                <div
                  className={cn(
                    'mt-1.5 flex items-center gap-0.5 whitespace-nowrap text-[11px] font-medium tabular-nums leading-none',
                    change.direction === 'up' && 'text-green-600 dark:text-green-400',
                    change.direction === 'down' && 'text-destructive',
                    change.direction === 'same' && 'text-text-tertiary'
                  )}
                >
                  {change.direction === 'up' && <ArrowUpRight className='size-3' />}
                  {change.direction === 'down' && <ArrowDownRight className='size-3' />}
                  {change.direction === 'same' && <Minus className='size-3' />}
                  {change.direction === 'same' ? '0%' : `${Math.abs(change.pct)}%`}
                  <span className='text-text-quaternary'> vs prev</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Orders chart */}
      <div className='rounded-[8px] border border-border bg-background'>
        <div className='flex flex-wrap items-center gap-2 px-4 py-3 sm:gap-2.5'>
          <h2 className='text-[13px] font-semibold sm:text-[14px]'>Orders — this month vs last month</h2>
          <OrdersChangeBadge metrics={data} />
        </div>
        <div className='p-4'>
          <DashboardOrdersChart metrics={data} />
        </div>
      </div>
    </div>
  )
}

// ── Skeleton ────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className='flex flex-col gap-5'>
      {/* KPI skeletons */}
      <div className='grid min-w-0 grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3'>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className='rounded-[8px] border border-border bg-background px-3 py-3 sm:px-4 sm:py-4'>
            <Skeleton className='h-3 w-16' />
            <Skeleton className='mt-2.5 h-6 w-14' />
          </div>
        ))}
      </div>
      {/* Chart skeleton */}
      <div className='rounded-[8px] border border-border bg-background'>
        <div className='flex items-center gap-2.5 px-4 py-3'>
          <Skeleton className='h-4 w-48' />
        </div>
        <div className='space-y-3 p-4'>
          <Skeleton className='h-8 w-full rounded-[6px]' />
          <Skeleton className='h-8 w-1/4 rounded-[6px]' />
        </div>
      </div>
    </div>
  )
}
