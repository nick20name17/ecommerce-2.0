import type { DashboardMetrics } from '@/api/dashboard/schema'
import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart'
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

interface DashboardOrdersChartProps {
  metrics: DashboardMetrics
}

export function DashboardOrdersChart({ metrics }: DashboardOrdersChartProps) {
  const data = [
    {
      name: 'Orders',
      thisMonth: metrics.total_order_count,
      lastMonth: metrics.last_month_order_count
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
        <ChartTooltip content={<ChartTooltipContent />} />
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
