import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { DollarSign, LayoutDashboard, Loader2, ShoppingCart } from 'lucide-react'

import { CustomerCombobox } from './create/-components/customer-combobox'
import { DashboardKpis } from './-components/dashboard-kpis'
import { DashboardOrdersChart } from './-components/dashboard-orders-chart'
import { DashboardSalesChart } from './-components/dashboard-sales-chart'
import type { Customer } from '@/api/customer/schema'
import { getCustomerDetailQuery } from '@/api/customer/query'
import { getDashboardQuery } from '@/api/dashboard/query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { isSuperAdmin } from '@/constants/user'
import { getErrorMessage } from '@/helpers/error'
import { useDashboardCustomerIdParam } from '@/hooks/use-query-params'
import { useProjectId } from '@/hooks/use-project-id'
import { useAuth } from '@/providers/auth'
import { cn } from '@/lib/utils'

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
        <div className='flex flex-col items-center gap-4 rounded-2xl border border-border bg-card/50 px-8 py-10 text-center shadow-sm'>
          <div className='flex size-14 items-center justify-center rounded-2xl bg-primary/10 ring-2 ring-primary/20'>
            <LayoutDashboard className='size-7 text-primary' />
          </div>
          <div className='space-y-1'>
            <h1 className='text-xl font-semibold tracking-tight text-foreground'>
              Dashboard
            </h1>
            <p className='max-w-sm text-sm text-muted-foreground'>
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
    return (
      <div className='flex min-h-0 flex-1 flex-col gap-5'>
        <header className='flex shrink-0 items-start justify-between'>
          <div className='space-y-1'>
            <div className='flex items-center gap-3'>
              <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                <LayoutDashboard className='size-5' />
              </div>
              <div>
                <h1 className='text-2xl font-semibold tracking-tight'>Dashboard</h1>
                <p className='text-sm text-muted-foreground'>
                  Loading sales metrics…
                </p>
              </div>
            </div>
          </div>
          <div className='w-full min-w-0 sm:min-w-[20rem] sm:max-w-md'>
            <CustomerCombobox
              value={customerFilterValue}
              onChange={(customer) => setCustomerId(customer?.id ?? null)}
              projectId={projectId}
              placeholder='All customers'
              showAllOption
            />
          </div>
        </header>
        <div className='min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-1 pt-4 pb-6 pr-4'>
          <div className='flex flex-col gap-5'>
            <div className='grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className='min-w-0 overflow-hidden'>
                  <CardHeader className='flex flex-row items-start justify-between gap-3 pb-2'>
                    <div className='space-y-1'>
                      <div className='flex items-center gap-2'>
                        <div className='size-8 shrink-0 animate-pulse rounded-lg bg-muted' />
                        <div className='h-4 w-24 animate-pulse rounded bg-muted' />
                      </div>
                      <div className='h-3 w-20 animate-pulse rounded bg-muted' />
                    </div>
                  </CardHeader>
                  <CardContent className='pt-0'>
                    <div className='h-8 w-28 animate-pulse rounded bg-muted' />
                    <div className='mt-1.5 h-3 w-32 animate-pulse rounded bg-muted' />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className='grid min-w-0 gap-5 lg:grid-cols-2'>
              {[1, 2].map((i) => (
                <Card key={i} className='min-w-0 shrink-0 overflow-hidden'>
                  <CardHeader className='flex flex-row items-center gap-3 border-b border-border/50 bg-muted/20 pb-4'>
                    <div className='size-9 shrink-0 animate-pulse rounded-lg bg-muted' />
                    <div className='h-5 w-48 animate-pulse rounded bg-muted' />
                  </CardHeader>
                  <CardContent className='pt-4'>
                    <div className='flex h-[280px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20'>
                      <Loader2 className='size-8 animate-spin text-muted-foreground' />
                    </div>
                  </CardContent>
                </Card>
              ))}
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
            <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
              <LayoutDashboard className='size-5' />
            </div>
            <div>
              <h1 className='text-2xl font-semibold tracking-tight'>Dashboard</h1>
              <p className='text-sm text-muted-foreground'>
                Sales KPIs and order metrics
              </p>
            </div>
          </div>
        </div>
        <div className='w-full min-w-0 sm:min-w-[20rem] sm:max-w-md'>
          <CustomerCombobox
            value={customerFilterValue}
            onChange={(customer) => setCustomerId(customer?.id ?? null)}
            projectId={projectId}
            placeholder='All customers'
            showAllOption
          />
        </div>
      </header>
      <div className='min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-1 pt-4 pb-6 pr-4'>
        <div className='flex flex-col gap-5'>
          <DashboardKpis metrics={data} />
          <div className='grid min-w-0 gap-5 lg:grid-cols-2'>
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
      </div>
    </div>
  )
}
