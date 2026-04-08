import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Package,
  Plus,
  Search,
  UserRound,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { OrderAssignDialog } from './-components/order-assign-dialog'
import { StartPickingDialog } from '@/components/common/start-picking-dialog'
import { OrderDeleteDialog } from './-components/order-delete-dialog'
import { getFieldConfigQuery } from '@/api/field-config/query'
import { ORDER_QUERY_KEYS, getOrderDetailQuery, getOrdersQuery } from '@/api/order/query'
import type { Order, OrderParams } from '@/api/order/schema'
import { orderService } from '@/api/order/service'
import { EntityAttachmentsDialog } from '@/components/common/entity-attachments/entity-attachments-dialog'
import { EntityNotesSheet } from '@/components/common/entity-notes/entity-notes-sheet'
import { Pagination } from '@/components/common/filters/pagination'
import { PresetPicker } from '@/components/common/filters/preset-picker'
import { PageEmpty } from '@/components/common/page-empty'
import {
  FilterChip,
  FilterPopover,
  IOrders,
  PAGE_COLORS,
  PageHeaderIcon
} from '@/components/ds'
import { CommandBarCreate } from '@/components/tasks/command-bar-create'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import type { OrderStatus } from '@/constants/order'
import {
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
} from '@/constants/order'
import { isAdmin } from '@/constants/user'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { useProjectId } from '@/hooks/use-project-id'
import {
  useAutoidParam,
  useLimitParam,
  useOffsetParam,
  useOrderProjectIdParam,
  usePresetParam,
  useSearchParam
} from '@/hooks/use-query-params'
import { cn } from '@/lib/utils'
import { useAuth } from '@/providers/auth'
import { STATUS_DOT_COLORS, FILTER_STATUSES } from './-components/orders-constants'
import type { OrderSortField, SortDir } from './-components/orders-constants'
import { OrderSortableHeader } from './-components/orders-header'
import { OrderRow, PendingOrderRow } from './-components/orders-row'

// ── Page Component ───────────────────────────────────────────

const OrdersPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const isTablet = bp === 'tablet'
  const [search, setSearch] = useSearchParam()
  const [offset, setOffset] = useOffsetParam()
  const [limit] = useLimitParam()
  const [projectIdFromStorage] = useProjectId()
  const [autoidFromUrl, setAutoidFromUrl] = useAutoidParam()
  const [projectIdFromUrl] = useOrderProjectIdParam()
  const projectId = projectIdFromUrl ?? projectIdFromStorage

  const canAssign = !!user?.role && isAdmin(user.role)

  const [sortField, setSortField] = useState<OrderSortField | null>('invoice')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const [activeStatus, setActiveStatus] = useState<OrderStatus | null>(ORDER_STATUS.unprocessed)
  const [assignedToMe, setAssignedToMe] = useState(false)
  const [activePresetId, setActivePresetId] = usePresetParam()
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [orderForAttachments, setOrderForAttachments] = useState<Order | null>(null)
  const [orderForNotes, setOrderForNotes] = useState<Order | null>(null)
  const [orderToAssign, setOrderToAssign] = useState<Order | null>(null)
  const [orderForTask, setOrderForTask] = useState<Order | null>(null)
  const [orderForPicking, setOrderForPicking] = useState<Order | null>(null)

  const ordering = sortField ? (sortDir === 'desc' ? `-${sortField}` : sortField) : undefined

  const handleSort = (field: OrderSortField) => {
    if (sortField === field) {
      if (sortDir === 'asc') setSortDir('desc')
      else {
        setSortField(null)
        setSortDir('asc')
      }
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const deleteLinkedProposalMutation = useMutation({
    mutationFn: (autoid: string) => orderService.deleteLinkedProposal(autoid),
    meta: {
      successMessage: 'Linked proposal deleted',
      errorMessage: 'Failed to delete linked proposal',
      invalidatesQuery: ORDER_QUERY_KEYS.lists()
    }
  })

  const selectStatus = (s: OrderStatus) => {
    setActiveStatus((prev) => (prev === s ? null : s))
    setActivePresetId(null) // manual filter clears preset
    setOffset(null)
  }

  const toggleAssignedToMe = () => {
    setAssignedToMe((v) => !v)
    setActivePresetId(null) // manual filter clears preset
    setOffset(null)
  }

  const selectPreset = (id: number | null) => {
    setActivePresetId(id)
    // preset overrides manual filters
    if (id != null) {
      setActiveStatus(null)
      setAssignedToMe(false)
    }
    setOffset(null)
  }

  const clearAllFilters = () => {
    setActiveStatus(null)
    setAssignedToMe(false)
    setActivePresetId(null)
    setOffset(null)
  }

  const hasFilters = activeStatus !== null || assignedToMe || activePresetId !== null

  const params: OrderParams = {
    search: search || undefined,
    autoid: autoidFromUrl ?? undefined,
    offset,
    limit,
    status: activeStatus ?? undefined,
    project_id: projectId ?? undefined,
    ordering,
    notes: true,
    assigned_to: assignedToMe ? 'me' : undefined,
    preset_id: activePresetId ?? undefined,
    fields: 'salesman,notes_count',
  }

  const { data, refetch, isLoading } = useQuery({
    ...getOrdersQuery(params),
    placeholderData: keepPreviousData,
  })

  const { data: _fieldConfig } = useQuery(getFieldConfigQuery(projectId))

  const results = data?.results ?? []
  const orderInResults =
    autoidFromUrl != null && autoidFromUrl !== '' && results.some((o) => o.autoid === autoidFromUrl)

  const refetchTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  useEffect(() => {
    if (!autoidFromUrl) return
    if (orderInResults) {
      refetchTimersRef.current.forEach(clearTimeout)
      refetchTimersRef.current = []
      return
    }
    refetchTimersRef.current = [
      setTimeout(() => refetch(), 4000),
    ]
    return () => {
      refetchTimersRef.current.forEach(clearTimeout)
      refetchTimersRef.current = []
    }
  }, [autoidFromUrl, orderInResults, refetch])

  const hasPendingAutoid = autoidFromUrl != null && autoidFromUrl !== '' && !orderInResults

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* Header */}
      <header
        className={cn(
          'border-border flex h-12 shrink-0 items-center gap-2.5 border-b',
          isMobile ? 'px-3.5' : 'px-6'
        )}
      >
        <SidebarTrigger className='-ml-1' />
        <div className='flex items-center gap-1.5'>
          <PageHeaderIcon
            icon={IOrders}
            color={PAGE_COLORS.orders}
          />
          <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>Orders</h1>
        </div>

        <PresetPicker
          entityType='order'
          value={activePresetId}
          onChange={selectPreset}
        />

        <div className='flex-1' />

        <div className='border-border bg-background focus-within:border-ring focus-within:ring-ring/50 hidden h-7 w-full max-w-[260px] items-center gap-1.5 rounded-[5px] border px-2 transition-[border-color,box-shadow] focus-within:ring-2 sm:flex'>
          <Search className='text-text-tertiary size-3 shrink-0' />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setOffset(null)
            }}
            placeholder='Search by invoice number...'
            className='placeholder:text-text-tertiary flex-1 bg-transparent text-[13px] outline-none'
          />
        </div>

        <div className='flex items-center gap-1.5'>
          <FilterPopover
            label='Status'
            active={activeStatus !== null}
            icon={
              <div
                className={cn(
                  'size-2.5 rounded-full',
                  activeStatus ? STATUS_DOT_COLORS[activeStatus] : 'bg-current'
                )}
              />
            }
          >
            {FILTER_STATUSES.map((s) => {
              const selected = activeStatus === s.value
              return (
                <button
                  key={s.value}
                  type='button'
                  className={cn(
                    'flex w-full items-center gap-2 whitespace-nowrap rounded-[5px] px-2 py-[3px] text-left text-[13px] font-medium',
                    'hover:bg-bg-hover transition-colors duration-[80ms]'
                  )}
                  onClick={() => selectStatus(s.value)}
                >
                  <div
                    className={cn(
                      'flex size-3.5 shrink-0 items-center justify-center rounded-full border transition-colors duration-[80ms]',
                      selected ? 'border-primary bg-primary' : 'border-border'
                    )}
                  >
                    {selected && <div className='bg-primary-foreground size-1.5 rounded-full' />}
                  </div>
                  <div
                    className={cn(
                      'size-2.5 shrink-0 rounded-full',
                      STATUS_DOT_COLORS[s.value] ?? 'bg-slate-400'
                    )}
                  />
                  <span className='flex-1'>{s.label}</span>
                </button>
              )
            })}
          </FilterPopover>

          <button
            type='button'
            className={cn(
              'inline-flex h-7 items-center gap-1 rounded-[5px] border px-2 text-[13px] font-medium',
              'transition-colors duration-[80ms] hover:bg-bg-hover',
              assignedToMe
                ? 'border-primary/30 bg-primary/5 text-foreground'
                : 'border-border bg-background text-text-secondary'
            )}
            onClick={toggleAssignedToMe}
          >
            <UserRound className='size-3' />
            Assigned to me
          </button>

          <button
            type='button'
            className='bg-primary text-primary-foreground inline-flex h-7 items-center gap-1 rounded-[5px] px-2 text-[13px] font-semibold transition-colors duration-[80ms] hover:opacity-90 sm:px-2.5'
            onClick={() => navigate({ to: '/create' })}
          >
            <Plus className='size-3.5' />
            <span className='hidden sm:inline'>Create Order</span>
          </button>
        </div>
      </header>

      {/* Active filter chips */}
      {(hasFilters || autoidFromUrl) && (
        <div
          className={cn(
            'border-border flex shrink-0 flex-wrap items-center gap-1.5 border-b py-1.5',
            isMobile ? 'px-3.5' : 'px-6'
          )}
        >
          {hasFilters && (
            <button
              type='button'
              className='text-text-tertiary hover:text-foreground text-[13px] font-medium transition-colors duration-[80ms]'
              onClick={clearAllFilters}
            >
              Clear
            </button>
          )}
          {activeStatus && (
            <FilterChip onRemove={() => setActiveStatus(null)}>
              <span className='text-text-tertiary'>Status is</span>
              <div
                className={cn(
                  'size-2 rounded-full',
                  STATUS_DOT_COLORS[activeStatus] ?? 'bg-slate-400'
                )}
              />
              {ORDER_STATUS_LABELS[activeStatus]}
            </FilterChip>
          )}
          {assignedToMe && (
            <FilterChip onRemove={() => setAssignedToMe(false)}>
              <UserRound className='size-3 text-text-tertiary' />
              Assigned to me
            </FilterChip>
          )}
          {autoidFromUrl && (
            <FilterChip onRemove={() => setAutoidFromUrl(null)}>
              <span className='text-text-tertiary'>Order:</span>
              {autoidFromUrl}
            </FilterChip>
          )}
        </div>
      )}

      {/* Order list */}
      <div className='flex-1 overflow-y-auto'>
        {/* Column labels */}
        {!isMobile && (results.length > 0 || isLoading) && (
          <div
            className={cn(
              'border-border bg-bg-secondary text-text-tertiary sticky top-0 z-10 flex items-center border-b text-[13px] font-medium select-none',
              isTablet ? 'gap-4 px-5 py-1' : 'gap-6 px-6 py-1'
            )}
          >
            <OrderSortableHeader
              field='invoice'
              label='Invoice / Customer'
              sortField={sortField}
              sortDir={sortDir}
              onSort={handleSort}
              className='min-w-0 flex-1'
            />
            <div className='w-[88px] shrink-0'>Status</div>
            {!isTablet && (
              <OrderSortableHeader
                field='inv_date'
                label='Date'
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                className='w-[100px] shrink-0 justify-end text-right'
              />
            )}
            <OrderSortableHeader
              field='total'
              label='Total'
              sortField={sortField}
              sortDir={sortDir}
              onSort={handleSort}
              className='w-[100px] shrink-0 justify-end text-right'
            />
            {!isTablet && (
              <OrderSortableHeader
                field='balance'
                label='Balance'
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                className='w-[100px] shrink-0 justify-end text-right'
              />
            )}
            <div className='w-27.5 shrink-0 text-center'>Picked</div>
            {!isTablet && <div className='w-[90px] shrink-0'>Salesman</div>}
            <div className='w-[120px] shrink-0'>Responsible</div>
            <div className='w-[46px] shrink-0' />
            <div className='w-[28px] shrink-0' />
          </div>
        )}

        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) =>
            isMobile ? (
              <div
                key={i}
                className='border-border-light border-b px-3.5 py-2'
              >
                <div className='mb-1 flex items-center gap-2'>
                  <Skeleton className='size-1.5 shrink-0 rounded-full' />
                  <Skeleton className='h-3.5 w-24 rounded' />
                  <div className='flex-1' />
                  <Skeleton className='h-3.5 w-16 rounded' />
                </div>
                <div className='flex items-center gap-2 pl-5'>
                  <Skeleton className='h-3.5 w-20 rounded' />
                  <Skeleton className='h-3.5 w-16 rounded' />
                </div>
              </div>
            ) : (
              <div
                key={i}
                className={cn(
                  'border-border-light flex items-center border-b',
                  isTablet ? 'gap-4 px-5 py-1.5' : 'gap-6 px-6 py-1.5'
                )}
              >
                <div className='flex min-w-0 flex-1 items-center gap-2'>
                  <Skeleton className='h-3.5 w-16 rounded' />
                  <Skeleton className='h-3.5 w-24 rounded' />
                </div>
                <div className='w-[88px] shrink-0'>
                  <Skeleton className='h-[18px] w-[60px] rounded-[4px]' />
                </div>
                {!isTablet && (
                  <div className='w-[100px] shrink-0'>
                    <Skeleton className='ml-auto h-3.5 w-[70px] rounded' />
                  </div>
                )}
                <div className='w-[100px] shrink-0'>
                  <Skeleton className='ml-auto h-3.5 w-[60px] rounded' />
                </div>
                {!isTablet && (
                  <div className='w-[100px] shrink-0'>
                    <Skeleton className='ml-auto h-3.5 w-[60px] rounded' />
                  </div>
                )}
                <div className='w-27.5 shrink-0'>
                  <Skeleton className='mx-auto h-3.5 w-15 rounded' />
                </div>
                {!isTablet && (
                  <div className='w-[90px] shrink-0'>
                    <Skeleton className='h-3.5 w-[50px] rounded' />
                  </div>
                )}
                <div className='w-[120px] shrink-0'>
                  <Skeleton className='h-3.5 w-[70px] rounded' />
                </div>
                <div className='w-[46px] shrink-0' />
                <div className='w-[28px] shrink-0' />
              </div>
            )
          )
        ) : results.length === 0 && !hasPendingAutoid ? (
          <PageEmpty
            icon={Package}
            title='No matching orders'
            description='Try adjusting your search or filters.'
          />
        ) : (
          <>
            {hasPendingAutoid && (
              <PendingOrderRow
                autoid={autoidFromUrl}
                isMobile={isMobile}
              />
            )}
            {results.map((order) => (
              <OrderRow
                key={order.autoid}
                order={order}
                isMobile={isMobile}
                isTablet={isTablet}
                canAssign={canAssign}
                onDelete={setOrderToDelete}
                onDeleteLinkedProposal={(o) => deleteLinkedProposalMutation.mutate(o.autoid)}
                onAttachments={setOrderForAttachments}
                onNotes={setOrderForNotes}
                onAssign={setOrderToAssign}
                onCreateTask={setOrderForTask}
                onPick={setOrderForPicking}
                onMouseEnter={() =>
                  queryClient.prefetchQuery(getOrderDetailQuery(order.autoid, projectId))
                }
                onClick={() =>
                  navigate({
                    to: '/orders/$orderId',
                    params: { orderId: order.autoid }
                  })
                }
              />
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div className={cn('border-border shrink-0 border-t py-2', isMobile ? 'px-3.5' : 'px-6')}>
        <Pagination totalCount={data?.count ?? 0} />
      </div>

      {/* Dialogs */}
      <OrderDeleteDialog
        order={orderToDelete}
        projectId={projectId}
        open={!!orderToDelete}
        onOpenChange={(open) => !open && setOrderToDelete(null)}
      />
      <EntityAttachmentsDialog
        entityType='order'
        entityLabel={
          orderForAttachments
            ? `Order ${orderForAttachments.invoice ?? orderForAttachments.autoid}`
            : ''
        }
        autoid={orderForAttachments?.autoid ?? ''}
        projectId={projectId}
        open={!!orderForAttachments}
        onOpenChange={(open) => !open && setOrderForAttachments(null)}
      />
      <OrderAssignDialog
        order={orderToAssign}
        open={!!orderToAssign}
        onOpenChange={(open) => !open && setOrderToAssign(null)}
        projectId={projectId}
      />
      <EntityNotesSheet
        open={!!orderForNotes}
        onOpenChange={(open) => !open && setOrderForNotes(null)}
        entityType='order'
        entityLabel={orderForNotes ? `Order ${orderForNotes.invoice ?? orderForNotes.autoid}` : ''}
        autoid={orderForNotes?.autoid ?? ''}
        projectId={projectId}
      />
      {orderForTask && (
        <CommandBarCreate
          onClose={() => setOrderForTask(null)}
          defaultLinkedOrderAutoid={orderForTask.autoid}
        />
      )}
      <StartPickingDialog
        open={!!orderForPicking}
        onOpenChange={(open) => !open && setOrderForPicking(null)}
        customerId={String(orderForPicking?.c_id ?? orderForPicking?.id ?? '')}
        customerName={orderForPicking?.name ?? ''}
        orderAutoid={orderForPicking?.autoid}
      />
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/orders/')({
  component: OrdersPage,
  head: () => ({
    meta: [{ title: 'Orders' }]
  })
})
