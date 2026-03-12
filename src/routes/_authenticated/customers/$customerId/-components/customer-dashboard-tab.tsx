import { useQuery } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, FileText, Minus, Package, ShoppingCart, TrendingUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { getDashboardQuery } from '@/api/dashboard/query'
import { getErrorMessage } from '@/helpers/error'
import { DashboardOrdersChart } from '@/routes/_authenticated/-components/dashboard-orders-chart'
import { cn } from '@/lib/utils'

interface CustomerDashboardTabProps {
  customerId: string
  projectId: number | null
}

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

  const thisMonth = data.total_order_count ?? 0
  const lastMonth = data.last_month_order_count ?? 0
  const trend = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0
  const trendDirection = trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral'

  return (
    <div className='flex min-w-0 flex-col gap-4'>
      {/* Highlight stat */}
      <div className='rounded-[10px] border border-border bg-background p-5'>
        <div className='flex items-center gap-3'>
          <div className='flex size-9 items-center justify-center rounded-[8px] bg-primary/10 text-primary'>
            <TrendingUp className='size-4.5' />
          </div>
          <div className='min-w-0 flex-1'>
            <div className='flex items-baseline gap-2'>
              <span className='text-[28px] font-semibold tabular-nums tracking-tight text-foreground'>
                {thisMonth}
              </span>
              <span className='text-[13px] font-medium text-text-tertiary'>
                orders this month
              </span>
            </div>
            <div className='mt-0.5 flex items-center gap-1.5'>
              {trendDirection === 'up' && (
                <ArrowUp className='size-3 text-[#34C759]' />
              )}
              {trendDirection === 'down' && (
                <ArrowDown className='size-3 text-[#FF3B30]' />
              )}
              {trendDirection === 'neutral' && (
                <Minus className='size-3 text-text-tertiary' />
              )}
              <span
                className={cn(
                  'text-[13px] font-medium tabular-nums',
                  trendDirection === 'up' && 'text-[#34C759]',
                  trendDirection === 'down' && 'text-[#FF3B30]',
                  trendDirection === 'neutral' && 'text-text-tertiary'
                )}
              >
                {trend > 0 ? '+' : ''}
                {trend.toFixed(0)}% vs last month ({lastMonth})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className='grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2'>
        <KpiCard
          icon={Package}
          title='Unprocessed'
          value={String(data.unprocessed_orders)}
          description='Orders requiring action'
          accent={data.unprocessed_orders > 0 ? 'warning' : undefined}
        />
        <KpiCard
          icon={FileText}
          title='Pending Invoices'
          value={String(data.pending_invoices)}
          description='Awaiting payment'
          accent={data.pending_invoices > 0 ? 'info' : undefined}
        />
      </div>

      {/* Orders chart */}
      <div className='rounded-[10px] border border-border bg-background'>
        <div className='flex items-center gap-3 border-b border-border px-5 py-3'>
          <div className='flex size-8 items-center justify-center rounded-[6px] bg-primary/10 text-primary'>
            <ShoppingCart className='size-4' />
          </div>
          <div>
            <span className='text-[13px] font-semibold text-foreground'>
              Orders Trend
            </span>
            <p className='text-[13px] text-text-tertiary'>
              This month vs last month
            </p>
          </div>
        </div>
        <div className='p-4'>
          <DashboardOrdersChart metrics={data} />
        </div>
      </div>
    </div>
  )
}

// ── KPI Card ────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  title,
  description,
  value,
  accent,
}: {
  icon: LucideIcon
  title: string
  description: string
  value: string
  accent?: 'warning' | 'info'
}) {
  return (
    <div className='min-w-0 rounded-[10px] border border-border bg-background p-4'>
      <div className='mb-3 flex items-center gap-2'>
        <div
          className={cn(
            'flex size-7 items-center justify-center rounded-[6px]',
            accent === 'warning'
              ? 'bg-[#FF9500]/10 text-[#FF9500]'
              : accent === 'info'
                ? 'bg-primary/10 text-primary'
                : 'bg-bg-secondary text-text-tertiary'
          )}
        >
          <Icon className='size-3.5' />
        </div>
        <span className='text-[13px] font-medium text-text-tertiary'>{title}</span>
      </div>
      <div
        className={cn(
          'text-[22px] font-semibold tabular-nums tracking-tight',
          accent === 'warning' && Number(value) > 0
            ? 'text-[#FF9500]'
            : 'text-foreground'
        )}
      >
        {value}
      </div>
      <p className='mt-0.5 text-[13px] text-text-tertiary'>{description}</p>
    </div>
  )
}

// ── Skeleton ────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className='flex flex-col gap-4'>
      {/* Highlight skeleton */}
      <div className='rounded-[10px] border border-border bg-background p-5'>
        <div className='flex items-center gap-3'>
          <div className='size-9 animate-pulse rounded-[8px] bg-border' />
          <div>
            <div className='h-8 w-16 animate-pulse rounded bg-border' />
            <div className='mt-1.5 h-3 w-32 animate-pulse rounded bg-border' />
          </div>
        </div>
      </div>
      {/* KPI skeletons */}
      <div className='grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2'>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className='rounded-[10px] border border-border bg-background p-4'>
            <div className='mb-3 flex items-center gap-2'>
              <div className='size-7 animate-pulse rounded-[6px] bg-border' />
              <div className='h-3 w-20 animate-pulse rounded bg-border' />
            </div>
            <div className='h-7 w-12 animate-pulse rounded bg-border' />
            <div className='mt-2 h-2.5 w-24 animate-pulse rounded bg-border' />
          </div>
        ))}
      </div>
      {/* Chart skeleton */}
      <div className='rounded-[10px] border border-border bg-background'>
        <div className='flex items-center gap-3 border-b border-border px-5 py-3'>
          <div className='size-8 animate-pulse rounded-[6px] bg-border' />
          <div>
            <div className='h-4 w-24 animate-pulse rounded bg-border' />
            <div className='mt-1 h-3 w-36 animate-pulse rounded bg-border' />
          </div>
        </div>
        <div className='p-4'>
          <div className='h-[280px] animate-pulse rounded bg-border/50' />
        </div>
      </div>
    </div>
  )
}
