import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowDown,
  ArrowUp,
  Check,
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
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { OrderAssignDialog } from './-components/order-assign-dialog'
import { OrderDeleteDialog } from './-components/order-delete-dialog'
import { getFieldConfigQuery } from '@/api/field-config/query'
import { CommandBarCreate } from '@/components/tasks/command-bar-create'
import { FilterChip, FilterPopover, IOrders, InitialsAvatar, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import { ORDER_QUERY_KEYS, getOrdersQuery } from '@/api/order/query'
import type { Order, OrderParams } from '@/api/order/schema'
import { orderService } from '@/api/order/service'
import { PageEmpty } from '@/components/common/page-empty'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { EntityAttachmentsDialog } from '@/components/common/entity-attachments/entity-attachments-dialog'
import { EntityNotesSheet } from '@/components/common/entity-notes/entity-notes-sheet'
import { Pagination } from '@/components/common/filters/pagination'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ORDER_STATUS, ORDER_STATUS_CLASS, ORDER_STATUS_LABELS, getOrderStatusLabel } from '@/constants/order'
import type { OrderStatus } from '@/constants/order'
import { isAdmin } from '@/constants/user'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { useProjectId } from '@/hooks/use-project-id'
import { formatCurrency, formatDate } from '@/helpers/formatters'
import { cn } from '@/lib/utils'
import {
  useAutoidParam,
  useLimitParam,
  useOffsetParam,
  useOrderProjectIdParam,
  useSearchParam,
} from '@/hooks/use-query-params'
import { useAuth } from '@/providers/auth'

// ── Helpers ──────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
}

// ── Constants ────────────────────────────────────────────────

const STATUS_DOT_COLORS: Record<string, string> = {
  U: 'bg-amber-500',
  O: 'bg-blue-500',
  X: 'bg-emerald-500',
  P: 'bg-green-500',
  V: 'bg-red-500',
  H: 'bg-slate-400',
  A: 'bg-purple-500',
}

type OrderSortField = 'invoice' | 'name' | 'inv_date' | 'total' | 'balance'
type SortDir = 'asc' | 'desc'

const FILTER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: ORDER_STATUS.unprocessed, label: 'Unprocessed' },
  { value: ORDER_STATUS.open, label: 'Open' },
  { value: ORDER_STATUS.closed, label: 'Closed' },
  { value: ORDER_STATUS.paid, label: 'Paid' },
  { value: ORDER_STATUS.voided, label: 'Voided' },
  { value: ORDER_STATUS.onHold, label: 'On Hold' },
]

// ── Page Component ───────────────────────────────────────────

