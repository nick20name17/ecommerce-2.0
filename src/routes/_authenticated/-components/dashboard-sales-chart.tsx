import type { DashboardMetrics } from '@/api/dashboard/schema'
import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart'
import { formatCurrency } from '@/helpers/formatters'
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from 'recharts'

const chartConfig = {
  thisMonth: {
    label: 'This month',
    color: 'var(--chart-1)'
  },
  lastMonth: {
    label: 'Last month',
    color: 'var(--chart-2)'
  }
} satisfies ChartConfig

interface DashboardSalesChartProps {
  metrics: DashboardMetrics
}

function getFinancial(metrics: DashboardMetrics) {
  return metrics.sales_total_field === 'total'
    ? metrics.total
    : metrics.sub_total
}

export function DashboardSalesChart({ metrics }: DashboardSalesChartProps) {
  const fin = getFinancial(metrics)

  const data = [
    {
      name: 'Sales',
      thisMonth: Math.round(fin.total_sales),
      lastMonth: Math.round(fin.last_month_total_sales)
    }
  ]

  return (
    <ChartContainer config={chartConfig} className='h-[280px] w-full'>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray='3 3' vertical={false} className='stroke-border/50' />
        <XAxis
          dataKey='name'
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => (
                <span className='font-mono font-medium tabular-nums'>
                  {formatCurrency(Number(value), '$0', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}
                </span>
              )}
            />
          }
        />
        <Legend content={<ChartLegendContent />} />
        <Bar
          dataKey='thisMonth'
          fill='var(--color-thisMonth)'
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey='lastMonth'
          fill='var(--color-lastMonth)'
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  )
}
