import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowDown,
  ArrowUp,
  Check,
  ClipboardList,
  Link2Off,
  ListTodo,
  Loader2,
  MoreHorizontal,
  Package,
  PackageCheck,
  Paperclip,
  Plus,
  Search,
  StickyNote,
  Trash2,
  UserPlus,
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
  InitialsAvatar,
  PAGE_COLORS,
  PageHeaderIcon
} from '@/components/ds'
import { CommandBarCreate } from '@/components/tasks/command-bar-create'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { OrderStatus } from '@/constants/order'
import {
  ORDER_STATUS,
  ORDER_STATUS_CLASS,
  ORDER_STATUS_LABELS,
  getOrderStatusLabel
} from '@/constants/order'
import { isAdmin } from '@/constants/user'
import { formatCurrency, formatDate, getInitials, getUserDisplayName } from '@/helpers/formatters'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { useProjectId } from '@/hooks/use-project-id'
import {
  useAutoidParam,
  useLimitParam,
  useOffsetParam,
  useOrderProjectIdParam,
  useSearchParam
} from '@/hooks/use-query-params'
import { cn } from '@/lib/utils'
import { useAuth } from '@/providers/auth'

// ── Helpers ──────────────────────────────────────────────────

// ── Constants ────────────────────────────────────────────────

const STATUS_DOT_COLORS: Record<string, string> = {
  U: 'bg-amber-500',
  O: 'bg-blue-500',
  X: 'bg-emerald-500'
}

type OrderSortField = 'invoice' | 'name' | 'inv_date' | 'total' | 'balance'
type SortDir = 'asc' | 'desc'

const FILTER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: ORDER_STATUS.unprocessed, label: 'Unprocessed' },
  { value: ORDER_STATUS.outstandingInvoice, label: 'Outstanding' },
  { value: ORDER_STATUS.paidInvoice, label: 'Paid Invoice' }
]

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
  const [activePresetId, setActivePresetId] = useState<number | null>(null)
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

// ── Pending Order Row ────────────────────────────────────────

function PendingOrderRow({ autoid, isMobile }: { autoid: string; isMobile: boolean }) {
  return (
    <div
      className={cn(
        'border-border-light flex items-center gap-3 border-b py-2 opacity-60',
        isMobile ? 'px-3.5' : 'px-6'
      )}
    >
      <Loader2 className='text-text-tertiary size-3.5 animate-spin' />
      <span className='text-text-tertiary text-[13px]'>Creating order {autoid}…</span>
    </div>
  )
}

// ── Order Row ────────────────────────────────────────────────

