import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ChevronLeft, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { CustomerDashboardTab } from './-components/customer-dashboard-tab'
import { CustomerInfoPanel } from './-components/customer-info-card'
import { CustomerOrdersTab } from './-components/customer-orders-tab'
import { CustomerTasksTab } from './-components/customer-tasks-tab'
import { getCustomerDetailQuery } from '@/api/customer/query'
import { ICustomers, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { CustomerDeleteDialog } from '@/routes/_authenticated/customers/-components/customer-delete-dialog'
import { CustomerModal } from '@/routes/_authenticated/customers/-components/customer-modal'
import { Skeleton } from '@/components/ui/skeleton'
import { CUSTOMER_TABS } from '@/constants/customer'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { useProjectId } from '@/hooks/use-project-id'
import { useCustomerTabParam } from '@/hooks/use-query-params'
import { cn } from '@/lib/utils'

// ── Page Component ───────────────────────────────────────────

function CustomerDetailPage() {
  const { customerId } = Route.useParams()
  const router = useRouter()
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const [projectId] = useProjectId()
  const [activeTab, setActiveTab] = useCustomerTabParam()

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const { data: customer, isLoading } = useQuery(
    getCustomerDetailQuery(customerId, projectId)
  )

  // Loading
  if (isLoading) {
    return (
      <div className='flex h-full flex-col overflow-hidden'>
        <header className='flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-6'>
          <Skeleton className='h-4 w-16' />
          <div className='mx-0.5 h-4 w-px bg-border' />
          <Skeleton className='size-5 rounded-[5px]' />
          <Skeleton className='h-4 w-28' />
          <Skeleton className='h-5 w-[60px] rounded-full' />
          <div className='flex-1' />
          <Skeleton className='h-7 w-14 rounded-[5px]' />
          <Skeleton className='size-7 rounded-[5px]' />
        </header>
        <div className='flex min-h-0 flex-1'>
          <div className='flex flex-1 flex-col overflow-hidden'>
            <div className='flex gap-1 border-b border-border px-6'>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className='my-2.5 h-4 w-16' />
              ))}
            </div>
            <div className='flex-1 p-6'>
              <Skeleton className='h-64 w-full' />
            </div>
          </div>
          {!isMobile && (
            <div className='w-[380px] shrink-0 border-l border-border bg-bg-secondary/50'>
              <div className='space-y-3 px-4 py-3'>
                <Skeleton className='h-3 w-16' />
                <div className='grid grid-cols-2 gap-x-4 gap-y-2'>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i}>
                      <Skeleton className='mb-1 h-2.5 w-12' />
                      <Skeleton className='h-3.5 w-full' />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Not found
  if (!customer) {
    return (
      <div className='flex h-full items-center justify-center'>
        <p className='text-text-secondary'>Customer not found.</p>
      </div>
    )
  }

  const isActive = !customer.inactive

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* ── Header bar ── */}
      <header className='flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-6'>
        <button
          type='button'
          className='flex items-center gap-1 text-[13px] font-medium text-text-tertiary transition-colors duration-[80ms] hover:text-foreground'
          onClick={() => router.history.back()}
        >
          <ChevronLeft className='size-4' />
          <span className='hidden sm:inline'>Customers</span>
        </button>

        <div className='mx-0.5 h-4 w-px bg-border' />

        <PageHeaderIcon icon={ICustomers} color={PAGE_COLORS.customers} />
        <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>
          {customer.l_name}
        </h1>

        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[12px] font-semibold leading-none',
            isActive
              ? 'border-green-300 bg-green-500/10 text-green-800 dark:border-green-600 dark:bg-green-500/20 dark:text-green-300'
              : 'border-slate-300 bg-slate-500/10 text-slate-700 dark:border-slate-600 dark:bg-slate-500/20 dark:text-slate-300',
          )}
        >
          <span
            className={cn(
              'size-1.5 rounded-full',
              isActive ? 'bg-green-500' : 'bg-slate-400',
            )}
          />
          {isActive ? 'Active' : 'Inactive'}
        </span>

        <span className='text-[13px] tabular-nums text-text-tertiary'>
          CUS-{customer.id}
        </span>

        <div className='flex-1' />

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type='button'
              className='inline-flex h-7 items-center gap-1.5 rounded-[5px] border border-border bg-bg-secondary px-2.5 text-[12px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground'
              onClick={() => setEditOpen(true)}
            >
              <Pencil className='size-3.5' />
              <span className='hidden sm:inline'>Edit</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>Edit Customer</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type='button'
              className='inline-flex size-7 items-center justify-center rounded-[5px] text-text-tertiary transition-colors duration-[80ms] hover:bg-bg-hover hover:text-destructive'
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className='size-3.5' />
            </button>
          </TooltipTrigger>
          <TooltipContent>Delete Customer</TooltipContent>
        </Tooltip>
      </header>

      {/* Content area: main + right panel */}
      <div className={cn('flex min-h-0 flex-1', isMobile && 'flex-col')}>
        {/* Main content — scrollable */}
        <div className='flex flex-1 flex-col overflow-hidden'>
          {/* Tabs */}
          <div
            className={cn(
              'flex shrink-0 gap-1 border-b border-border',
              isMobile ? 'px-5' : 'px-6'
            )}
          >
            {CUSTOMER_TABS.map((tab) => (
              <button
                key={tab.value}
                type='button'
                className={cn(
                  'relative px-3 py-2.5 text-[13px] font-medium transition-colors duration-[80ms]',
                  activeTab === tab.value
                    ? 'text-foreground'
                    : 'text-text-tertiary hover:text-text-secondary'
                )}
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.label}
                {activeTab === tab.value && (
                  <div className='absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-primary' />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
            {activeTab === 'orders' && (
              <CustomerOrdersTab customerId={customerId} />
            )}
            {activeTab === 'todos' && (
              <CustomerTasksTab customerId={customerId} />
            )}
            {activeTab === 'dashboard' && (
              <div className={cn('flex-1 overflow-y-auto', isMobile ? 'px-5 py-4' : 'px-6 py-5')}>
                <CustomerDashboardTab
                  customerId={customerId}
                  projectId={projectId ?? null}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right panel — properties */}
        <div
          className={cn(
            'shrink-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
            isMobile
              ? 'border-t border-border px-5 py-4'
              : 'w-[380px] border-l border-border bg-bg-secondary/50'
          )}
        >
          <CustomerInfoPanel customer={customer} />
        </div>
      </div>

      {/* Edit modal */}
      <CustomerModal
        key={customer.id}
        open={editOpen}
        onOpenChange={setEditOpen}
        customer={customer}
      />

      {/* Delete confirmation */}
      <CustomerDeleteDialog
        customer={deleteOpen ? customer : null}
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open)
          if (!open) router.history.back()
        }}
      />
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/customers/$customerId/')({
  component: CustomerDetailPage,
  head: () => ({
    meta: [{ title: 'Customer' }],
  }),
})