const OrdersPage = () => {
  const navigate = useNavigate()
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

  const [sortField, setSortField] = useState<OrderSortField | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const [activeStatus, setActiveStatus] = useState<OrderStatus | null>(ORDER_STATUS.unprocessed)
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [orderForAttachments, setOrderForAttachments] = useState<Order | null>(null)
  const [orderForNotes, setOrderForNotes] = useState<Order | null>(null)
  const [orderToAssign, setOrderToAssign] = useState<Order | null>(null)
  const [orderForTask, setOrderForTask] = useState<Order | null>(null)

  const ordering = sortField ? (sortDir === 'desc' ? `-${sortField}` : sortField) : undefined

  const handleSort = (field: OrderSortField) => {
    if (sortField === field) {
      if (sortDir === 'asc') setSortDir('desc')
      else { setSortField(null); setSortDir('asc') }
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
      invalidatesQuery: ORDER_QUERY_KEYS.lists(),
    },
  })

  const selectStatus = (s: OrderStatus) => {
    setActiveStatus((prev) => (prev === s ? null : s))
    setOffset(null)
  }

  const clearAllFilters = () => {
    setActiveStatus(null)
    setOffset(null)
  }

  const hasFilters = activeStatus !== null

  const params: OrderParams = {
    search: search || undefined,
    autoid: autoidFromUrl ?? undefined,
    offset,
    limit,
    status: activeStatus ?? undefined,
    project_id: projectId ?? undefined,
    ordering,
    notes: true,
  }

  const { data, refetch, isLoading } = useQuery(getOrdersQuery(params))

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
      setTimeout(() => refetch(), 3000),
      setTimeout(() => refetch(), 6000),
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
      <header className={cn('flex h-12 shrink-0 items-center gap-2.5 border-b border-border', isMobile ? 'px-3.5' : 'px-6')}>
        <SidebarTrigger className='-ml-1' />
        <div className='flex items-center gap-1.5'>
          <PageHeaderIcon icon={IOrders} color={PAGE_COLORS.orders} />
          <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>Orders</h1>
        </div>

        <div className='flex-1' />

        <div className='hidden h-7 w-[260px] items-center gap-1.5 rounded-[5px] border border-border bg-background px-2 transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50 sm:flex'>
          <Search className='size-3 shrink-0 text-text-tertiary' />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setOffset(null)
            }}
            placeholder='Search by invoice number...'
            className='flex-1 bg-transparent text-[13px] outline-none placeholder:text-text-tertiary'
          />
        </div>

        <div className='flex items-center gap-1.5'>
          <FilterPopover
            label='Status'
            active={activeStatus !== null}
            icon={<div className={cn('size-2.5 rounded-full', activeStatus ? STATUS_DOT_COLORS[activeStatus] : 'bg-current')} />}
          >
            {FILTER_STATUSES.map((s) => {
              const selected = activeStatus === s.value
              return (
                <button
                  key={s.value}
                  type='button'
                  className={cn(
                    'flex w-full items-center gap-2 rounded-[5px] px-2 py-[3px] text-left text-[13px] font-medium',
                    'transition-colors duration-[80ms] hover:bg-bg-hover'
                  )}
                  onClick={() => selectStatus(s.value)}
                >
                  <div className={cn(
                    'flex size-3.5 items-center justify-center rounded-full border transition-colors duration-[80ms]',
                    selected ? 'border-primary bg-primary' : 'border-border'
                  )}>
                    {selected && <div className='size-1.5 rounded-full bg-primary-foreground' />}
                  </div>
                  <div className={cn('size-2.5 shrink-0 rounded-full', STATUS_DOT_COLORS[s.value] ?? 'bg-slate-400')} />
                  <span className='flex-1'>{s.label}</span>
                </button>
              )
            })}
          </FilterPopover>

          <button
            type='button'
            className='inline-flex h-7 items-center gap-1 rounded-[5px] bg-primary px-2 text-[13px] font-semibold text-primary-foreground transition-colors duration-[80ms] hover:opacity-90 sm:px-2.5'
            onClick={() => navigate({ to: '/create' })}
          >
            <Plus className='size-3.5' />
            <span className='hidden sm:inline'>Create Order</span>
          </button>
        </div>
      </header>

      {/* Active filter chips */}
      {(hasFilters || autoidFromUrl) && (
        <div className={cn('flex shrink-0 flex-wrap items-center gap-1.5 border-b border-border py-1.5', isMobile ? 'px-3.5' : 'px-6')}>
          {hasFilters && (
            <button
              type='button'
              className='text-[13px] font-medium text-text-tertiary transition-colors duration-[80ms] hover:text-foreground'
              onClick={clearAllFilters}
            >
              Clear
            </button>
          )}
          {activeStatus && (
            <FilterChip onRemove={() => setActiveStatus(null)}>
              <span className='text-text-tertiary'>Status is</span>
              <div className={cn('size-2 rounded-full', STATUS_DOT_COLORS[activeStatus] ?? 'bg-slate-400')} />
              {ORDER_STATUS_LABELS[activeStatus]}
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
              'sticky top-0 z-10 flex select-none items-center border-b border-border bg-bg-secondary/60 text-[13px] font-medium text-text-tertiary backdrop-blur-sm',
              isTablet ? 'gap-4 px-5 py-1' : 'gap-6 px-6 py-1',
            )}
          >
            <OrderSortableHeader field='invoice' label='Invoice / Customer' sortField={sortField} sortDir={sortDir} onSort={handleSort} className='min-w-0 flex-1' />
            <div className='w-[88px] shrink-0'>Status</div>
            {!isTablet && <OrderSortableHeader field='inv_date' label='Date' sortField={sortField} sortDir={sortDir} onSort={handleSort} className='w-[100px] shrink-0 justify-end text-right' />}
            <OrderSortableHeader field='total' label='Total' sortField={sortField} sortDir={sortDir} onSort={handleSort} className='w-[100px] shrink-0 justify-end text-right' />
            {!isTablet && <OrderSortableHeader field='balance' label='Balance' sortField={sortField} sortDir={sortDir} onSort={handleSort} className='w-[100px] shrink-0 justify-end text-right' />}
            {!isTablet && <div className='w-[56px] shrink-0 text-center'>Pick</div>}
            <div className='w-[120px] shrink-0'>Responsible</div>
            <div className='w-[46px] shrink-0' />
            <div className='w-[28px] shrink-0' />
          </div>
        )}

        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) =>
            isMobile ? (
              <div key={i} className='border-b border-border-light px-3.5 py-2'>
                <div className='mb-1 flex items-center gap-2'>
                  <Skeleton className='size-1.5 shrink-0 rounded-full' />
                  <Skeleton className='h-3.5 w-24 rounded' />
                  <div className='flex-1' />
                  <Skeleton className='h-3.5 w-16 rounded' />
                </div>
                <div className='flex items-center gap-2 pl-[20px]'>
                  <Skeleton className='h-3.5 w-20 rounded' />
                  <Skeleton className='h-3.5 w-16 rounded' />
                </div>
              </div>
            ) : (
              <div
                key={i}
                className={cn(
                  'flex items-center border-b border-border-light',
                  isTablet ? 'gap-4 px-5 py-1.5' : 'gap-6 px-6 py-1.5',
                )}
              >
                <div className='flex min-w-0 flex-1 items-center gap-2'>
                  <Skeleton className='h-3.5 w-16 rounded' />
                  <Skeleton className='h-3.5 w-24 rounded' />
                </div>
                <div className='w-[88px] shrink-0'><Skeleton className='h-[18px] w-[60px] rounded-[4px]' /></div>
                {!isTablet && <div className='w-[100px] shrink-0'><Skeleton className='ml-auto h-3.5 w-[70px] rounded' /></div>}
                <div className='w-[100px] shrink-0'><Skeleton className='ml-auto h-3.5 w-[60px] rounded' /></div>
                {!isTablet && <div className='w-[100px] shrink-0'><Skeleton className='ml-auto h-3.5 w-[60px] rounded' /></div>}
                {!isTablet && <div className='w-[56px] shrink-0'><Skeleton className='mx-auto h-3.5 w-[32px] rounded' /></div>}
                <div className='w-[120px] shrink-0'><Skeleton className='h-3.5 w-[70px] rounded' /></div>
                <div className='w-[46px] shrink-0' />
                <div className='w-[28px] shrink-0' />
              </div>
            ),
          )
        ) : results.length === 0 && !hasPendingAutoid ? (
          <PageEmpty icon={Package} title='No matching orders' description='Try adjusting your search or filters.' />
        ) : (
          <>
            {hasPendingAutoid && (
              <PendingOrderRow autoid={autoidFromUrl} isMobile={isMobile} />
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
                onClick={() =>
                  navigate({
                    to: '/orders/$orderId',
                    params: { orderId: order.autoid },
                  })
                }
              />
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div className={cn('shrink-0 border-t border-border py-2', isMobile ? 'px-3.5' : 'px-6')}>
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
        entityLabel={
          orderForNotes ? `Order ${orderForNotes.invoice ?? orderForNotes.autoid}` : ''
        }
        autoid={orderForNotes?.autoid ?? ''}
        projectId={projectId}
      />
      {orderForTask && (
        <CommandBarCreate
          onClose={() => setOrderForTask(null)}
          defaultLinkedOrderAutoid={orderForTask.autoid}
        />
      )}
    </div>
  )
}

// ── Pending Order Row ────────────────────────────────────────

function PendingOrderRow({ autoid, isMobile }: { autoid: string; isMobile: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 border-b border-border-light py-2 opacity-60',
        isMobile ? 'px-3.5' : 'px-6',
      )}
    >
      <Loader2 className='size-3.5 animate-spin text-text-tertiary' />
      <span className='text-[13px] text-text-tertiary'>
        Creating order {autoid}…
      </span>
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
  onClick,
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
  onClick: () => void
}) {
  const invoice = order.invoice?.trim() || `#${order.id}`
  const statusLabel = getOrderStatusLabel(order.status)
  const statusClass = ORDER_STATUS_CLASS[order.status] ?? ''
  const dotColor = STATUS_DOT_COLORS[order.status] ?? 'bg-slate-400'

  const noteCount = Array.isArray(order.notes) ? order.notes.length : 0

  if (isMobile) {
    return (
      <div
        className='cursor-pointer border-b border-border-light px-3.5 py-2 transition-colors duration-100 hover:bg-bg-hover'
        onClick={onClick}
      >
        <div className='mb-1 flex items-center gap-2'>
          <div className={cn('size-1.5 shrink-0 rounded-full', dotColor)} />
          <span className='min-w-0 flex-1 truncate text-[13px] font-medium text-foreground'>
            {invoice}
          </span>
          <span className='shrink-0 text-[13px] font-medium tabular-nums text-foreground'>
            {formatCurrency(order.total, '—')}
          </span>
        </div>
        <div className='flex flex-wrap items-center gap-2 pl-[20px]'>
          <span className='text-[13px] text-text-tertiary'>{order.name || '—'}</span>
          <span className='text-[13px] text-text-tertiary'>{statusLabel}</span>
          {order.inv_date && (
            <span className='text-[13px] tabular-nums text-text-tertiary'>
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
        'group/row flex cursor-pointer items-center border-b border-border-light text-foreground transition-colors duration-100 hover:bg-bg-hover',
        isTablet ? 'gap-4 px-5 py-1.5' : 'gap-6 px-6 py-1.5',
      )}
      onClick={onClick}
    >
      {/* Invoice + customer */}
      <div className='flex min-w-0 flex-1 items-center gap-2'>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className='shrink-0 truncate text-[13px] font-medium' style={{ maxWidth: '40%' }}>{invoice}</span>
          </TooltipTrigger>
          <TooltipContent side='top'>{invoice}</TooltipContent>
        </Tooltip>
        <span className='min-w-0 truncate text-[13px] text-text-tertiary'>
          {order.name || '—'}
        </span>
      </div>

      {/* Status */}
      <div className='w-[88px] shrink-0'>
        <span className={cn('inline-flex items-center rounded-[4px] border px-1.5 py-0.5 text-[11px] font-semibold leading-none', statusClass)}>
          {statusLabel}
        </span>
      </div>

      {/* Date */}
      {!isTablet && (
        <div className='w-[100px] shrink-0 text-right text-[13px] tabular-nums text-text-secondary'>
          {order.inv_date ? formatDate(order.inv_date) : <span className='text-text-tertiary'>&mdash;</span>}
        </div>
      )}

      {/* Total */}
      <div className='w-[100px] shrink-0 text-right text-[13px] font-medium tabular-nums text-foreground'>
        {formatCurrency(order.total, '—')}
      </div>

      {/* Balance */}
      {!isTablet && (
        <div
          className={cn(
            'w-[100px] shrink-0 text-right text-[13px] font-medium tabular-nums',
            Number(order.balance) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-text-tertiary',
          )}
        >
          {formatCurrency(order.balance, '—')}
        </div>
      )}

      {/* Pick status */}
      {!isTablet && (
        <div className='w-[56px] shrink-0 text-center'>
          <PickBadge pickStatus={order.pick_status} />
        </div>
      )}

      {/* Responsible */}
      <div className='w-[120px] shrink-0'>
        {canAssign && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type='button'
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-[5px] px-1 py-0.5 text-[13px] transition-colors duration-75 hover:bg-bg-active',
                  order.assigned_user ? 'text-text-secondary' : 'text-text-tertiary'
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  onAssign(order)
                }}
              >
                {order.assigned_user ? (
                  <>
                    <InitialsAvatar
                      initials={getInitials(`${order.assigned_user.first_name} ${order.assigned_user.last_name}`)}
                      size={16}
                    />
                    <span className='truncate'>
                      {order.assigned_user.first_name} {order.assigned_user.last_name}
                    </span>
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
              {order.assigned_user
                ? `Assigned to ${order.assigned_user.first_name} ${order.assigned_user.last_name} — click to change`
                : 'Assign a sales user'}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Notes */}
      <div className='flex w-[46px] shrink-0 justify-center'>
        <button
          type='button'
          className={cn(
            'inline-flex h-[26px] w-[46px] items-center justify-center gap-1 rounded-[6px] border text-[12px] font-medium tabular-nums transition-colors duration-[80ms]',
            noteCount > 0
              ? 'border-border bg-bg-secondary text-text-secondary hover:bg-bg-active'
              : 'border-transparent text-text-quaternary hover:bg-bg-hover hover:text-text-tertiary',
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
              className='inline-flex size-6 items-center justify-center rounded-[6px] text-text-tertiary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground'
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
  if (!match) return <span className='text-[11px] tabular-nums text-text-tertiary'>{pickStatus}</span>

  const picked = Number(match[1])
  const total = Number(match[2])
  if (total === 0) return null

  const allPicked = picked === total

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[11px] font-semibold tabular-nums leading-none',
            allPicked
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : picked > 0
                ? 'bg-primary/10 text-primary'
                : 'text-text-quaternary',
          )}
        >
          {allPicked ? (
            <Check className='size-3' />
          ) : (
            <PackageCheck className='size-3' />
          )}
          {pickStatus}
        </span>
      </TooltipTrigger>
      <TooltipContent>{allPicked ? 'All items picked' : `${picked} of ${total} items picked`}</TooltipContent>
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
  className,
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
        'group inline-flex items-center gap-1 text-left transition-colors duration-[80ms] hover:text-foreground',
        active && 'text-foreground',
        className
      )}
      onClick={() => onSort(field)}
    >
      {label}
      {active ? (
        sortDir === 'asc'
          ? <ArrowUp className='size-3' />
          : <ArrowDown className='size-3' />
      ) : (
        <ArrowUp className='size-3 opacity-30 group-hover:opacity-60 transition-opacity' />
      )}
    </button>
  )
}

export const Route = createFileRoute('/_authenticated/orders/')({
  component: OrdersPage,
  head: () => ({
    meta: [{ title: 'Orders' }],
  }),
})
