import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ChevronLeft, Pencil, StickyNote, Trash2, UserPlus } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { PropertyField } from '@/routes/_authenticated/orders/$orderId/-components/order-properties'
import { CustomerDashboardTab } from './-components/customer-dashboard-tab'
import { CustomerInfoPanel } from './-components/customer-info-card'
import { CustomerOrdersTab } from './-components/customer-orders-tab'
import { CustomerProposalsTab } from './-components/customer-proposals-tab'
import { CustomerTasksTab } from './-components/customer-tasks-tab'
import { EntityNotesSheet } from '@/components/common/entity-notes/entity-notes-sheet'
import { CUSTOMER_QUERY_KEYS, getCustomerDetailQuery } from '@/api/customer/query'
import { customerService } from '@/api/customer/service'
import { getFieldConfigQuery } from '@/api/field-config/query'
import { getPriceLevelsQuery } from '@/api/price-level/query'
import { getColumnLabel } from '@/helpers/dynamic-columns'
import { ICustomers, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { CustomerAssignDialog } from '@/routes/_authenticated/customers/-components/customer-assign-dialog'
import { CustomerDeleteDialog } from '@/routes/_authenticated/customers/-components/customer-delete-dialog'
import { CustomerModal } from '@/routes/_authenticated/customers/-components/customer-modal'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { CUSTOMER_TABS } from '@/constants/customer'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { useProjectId } from '@/hooks/use-project-id'
import { useCustomerTabParam } from '@/hooks/use-query-params'
import { isAdmin } from '@/constants/user'
import { cn } from '@/lib/utils'
import { useAuth } from '@/providers/auth'

// ── Page Component ───────────────────────────────────────────

function CustomerDetailPage() {
  const { customerId } = Route.useParams()
  const router = useRouter()
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const [projectId] = useProjectId()
  const [activeTab, setActiveTab] = useCustomerTabParam()
  const { user } = useAuth()
  const canAssign = !!user?.role && isAdmin(user.role)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [panelTab, setPanelTab] = useState<'general' | 'custom'>('general')

  const queryClient = useQueryClient()

  const { data: customer, isLoading } = useQuery(
    getCustomerDetailQuery(customerId, projectId)
  )
  const { data: fieldConfig } = useQuery(getFieldConfigQuery(projectId))
  const { data: priceLevels } = useQuery(getPriceLevelsQuery(projectId))

  const customFields = useMemo(() => {
    const entries = fieldConfig?.customer ?? []
    return entries.filter((e) => !e.default && e.enabled)
  }, [fieldConfig])

  const priceLevelMutation = useMutation({
    mutationFn: (value: string) => customerService.update(customerId, { in_level: value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.detail(customerId) })
      toast.success('Price level updated')
    },
  })

  const patchMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      customerService.update(customerId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.detail(customerId) })
    },
    meta: { errorMessage: 'Failed to update customer' },
  })

  const handleFieldSave = useCallback(
    (field: string, value: string) => {
      if (!customer) return
      const current = (customer[field] as string | null) ?? ''
      if (value === current) return
      patchMutation.mutate({ [field]: value || null })
    },
    [customer, patchMutation],
  )

  // Loading
  if (isLoading) {
    return (
      <div className='flex h-full flex-col overflow-hidden'>
        <header className={cn('flex h-12 shrink-0 items-center gap-2.5 border-b border-border', isMobile ? 'px-3.5' : 'px-6')}>
          <SidebarTrigger className='-ml-1' />
          <Skeleton className='h-4 w-16' />
          <Skeleton className='size-5 rounded-[5px]' />
          <Skeleton className='h-4 w-28' />
          <Skeleton className='h-5 w-[60px] rounded-full' />
          <div className='flex-1' />
          <Skeleton className='h-7 w-14 rounded-[5px]' />
          <Skeleton className='size-7 rounded-[5px]' />
        </header>
        <div className='flex min-h-0 flex-1'>
          <div className='flex flex-1 flex-col overflow-hidden'>
            <div className={cn('flex gap-1 border-b border-border', isMobile ? 'px-3.5' : 'px-6')}>
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
      <header className={cn('flex h-12 shrink-0 items-center gap-2.5 border-b border-border', isMobile ? 'px-3.5' : 'px-6')}>
        <SidebarTrigger className='-ml-1' />
        <button
          type='button'
          className='inline-flex h-7 items-center gap-0.5 rounded-[6px] border border-border bg-bg-secondary pl-1.5 pr-2.5 text-[13px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground'
          onClick={() => router.history.back()}
        >
          <ChevronLeft className='size-3.5' />
          <span className='hidden sm:inline'>Customers</span>
        </button>

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

        {canAssign && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type='button'
                className={cn(
                  'inline-flex h-7 items-center gap-1.5 rounded-[5px] border px-2.5 text-[12px] font-medium transition-colors duration-[80ms]',
                  customer.assigned_user
                    ? 'border-primary/20 bg-primary/[0.06] text-primary hover:bg-primary/[0.1]'
                    : 'border-border bg-bg-secondary text-text-secondary hover:bg-bg-active hover:text-foreground'
                )}
                onClick={() => setAssignOpen(true)}
              >
                <UserPlus className='size-3.5' />
                <span className='hidden sm:inline'>
                  {customer.assigned_user
                    ? `${customer.assigned_user.first_name} ${customer.assigned_user.last_name}`
                    : 'Assign'}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {customer.assigned_user
                ? `Assigned to ${customer.assigned_user.first_name} ${customer.assigned_user.last_name} — click to change`
                : 'Assign a sales user'}
            </TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type='button'
              className='inline-flex h-7 items-center gap-1.5 rounded-[5px] border border-border bg-bg-secondary px-2.5 text-[12px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground'
              onClick={() => setNotesOpen(true)}
            >
              <StickyNote className='size-3.5' />
              <span className='hidden sm:inline'>Notes</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>Notes</TooltipContent>
        </Tooltip>

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
            {activeTab === 'proposals' && (
              <CustomerProposalsTab customerId={customerId} />
            )}
            {activeTab === 'todos' && (
              <CustomerTasksTab customerId={customerId} customerName={customer?.l_name} />
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
            'flex shrink-0 flex-col overflow-hidden bg-bg-secondary/50',
            isMobile
              ? 'border-t border-border'
              : 'w-[380px] border-l border-border'
          )}
        >
          {/* Panel tabs */}
          <div className='flex shrink-0 items-center gap-0 border-b border-border px-1'>
            {(['general', 'custom'] as const).map((tab) => {
              const label = tab === 'custom'
                ? `Custom${customFields.length > 0 ? ` ${customFields.length}` : ''}`
                : 'General'
              return (
                <button
                  key={tab}
                  type='button'
                  className={cn(
                    'relative px-3 py-2 text-[13px] font-medium transition-colors duration-75',
                    panelTab === tab
                      ? 'text-foreground'
                      : 'text-text-tertiary hover:text-text-secondary',
                  )}
                  onClick={() => setPanelTab(tab)}
                >
                  {label}
                  {panelTab === tab && (
                    <span className='absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-primary' />
                  )}
                </button>
              )
            })}
          </div>

          {/* Panel content */}
          <div className='flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'>
            {panelTab === 'general' ? (
              <CustomerInfoPanel
                customer={customer}
                fieldConfig={fieldConfig}
                priceLevels={priceLevels}
                onPriceLevelChange={(value) => priceLevelMutation.mutate(value)}
                onAssign={() => setAssignOpen(true)}
              />
            ) : (
              <>
                {customFields.length === 0 ? (
                  <div className='flex flex-col items-center justify-center py-12 text-center'>
                    <p className='text-[13px] text-text-tertiary'>No custom fields enabled</p>
                    <p className='mt-1 text-[12px] text-text-quaternary'>
                      Enable fields in Settings &rarr; Data Control
                    </p>
                  </div>
                ) : (
                  <div className='border-b border-border'>
                    <div className='bg-bg-secondary/60 px-4 py-2'>
                      <span className='text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary'>
                        Custom Fields
                      </span>
                    </div>
                    <div className='bg-background text-[13px]'>
                      {customFields.map((entry) => {
                        const label = getColumnLabel(entry.field, 'customer', fieldConfig)
                        const val = customer[entry.field]
                        const strVal = val != null ? String(val) : null
                        return (
                          <PropertyField
                            key={entry.field}
                            label={label}
                            value={strVal}
                            field={entry.field}
                            onSave={handleFieldSave}
                            editable={!!entry.editable}
                          />
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Notes sheet */}
      <EntityNotesSheet
        open={notesOpen}
        onOpenChange={setNotesOpen}
        entityType='customer'
        entityLabel={customer.l_name || `Customer ${customer.id}`}
        autoid={customer.autoid}
        projectId={projectId}
      />

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

      {/* Assign user */}
      <CustomerAssignDialog
        customer={assignOpen ? customer : null}
        open={assignOpen}
        onOpenChange={setAssignOpen}
        projectId={projectId}
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
