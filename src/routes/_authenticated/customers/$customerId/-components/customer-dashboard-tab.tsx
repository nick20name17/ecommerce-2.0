import { useQuery } from '@tanstack/react-query'
import { DollarSign, ShoppingCart } from 'lucide-react'

import { DashboardKpis } from '@/routes/_authenticated/-components/dashboard-kpis'
import { DashboardOrdersChart } from '@/routes/_authenticated/-components/dashboard-orders-chart'
import { DashboardSalesChart } from '@/routes/_authenticated/-components/dashboard-sales-chart'
import { getDashboardQuery } from '@/api/dashboard/query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getErrorMessage } from '@/helpers/error'
import { cn } from '@/lib/utils'

function DashboardTabSkeleton() {
  return (
    <div className='flex flex-col gap-5'>
      <div className='grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className='min-w-0 overflow-hidden'>
            <CardHeader className='pb-2'>
              <div className='space-y-1'>
                <div className='flex items-center gap-2'>
                  <Skeleton className='size-8 rounded-lg' />
                  <Skeleton className='h-4 w-24' />
                </div>
                <Skeleton className='h-3 w-20' />
              </div>
            </CardHeader>
            <CardContent className='pt-0'>
              <Skeleton className='h-8 w-16' />
              <Skeleton className='mt-1.5 h-3 w-28' />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className='grid min-w-0 grid-cols-1 gap-5 2xl:grid-cols-2'>
        <Card className='min-w-0 shrink-0 overflow-hidden'>
          <CardHeader className='border-b border-border/50 bg-muted/20 pb-4'>
            <div className='flex items-center gap-3'>
              <Skeleton className='size-9 rounded-lg' />
              <Skeleton className='h-4 w-56' />
            </div>
          </CardHeader>
          <CardContent className='pt-4'>
            <Skeleton className='h-[280px] w-full' />
          </CardContent>
        </Card>
        <Card className='min-w-0 shrink-0 overflow-hidden'>
          <CardHeader className='border-b border-border/50 bg-muted/20 pb-4'>
            <div className='flex items-center gap-3'>
              <Skeleton className='size-9 rounded-lg' />
              <Skeleton className='h-4 w-56' />
            </div>
          </CardHeader>
          <CardContent className='pt-4'>
            <Skeleton className='h-[280px] w-full' />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface CustomerDashboardTabProps {
  customerId: string
  projectId: number | null
}

export function CustomerDashboardTab({ customerId, projectId }: CustomerDashboardTabProps) {
  const params = {
    customer_id: customerId,
    project_id: projectId ?? undefined
  }
  const { data, isLoading, error } = useQuery({
    ...getDashboardQuery(params),
    enabled: !!customerId
  })

  if (error) {
    return (
      <div className='flex flex-1 items-center justify-center p-4'>
        <Card className='max-w-md border-destructive/30 bg-card'>
          <CardHeader>
            <CardTitle className='text-destructive'>Unable to load dashboard</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2'>
            <p className='text-sm text-muted-foreground'>{getErrorMessage(error)}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading || !data) {
    return <DashboardTabSkeleton />
  }

  return (
    <div className='flex min-w-0 flex-col gap-5'>
      <DashboardKpis metrics={data} />
      <div className='grid min-w-0 grid-cols-1 gap-5 2xl:grid-cols-2'>
        <Card
          aria-label='Orders this month vs last month'
          className={cn(
            'min-w-0 shrink-0 overflow-hidden border-border/80 shadow-sm',
            'dark:bg-card/50 dark:ring-1 dark:ring-border/50'
          )}
        >
          <CardHeader className='flex flex-row items-center gap-3 border-b border-border/50 bg-muted/20 pb-4'>
            <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
              <ShoppingCart className='size-4' />
            </div>
            <CardTitle className='text-base'>Orders — this month vs last month</CardTitle>
          </CardHeader>
          <CardContent className='pt-4'>
            <DashboardOrdersChart metrics={data} />
          </CardContent>
        </Card>
        <Card
          aria-label='Sales this month vs last month'
          className={cn(
            'min-w-0 shrink-0 overflow-hidden border-border/80 shadow-sm',
            'dark:bg-card/50 dark:ring-1 dark:ring-border/50'
          )}
        >
          <CardHeader className='flex flex-row items-center gap-3 border-b border-border/50 bg-muted/20 pb-4'>
            <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
              <DollarSign className='size-4' />
            </div>
            <CardTitle className='text-base'>Sales — this month vs last month</CardTitle>
          </CardHeader>
          <CardContent className='pt-4'>
            <DashboardSalesChart metrics={data} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
