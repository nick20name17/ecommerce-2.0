import type { DashboardFinancialTotal, DashboardMetrics } from '@/api/dashboard/schema'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  FileText,
  Minus,
  Package,
  Receipt,
  ShoppingCart,
  TrendingUp
} from 'lucide-react'

import { cn } from '@/lib/utils'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)

interface DashboardKpisProps {
  metrics: DashboardMetrics
}

function getFinancial(metrics: DashboardMetrics): DashboardFinancialTotal {
  return metrics.sales_total_field === 'total' ? metrics.total : metrics.sub_total
}

function TrendIndicator({
  current,
  previous,
  format = (n: number) => String(n),
  invert = false
}: {
  current: number
  previous: number
  format?: (n: number) => string
  invert?: boolean
}) {
  if (previous === 0) return <span className='text-muted-foreground text-xs'>—</span>
  const direction = current > previous ? 'up' : current < previous ? 'down' : 'same'
  const positive = invert ? direction === 'down' : direction === 'up'
  const Icon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus
  const pct = Math.round((Math.abs(current - previous) / previous) * 100)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
        direction === 'same' && 'text-muted-foreground',
        direction !== 'same' && positive && 'text-green-600 dark:text-green-400',
        direction !== 'same' && !positive && 'text-destructive'
      )}
    >
      <Icon className='size-3.5 shrink-0' />
      {direction !== 'same' ? `${pct}% vs ${format(previous)}` : 'No change'}
    </span>
  )
}

const KPI_CONFIG = [
  {
    key: 'orders',
    title: 'Total orders',
    description: 'All time',
    icon: ShoppingCart,
    value: (m: DashboardMetrics) => m.total_order_count,
    secondary: (m: DashboardMetrics) => `Last month: ${m.last_month_order_count}`,
    format: (n: number) => String(n),
    showTrend: false,
    colSpan: 'sm:col-span-1'
  },
  {
    key: 'sales',
    title: 'Total sales',
    description: 'All time',
    icon: DollarSign,
    value: (m: DashboardMetrics) => getFinancial(m).total_sales,
    secondary: (m: DashboardMetrics) =>
      `Last month: ${formatCurrency(getFinancial(m).last_month_total_sales)}`,
    format: formatCurrency,
    showTrend: false,
    colSpan: 'sm:col-span-1'
  },
  {
    key: 'aov',
    title: 'Average order value',
    description: 'Current vs last month',
    icon: TrendingUp,
    value: (m: DashboardMetrics) => getFinancial(m).average_order_value,
    format: formatCurrency,
    showTrend: true,
    trend: (m: DashboardMetrics) => ({
      current: getFinancial(m).average_order_value,
      previous: getFinancial(m).last_month_average_order_value
    }),
    colSpan: 'sm:col-span-1'
  },
  {
    key: 'unprocessed',
    title: 'Unprocessed orders',
    description: 'Require action',
    icon: Package,
    value: (m: DashboardMetrics) => m.unprocessed_orders,
    format: (n: number) => String(n),
    showTrend: false,
    colSpan: 'sm:col-span-1'
  },
  {
    key: 'pending',
    title: 'Pending invoices',
    description: 'Count',
    icon: FileText,
    value: (m: DashboardMetrics) => m.pending_invoices,
    format: (n: number) => String(n),
    showTrend: false,
    colSpan: 'sm:col-span-1'
  },
  {
    key: 'outstanding',
    title: 'Outstanding',
    description: 'Invoice balance',
    icon: Receipt,
    value: (m: DashboardMetrics) => getFinancial(m).outstanding_invoices,
    format: formatCurrency,
    showTrend: false,
    colSpan: 'sm:col-span-1'
  }
] as const

export function DashboardKpis({ metrics }: DashboardKpisProps) {
  return (
    <div className='grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {KPI_CONFIG.map((config) => {
        const Icon = config.icon
        const value = config.value(metrics)
        const format = config.format
        const trendConfig = config.showTrend && 'trend' in config ? config.trend(metrics) : null
        const secondary =
          'secondary' in config && typeof config.secondary === 'function'
            ? config.secondary(metrics)
            : null

        return (
          <Card
            key={config.key}
            className={cn(
              'min-w-0 overflow-hidden transition-shadow duration-200 hover:shadow-md dark:hover:shadow-none dark:hover:ring-1 dark:hover:ring-border',
              config.colSpan
            )}
          >
            <CardHeader className='flex flex-row items-start justify-between gap-3 pb-2'>
              <div className='space-y-1'>
                <CardTitle className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
                  <span className='flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                    <Icon className='size-4' />
                  </span>
                  {config.title}
                </CardTitle>
                <CardDescription>{config.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className='min-w-0 pt-0'>
              <div className='min-w-0 wrap-break-word text-2xl font-semibold tracking-tight tabular-nums'>
                {format(value)}
              </div>
              {trendConfig && (
                <div className='mt-1.5'>
                  <TrendIndicator
                    current={trendConfig.current}
                    previous={trendConfig.previous}
                    format={format}
                  />
                </div>
              )}
              {secondary && !trendConfig && (
                <p className='mt-1.5 text-xs text-muted-foreground'>{secondary}</p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