function OrderRow({
  order,
  isMobile,
  isTablet,
  canAssign,
  onDelete,
  onDeleteLinkedProposal,
  onAttachments,
  onNotes,
  onAssign,
  onCreateTask,
  onPick,
  onMouseEnter,
  onClick
}: {
  order: Order
  isMobile: boolean
  isTablet: boolean
  canAssign: boolean
  onDelete: (order: Order) => void
  onDeleteLinkedProposal: (order: Order) => void
  onAttachments: (order: Order) => void
  onNotes: (order: Order) => void
  onAssign: (order: Order) => void
  onCreateTask: (order: Order) => void
  onPick: (order: Order) => void
  onMouseEnter?: () => void
  onClick: () => void
}) {
  const invoice = order.invoice?.trim() || `#${order.id}`
  const statusLabel = getOrderStatusLabel(order.status)
  const statusClass = ORDER_STATUS_CLASS[order.status] ?? ''
  const dotColor = STATUS_DOT_COLORS[order.status] ?? 'bg-slate-400'

  const noteCount = typeof order.notes_count === 'number' ? order.notes_count : Array.isArray(order.notes) ? order.notes.length : 0

  if (isMobile) {
    return (
      <div
        className='border-border-light hover:bg-bg-hover cursor-pointer border-b px-3.5 py-2 transition-colors duration-100'
        onClick={onClick}
        onMouseEnter={onMouseEnter}
      >
        <div className='mb-1 flex items-center gap-2'>
          <div className={cn('size-1.5 shrink-0 rounded-full', dotColor)} />
          <span className='text-foreground min-w-0 flex-1 truncate text-[13px] font-medium'>
            {invoice}
          </span>
          <PickBadge pickStatus={order.pick_status} />
          <PackedBadge packedStatus={order.packed_status} />
          <span className='text-foreground shrink-0 text-[13px] font-medium tabular-nums'>
            {formatCurrency(order.total, '—')}
          </span>
        </div>
        <div className='flex flex-wrap items-center gap-2 pl-5'>
          <span className='text-text-tertiary text-[13px]'>{order.name || '—'}</span>
          <span className='text-text-tertiary text-[13px]'>{statusLabel}</span>
          {order.inv_date && (
            <span className='text-text-tertiary text-[13px] tabular-nums'>
              {formatDate(order.inv_date)}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group/row border-border-light text-foreground hover:bg-bg-hover flex cursor-pointer items-center border-b transition-colors duration-100',
        isTablet ? 'gap-4 px-5 py-1.5' : 'gap-6 px-6 py-1.5'
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      {/* Invoice + customer */}
      <div className='flex min-w-0 flex-1 items-center gap-2'>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className='shrink-0 truncate text-[13px] font-medium'
              style={{ maxWidth: '40%' }}
            >
              {invoice}
            </span>
          </TooltipTrigger>
          <TooltipContent side='top'>{invoice}</TooltipContent>
        </Tooltip>
        <span className='text-text-tertiary min-w-0 truncate text-[13px]'>{order.name || '—'}</span>
      </div>

      {/* Status */}
      <div className='w-[88px] shrink-0'>
        <span
          className={cn(
            'inline-flex items-center rounded-[4px] border px-1.5 py-0.5 text-[11px] leading-none font-semibold',
            statusClass
          )}
        >
          {statusLabel}
        </span>
      </div>

      {/* Date */}
      {!isTablet && (
        <div className='text-text-secondary w-[100px] shrink-0 text-right text-[13px] tabular-nums'>
          {order.inv_date ? (
            formatDate(order.inv_date)
          ) : (
            <span className='text-text-tertiary'>&mdash;</span>
          )}
        </div>
      )}

      {/* Total */}
      <div className='text-foreground w-[100px] shrink-0 text-right text-[13px] font-medium tabular-nums'>
        {formatCurrency(order.total, '—')}
      </div>

      {/* Balance */}
      {!isTablet && (
        <div
          className={cn(
            'w-[100px] shrink-0 text-right text-[13px] font-medium tabular-nums',
            Number(order.balance) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-text-tertiary'
          )}
        >
          {formatCurrency(order.balance, '—')}
        </div>
      )}

      {/* Pick / Packed status */}
      <div className='flex w-27.5 shrink-0 items-center justify-center gap-1'>
        <PickBadge pickStatus={order.pick_status} />
        <PackedBadge packedStatus={order.packed_status} />
      </div>

      {/* Salesman */}
      {!isTablet && (
        <div className='w-[90px] shrink-0 truncate text-[13px] text-text-secondary'>
          {order.salesman || <span className='text-text-tertiary'>&mdash;</span>}
        </div>
      )}

      {/* Responsible */}
      <div className='w-[120px] shrink-0'>
        {(() => {
          const assigned = order.assigned_users?.length ? order.assigned_users : order.assigned_user ? [order.assigned_user] : []
          const first = assigned[0]
          if (canAssign) {
            return (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type='button'
                    className={cn(
                      'hover:bg-bg-active inline-flex items-center gap-1.5 rounded-[5px] px-1 py-0.5 text-[13px] transition-colors duration-75',
                      first ? 'text-text-secondary' : 'text-text-tertiary'
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      onAssign(order)
                    }}
                  >
                    {first ? (
                      <>
                        <InitialsAvatar
                          initials={getInitials(getUserDisplayName(first))}
                          size={16}
                        />
                        <span className='truncate'>{getUserDisplayName(first)}</span>
                        {assigned.length > 1 && (
                          <span className='text-[11px] text-text-tertiary'>+{assigned.length - 1}</span>
                        )}
                      </>
                    ) : (
                      <>
                        <UserPlus className='size-3.5' />
                        <span>Assign</span>
                      </>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {first
                    ? `Assigned to ${assigned.map((u) => getUserDisplayName(u)).join(', ')} — click to change`
                    : 'Assign a sales user'}
                </TooltipContent>
              </Tooltip>
            )
          }
          if (first) {
            return (
              <span className='inline-flex items-center gap-1.5 px-1 py-0.5 text-[13px] text-text-secondary'>
                <InitialsAvatar initials={getInitials(getUserDisplayName(first))} size={16} />
                <span className='truncate'>{getUserDisplayName(first)}</span>
                {assigned.length > 1 && (
                  <span className='text-[11px] text-text-tertiary'>+{assigned.length - 1}</span>
                )}
              </span>
            )
          }
          return <span className='px-1 text-[13px] text-text-tertiary'>&mdash;</span>
        })()}
      </div>

      {/* Notes */}
      <div className='flex w-[46px] shrink-0 justify-center'>
        <button
          type='button'
          className={cn(
            'inline-flex h-[26px] w-[46px] items-center justify-center gap-1 rounded-[6px] border text-[12px] font-medium tabular-nums transition-colors duration-[80ms]',
            noteCount > 0
              ? 'border-border bg-bg-secondary text-text-secondary hover:bg-bg-active'
              : 'text-text-quaternary hover:bg-bg-hover hover:text-text-tertiary border-transparent'
          )}
          aria-label='Open notes'
          onClick={(e) => {
            e.stopPropagation()
            onNotes(order)
          }}
        >
          <StickyNote className='size-3.5' />
          {noteCount > 0 && <span>{noteCount}</span>}
        </button>
      </div>

      {/* Actions */}
      <div
        className='flex w-[28px] shrink-0 items-center justify-center'
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role='group'
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type='button'
              className='text-text-tertiary hover:bg-bg-active hover:text-foreground inline-flex size-6 items-center justify-center rounded-[6px] transition-colors duration-[80ms]'
              aria-label='Order actions'
            >
              <MoreHorizontal className='size-4' />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align='end'
            className='w-[200px] rounded-[8px] p-1'
            style={{ boxShadow: 'var(--dropdown-shadow)' }}
          >
            {canAssign && (
              <DropdownMenuItem
                className='cursor-pointer gap-2 rounded-[6px] px-2 py-1 text-[13px]'
                onClick={() => onAssign(order)}
              >
                <UserPlus className='size-3.5' />
                Assign
              </DropdownMenuItem>
            )}
            {order.status === ORDER_STATUS.unprocessed && (
              <DropdownMenuItem
                className='cursor-pointer gap-2 rounded-[6px] px-2 py-1 text-[13px]'
                onClick={() => onPick(order)}
              >
                <ClipboardList className='size-3.5' />
                Start Picking
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className='cursor-pointer gap-2 rounded-[6px] px-2 py-1 text-[13px]'
              onClick={() => onCreateTask(order)}
            >
              <ListTodo className='size-3.5' />
              Create Task
            </DropdownMenuItem>
            <DropdownMenuItem
              className='cursor-pointer gap-2 rounded-[6px] px-2 py-1 text-[13px]'
              onClick={() => onAttachments(order)}
            >
              <Paperclip className='size-3.5' />
              Attachments
            </DropdownMenuItem>
            {order.external_id && (
              <DropdownMenuItem
                variant='destructive'
                className='cursor-pointer gap-2 rounded-[6px] px-2 py-1 text-[13px]'
                onClick={() => onDeleteLinkedProposal(order)}
              >
                <Link2Off className='size-3.5' />
                Delete Linked Proposal
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              variant='destructive'
              className='cursor-pointer gap-2 rounded-[6px] px-2 py-1 text-[13px]'
              onClick={() => onDelete(order)}
            >
              <Trash2 className='size-3.5' />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// ── Pick Badge ──────────────────────────────────────────

function PickBadge({ pickStatus }: { pickStatus?: string }) {
  if (!pickStatus) return null
  const match = pickStatus.match(/^(\d+)\/(\d+)$/)
  if (!match)
    return <span className='text-text-tertiary text-[11px] tabular-nums'>{pickStatus}</span>

  const picked = Number(match[1])
  const total = Number(match[2])
  if (total === 0) return null

  const allPicked = picked === total

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[11px] leading-none font-semibold tabular-nums',
            allPicked
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : picked > 0
                ? 'bg-primary/10 text-primary'
                : 'text-text-quaternary'
          )}
        >
          {allPicked ? <Check className='size-3' /> : <PackageCheck className='size-3' />}
          {pickStatus}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {allPicked ? 'All items picked' : `${picked} of ${total} items picked`}
      </TooltipContent>
    </Tooltip>
  )
}

// ── Packed Badge ────────────────────────────────────────────

function PackedBadge({ packedStatus }: { packedStatus?: string }) {
  if (!packedStatus) return null
  const match = packedStatus.match(/^(\d+)\/(\d+)$/)
  if (!match)
    return <span className='text-text-tertiary text-[11px] tabular-nums'>{packedStatus}</span>

  const packed = Number(match[1])
  const total = Number(match[2])
  if (total === 0 || packed === 0) return null

  const allPacked = packed === total

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[11px] leading-none font-semibold tabular-nums',
            allPacked
              ? 'bg-violet-500/10 text-violet-700 dark:text-violet-400'
              : 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
          )}
        >
          <Package className='size-3' />
          {packedStatus}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {allPacked ? 'All items packed' : `${packed} of ${total} items packed`}
      </TooltipContent>
    </Tooltip>
  )
}

// ── Sortable Header ─────────────────────────────────────────

function OrderSortableHeader({
  field,
  label,
  sortField,
  sortDir,
  onSort,
  className
}: {
  field: OrderSortField
  label: string
  sortField: OrderSortField | null
  sortDir: SortDir
  onSort: (field: OrderSortField) => void
  className?: string
}) {
  const active = sortField === field
  return (
    <button
      type='button'
      className={cn(
        'group hover:text-foreground inline-flex items-center gap-1 text-left transition-colors duration-[80ms]',
        active && 'text-foreground',
        className
      )}
      onClick={() => onSort(field)}
    >
      {label}
      {active ? (
        sortDir === 'asc' ? (
          <ArrowUp className='size-3' />
        ) : (
          <ArrowDown className='size-3' />
        )
      ) : (
        <ArrowUp className='size-3 opacity-30 transition-opacity group-hover:opacity-60' />
      )}
    </button>
  )
}

export const Route = createFileRoute('/_authenticated/orders/')({
  component: OrdersPage,
  head: () => ({
    meta: [{ title: 'Orders' }]
  })
})
