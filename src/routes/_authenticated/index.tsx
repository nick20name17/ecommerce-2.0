import { useQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { LayoutDashboard, TriangleAlert } from 'lucide-react'

import { DashboardKpis } from './-components/dashboard-kpis'
import { IDashboard, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import { DashboardOrdersChart, OrdersChangeBadge } from './-components/dashboard-orders-chart'
import { DashboardRecentOrders } from './-components/dashboard-recent-orders'
import { CustomerCombobox } from './create/-components/customer-combobox'
import { getCustomerDetailQuery } from '@/api/customer/query'
import type { Customer } from '@/api/customer/schema'
import { getDashboardQuery } from '@/api/dashboard/query'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { isAdmin, isSuperAdmin } from '@/constants/user'
import { getErrorMessage } from '@/helpers/error'
import { getSession } from '@/helpers/auth'
import { useProjectId } from '@/hooks/use-project-id'
import { useDashboardCustomerIdParam } from '@/hooks/use-query-params'
import { useAuth } from '@/providers/auth'

// ── Page ──

const DashboardPage = () => {
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
    selectedCustomer ?? (customerId ? { id: customerId, autoid: '', l_name: '' } : null)

  const handleCustomerChange = (c: Customer | null) => setCustomerId(c?.id ?? null)

  // ── Super admin: no project selected ──
  if (userIsSuperAdmin && projectId == null) {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-5 px-4'>
        <div className='flex size-12 items-center justify-center rounded-[12px] bg-primary/[0.08] text-primary dark:bg-primary/15'>
          <LayoutDashboard className='size-6' strokeWidth={1.75} />
        </div>
        <div className='flex flex-col items-center gap-1.5 text-center'>
          <h1 className='text-[16px] font-semibold tracking-[-0.02em] text-foreground'>Dashboard</h1>
          <p className='max-w-[280px] text-[13px] leading-snug text-text-tertiary'>
            Select a project in the sidebar to view metrics.
          </p>
        </div>
      </div>
    )
  }

  // ── Error state ──
  if (error) {
    return (
      <div className='flex h-full flex-col overflow-hidden'>
        <DashboardHeader
          customerFilterValue={customerFilterValue}
          onCustomerChange={handleCustomerChange}
          projectId={projectId}
        />
        <div className='flex flex-1 items-center justify-center px-4'>
          <div className='flex flex-col items-center gap-5'>
            <div className='flex size-12 items-center justify-center rounded-[12px] bg-destructive/10 text-destructive'>
              <TriangleAlert className='size-6' strokeWidth={1.75} />
            </div>
            <div className='flex flex-col items-center gap-1.5 text-center'>
              <p className='text-[14px] font-semibold text-foreground'>Unable to load dashboard</p>
              <p className='max-w-[280px] text-[13px] leading-snug text-text-tertiary'>{getErrorMessage(error)}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Loading state ──
  if (isLoading || !data) {
    return (
      <div className='flex h-full flex-col overflow-hidden'>
        <DashboardHeader
          customerFilterValue={customerFilterValue}
          onCustomerChange={handleCustomerChange}
          projectId={projectId}
        />
        <div className='flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5'>
          <div className='flex flex-col gap-5'>
            {/* KPI skeletons */}
            <div className='grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6'>
              {['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5', 'sk-6'].map((id) => (
                <div key={id} className='rounded-[8px] border border-border bg-background px-3 py-3 sm:px-4 sm:py-4'>
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
            {/* Table skeleton */}
            <div className='rounded-[8px] border border-border bg-background'>
              <div className='px-4 py-3'>
                <Skeleton className='h-4 w-28' />
              </div>
              <div className='divide-y divide-border'>
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className='flex items-center gap-3 px-4 py-2.5'>
                    <Skeleton className='size-3.5 rounded-full' />
                    <Skeleton className='h-3 w-16' />
                    <Skeleton className='h-3 w-32' />
                    <div className='flex-1' />
                    <Skeleton className='h-3 w-16' />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Loaded state ──
  return (
    <div className='flex h-full flex-col overflow-hidden'>
      <DashboardHeader
        customerFilterValue={customerFilterValue}
        onCustomerChange={handleCustomerChange}
        projectId={projectId}
      />
      <div className='flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5'>
        <div className='flex flex-col gap-5'>
          <DashboardKpis metrics={data} />

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

          {/* Recent orders */}
          <DashboardRecentOrders
            projectId={projectId}
            customerId={customerId || undefined}
          />
        </div>
      </div>
    </div>
  )
}

// ── Header ──

function DashboardHeader({
  customerFilterValue,
  onCustomerChange,
  projectId,
}: {
  customerFilterValue: Customer | null
  onCustomerChange: (customer: Customer | null) => void
  projectId: number | null
}) {
  return (
    <header className='flex h-12 shrink-0 items-center gap-3 border-b border-border px-4 sm:px-6'>
      <SidebarTrigger className='-ml-1' />
      <div className='flex items-center gap-1.5'>
        <PageHeaderIcon icon={IDashboard} color={PAGE_COLORS.dashboard} />
        <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>Dashboard</h1>
      </div>
      <div className='w-40 min-w-0 sm:w-[280px]'>
        <CustomerCombobox
          value={customerFilterValue}
          onChange={onCustomerChange}
          projectId={projectId}
          placeholder='All customers'
          showAllOption
        />
      </div>
    </header>
  )
}

export const Route = createFileRoute('/_authenticated/')({
  component: DashboardPage,
  beforeLoad: () => {
    const session = getSession()
    if (session?.user?.role && !isAdmin(session.user.role)) {
      throw redirect({ to: '/orders', replace: true })
    }
  },
  head: () => ({
    meta: [{ title: 'Dashboard' }]
  })
})
