import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { LayoutDashboard, Loader2, ShoppingCart } from 'lucide-react'

import { DashboardKpis } from './-components/dashboard-kpis'
import { DashboardOrdersChart } from './-components/dashboard-orders-chart'
// TEMPORARY: financial chart hidden
// import { DashboardSalesChart } from './-components/dashboard-sales-chart'
import { CustomerCombobox } from './create/-components/customer-combobox'
import { getCustomerDetailQuery } from '@/api/customer/query'
import type { Customer } from '@/api/customer/schema'
import { getDashboardQuery } from '@/api/dashboard/query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { isSuperAdmin } from '@/constants/user'
import { getErrorMessage } from '@/helpers/error'
import { useProjectId } from '@/hooks/use-project-id'
import { useDashboardCustomerIdParam } from '@/hooks/use-query-params'
import { cn } from '@/lib/utils'
import { useAuth } from '@/providers/auth'

export const Route = createFileRoute('/_authenticated/')({
  component: DashboardPage,
  head: () => ({
    meta: [{ title: 'Dashboard' }]
  })
})

function DashboardPage() {
  const { user } = useAuth()
  const [projectId] = useProjectId()
  const [customerId, setCustomerId] = useDashboardCustomerIdParam()
  const userIsSuperAdmin = !!user?.role && isSuperAdmin(user.role)
  const params = {
    project_id: projectId ?? undefined,
    customer_id: customerId || undefined
  }
  const queryEnabled = !(userIsSuperAdmin && projectId == null)

  const { data, isLoading, error } = useQuery({
    ...getDashboardQuery(params),
    enabled: queryEnabled
  })

  const { data: selectedCustomer } = useQuery({
    ...getCustomerDetailQuery(customerId, projectId),
    enabled: !!customerId && queryEnabled
  })

  const customerFilterValue: Customer | null =
    selectedCustomer ?? (customerId ? { id: customerId, l_name: '' } : null)

  if (userIsSuperAdmin && projectId == null) {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-6 px-4'>
        <div className='border-border bg-card/50 flex flex-col items-center gap-4 rounded-2xl border px-8 py-10 text-center shadow-sm'>
          <div className='bg-primary/10 ring-primary/20 flex size-14 items-center justify-center rounded-2xl ring-2'>
            <LayoutDashboard className='text-primary size-7' />
          </div>
          <div className='space-y-1'>
            <h1 className='text-foreground text-xl font-semibold tracking-tight'>Dashboard</h1>
            <p className='text-muted-foreground max-w-sm text-sm'>
              Select a project in the sidebar to view sales metrics and KPIs.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-6 px-4'>
        <Card className='border-destructive/30 bg-card max-w-md'>
          <CardHeader>
            <CardTitle className='text-destructive'>Unable to load dashboard</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2'>
            <p className='text-muted-foreground text-sm'>{getErrorMessage(error)}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className='flex min-h-0 flex-1 flex-col gap-5'>
        <header className='flex shrink-0 items-start justify-between'>
          <div className='space-y-1'>
            <div className='flex items-center gap-3'>
              <div className='bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg'>
                <LayoutDashboard className='size-5' />
              </div>
              <div>
                <h1 className='text-2xl font-semibold tracking-tight'>Dashboard</h1>
                <p className='text-muted-foreground text-sm'>Loading sales metrics…</p>
              </div>
            </div>
          </div>
          <div className='w-full min-w-0 sm:max-w-md sm:min-w-[20rem]'>
            <CustomerCombobox
              value={customerFilterValue}
              onChange={(customer) => setCustomerId(customer?.id ?? null)}
              projectId={projectId}
              placeholder='All customers'
              showAllOption
            />
          </div>
        </header>
        <div className='min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-1 pt-4 pr-4 pb-6'>
          <div className='flex flex-col gap-5'>
            <div className='grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {Array.from({ length: 3 }).map((_, i) => (
                <Card
                  key={`skeleton-${i}`}
                  className='min-w-0 overflow-hidden'
                >
                  <CardHeader className='flex flex-row items-start justify-between gap-3 pb-2'>
                    <div className='space-y-1'>
                      <div className='flex items-center gap-2'>
                        <Skeleton className='size-8 shrink-0 rounded-lg' />
                        <Skeleton className='h-4 w-24' />
                      </div>
                      <Skeleton className='h-3 w-20' />
                    </div>
                  </CardHeader>
                  <CardContent className='pt-0'>
                    <Skeleton className='h-8 w-28' />
                    <Skeleton className='mt-1.5 h-3 w-32' />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className='grid min-w-0 grid-cols-1 gap-5'>
              <Card className='min-w-0 shrink-0 overflow-hidden'>
                <CardHeader className='border-border/50 bg-muted/20 flex flex-row items-center gap-3 border-b pb-4'>
                  <Skeleton className='size-9 shrink-0 rounded-lg' />
                  <Skeleton className='h-5 w-48' />
                </CardHeader>
                <CardContent className='pt-4'>
                  <div className='border-border bg-muted/20 flex h-[280px] items-center justify-center rounded-lg border border-dashed'>
                    <Loader2 className='text-muted-foreground size-8 animate-spin' />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='flex min-h-0 flex-1 flex-col gap-5'>
      <header className='flex shrink-0 items-start justify-between'>
        <div className='space-y-1'>
          <div className='flex items-center gap-3'>
            <div className='bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg'>
              <LayoutDashboard className='size-5' />
            </div>
            <div>
              <h1 className='text-2xl font-semibold tracking-tight'>Dashboard</h1>
              <p className='text-muted-foreground text-sm'>Sales KPIs and order metrics</p>
            </div>
          </div>
        </div>
        <div className='w-full min-w-0 sm:max-w-md sm:min-w-[20rem]'>
          <CustomerCombobox
            value={customerFilterValue}
            onChange={(customer) => setCustomerId(customer?.id ?? null)}
            projectId={projectId}
            placeholder='All customers'
            showAllOption
          />
        </div>
      </header>
      <div className='min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-1 pt-4 pr-4 pb-6'>
        <div className='flex flex-col gap-5'>
          <DashboardKpis metrics={data} />
          <div className='grid min-w-0 grid-cols-1 gap-5'>
            <Card
              aria-label='Orders this month vs last month'
              className={cn(
                'border-border/80 min-w-0 shrink-0 overflow-hidden shadow-sm',
                'dark:bg-card/50 dark:ring-border/50 dark:ring-1'
              )}
            >
              <CardHeader className='border-border/50 bg-muted/20 flex flex-row items-center gap-3 border-b pb-4'>
                <div className='bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg'>
                  <ShoppingCart className='size-4' />
                </div>
                <CardTitle className='text-base'>Orders — this month vs last month</CardTitle>
              </CardHeader>
              <CardContent className='pt-4'>
                <DashboardOrdersChart metrics={data} />
              </CardContent>
            </Card>
            {/* TEMPORARY: financial chart hidden */}
            {/* <Card
              aria-label='Sales this month vs last month'
              className={cn(
                'border-border/80 min-w-0 shrink-0 overflow-hidden shadow-sm',
                'dark:bg-card/50 dark:ring-border/50 dark:ring-1'
              )}
            >
              <CardHeader className='border-border/50 bg-muted/20 flex flex-row items-center gap-3 border-b pb-4'>
                <div className='bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg'>
                  <DollarSign className='size-4' />
                </div>
                <CardTitle className='text-base'>Sales — this month vs last month</CardTitle>
              </CardHeader>
              <CardContent className='pt-4'>
                <DashboardSalesChart metrics={data} />
              </CardContent>
            </Card> */}
          </div>
        </div>
      </div>
    </div>
  )
}
