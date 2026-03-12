import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

import type { DashboardMetrics } from '@/api/dashboard/schema'
import { cn } from '@/lib/utils'

interface DashboardOrdersChartProps {
  metrics: DashboardMetrics
}

export function OrdersChangeBadge({ metrics }: DashboardOrdersChartProps) {
  const thisMonth = metrics.total_order_count
  const lastMonth = metrics.last_month_order_count
  const diff = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null
  const direction = thisMonth > lastMonth ? 'up' : thisMonth < lastMonth ? 'down' : 'same'

  if (diff === null) return null

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[6px] px-2 py-0.5 text-[13px] font-medium tabular-nums',
        direction === 'same' && 'bg-bg-secondary text-text-tertiary',
        direction === 'up' && 'bg-green-500/10 text-green-600 dark:text-green-400',
        direction === 'down' && 'bg-red-500/10 text-destructive'
      )}
    >
      {direction === 'up' && <ArrowUpRight className='size-3.5' />}
      {direction === 'down' && <ArrowDownRight className='size-3.5' />}
      {direction === 'same' && <Minus className='size-3.5' />}
      {direction === 'same' ? 'No change' : `${Math.abs(diff)}%`}
    </span>
  )
}

export const DashboardOrdersChart = ({ metrics }: DashboardOrdersChartProps) => {
  const thisMonth = metrics.total_order_count
  const lastMonth = metrics.last_month_order_count
  const max = Math.max(thisMonth, lastMonth, 1)

  return (
    <div className='flex flex-col gap-3'>
      <BarRow label='This month' value={thisMonth} max={max} color='var(--chart-1)' />
      <BarRow label='Last month' value={lastMonth} max={max} color='var(--chart-2)' />
    </div>
  )
}

function BarRow({
  label,
  value,
  max,
  color,
}: {
  label: string
  value: number
  max: number
  color: string
}) {
  const pct = max > 0 ? (value / max) * 100 : 0

  return (
    <div className='flex items-center gap-3'>
      <span className='w-20 shrink-0 text-[13px] text-text-tertiary'>{label}</span>
      <div className='relative h-8 flex-1 overflow-hidden rounded-[6px] bg-border/30'>
        <div
          className='absolute inset-y-0 left-0 rounded-[6px]'
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className='w-8 shrink-0 text-right text-[13px] font-medium tabular-nums'>
        {value}
      </span>
    </div>
  )
}
