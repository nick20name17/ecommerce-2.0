import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Search, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { getOrdersQuery } from '@/api/order/query'
import type { Order, OrderParams } from '@/api/order/schema'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ORDER_STATUS_CLASS, ORDER_STATUS_LABELS } from '@/constants/order'
import type { OrderStatus } from '@/constants/order'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { useProjectId } from '@/hooks/use-project-id'
import { formatCurrency, formatDate } from '@/helpers/formatters'
import { OrderDeleteDialog } from '@/routes/_authenticated/orders/-components/order-delete-dialog'
import { cn } from '@/lib/utils'

const STATUS_DOT_COLORS: Record<string, string> = {
  U: 'bg-amber-500',
  O: 'bg-blue-500',
  X: 'bg-emerald-500',
  P: 'bg-green-500',
  V: 'bg-red-500',
  H: 'bg-slate-400',
  A: 'bg-purple-500',
}

interface CustomerOrdersTabProps {
  customerId: string
}

export const CustomerOrdersTab = ({ customerId }: CustomerOrdersTabProps) => {
  const navigate = useNavigate()
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const isTablet = bp === 'tablet'
  const [projectId] = useProjectId()
  const [search, setSearch] = useState('')
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)

  const params: OrderParams = {
    customer_id: customerId,
    search: search || undefined,
    project_id: projectId ?? undefined,
    limit: 200,
  }

  const { data, isLoading } = useQuery({
    ...getOrdersQuery(params),
    placeholderData: keepPreviousData,
  })

  const orders = data?.results ?? []

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* Search bar */}
      <div
        className={cn(
          'flex shrink-0 items-center gap-2 border-b border-border py-2',
          isMobile ? 'px-5' : 'px-6'
        )}
      >
        <div className='flex flex-1 items-center gap-1.5 rounded-[6px] border border-border bg-background px-2.5 py-1.5'>
          <Search className='size-3.5 shrink-0 text-text-tertiary' />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search orders...'
            className='flex-1 bg-transparent text-[13px] outline-none placeholder:text-text-tertiary'
          />
        </div>
      </div>

      {/* Table header */}
      {!isMobile && (
        <div
          className={cn(
            'flex shrink-0 items-center border-b border-border bg-bg-secondary/60',
            isTablet ? 'gap-3 px-5 py-1.5' : 'gap-4 px-6 py-1.5'
          )}
        >
          <div className='min-w-0 flex-1 text-[12px] font-medium uppercase tracking-[0.04em] text-text-tertiary'>
            Invoice
          </div>
          <div className='w-[80px] shrink-0 text-[12px] font-medium uppercase tracking-[0.04em] text-text-tertiary'>
            Date
          </div>
          {!isTablet && (
            <div className='w-[60px] shrink-0 text-[12px] font-medium uppercase tracking-[0.04em] text-text-tertiary'>
              Qty
            </div>
          )}
          <div className='w-[80px] shrink-0 text-right text-[12px] font-medium uppercase tracking-[0.04em] text-text-tertiary'>
            Total
          </div>
          <div className='w-[26px] shrink-0' />
        </div>
      )}

      {/* Order list */}
      <div className='flex-1 overflow-y-auto'>
        {isLoading ? (
          <div className='space-y-0'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-3 border-b border-border-light py-2',
                  isMobile ? 'px-5' : 'px-6'
                )}
              >
                <div className='h-3 w-16 animate-pulse rounded bg-border' />
                <div className='h-3 flex-1 animate-pulse rounded bg-border' />
                <div className='h-3 w-14 animate-pulse rounded bg-border' />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-16 text-center'>
            <p className='text-[13px] text-text-tertiary'>No orders found</p>
          </div>
        ) : (
          orders.map((order) => (
            <OrderRow
              key={order.autoid}
              order={order}
              isMobile={isMobile}
              isTablet={isTablet}
              onDelete={setOrderToDelete}
              onClick={() =>
                navigate({
                  to: '/orders/$orderId',
                  params: { orderId: order.autoid },
                })
              }
            />
          ))
        )}
      </div>

      {/* Footer */}
      {orders.length > 0 && (
        <div
          className={cn(
            'shrink-0 border-t border-border py-1.5',
            isMobile ? 'px-5' : 'px-6'
          )}
        >
          <p className='text-[13px] tabular-nums text-text-tertiary'>
            {orders.length} order{orders.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      <OrderDeleteDialog
        order={orderToDelete}
        projectId={projectId}
        open={!!orderToDelete}
        onOpenChange={(open) => !open && setOrderToDelete(null)}
      />
    </div>
  )
}

// ── Order Row ───────────────────────────────────────────────

function OrderRow({
  order,
  isMobile,
  isTablet,
  onDelete,
  onClick,
}: {
  order: Order
  isMobile: boolean
  isTablet: boolean
  onDelete: (order: Order) => void
  onClick: () => void
}) {
  const statusLabel = ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status ?? '—'
  const statusClass = ORDER_STATUS_CLASS[order.status as OrderStatus] ?? ''
  const dotColor = STATUS_DOT_COLORS[order.status] ?? 'bg-slate-400'
  const invoiceDate = formatDate(order.inv_date)
  const total = formatCurrency(order.total)

  if (isMobile) {
    return (
      <div
        className='cursor-pointer border-b border-border-light px-5 py-2 transition-colors duration-100 hover:bg-bg-hover'
        onClick={onClick}
      >
        <div className='flex items-center justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <span className='text-[13px] font-medium text-foreground'>
              {order.invoice || order.id}
            </span>
            <StatusBadge status={order.status} label={statusLabel} statusClass={statusClass} dotColor={dotColor} />
          </div>
          <span className='text-[13px] font-medium tabular-nums text-foreground'>
            {total}
          </span>
        </div>
        <div className='mt-0.5 flex items-center gap-2 text-[13px] text-text-tertiary'>
          <span>{invoiceDate}</span>
          <span className='tabular-nums'>
            Qty: {order.total_quan ?? '—'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group/row flex cursor-pointer items-center border-b border-border-light transition-colors duration-100 hover:bg-bg-hover',
        isTablet ? 'gap-3 px-5 py-1.5' : 'gap-4 px-6 py-1.5'
      )}
      onClick={onClick}
    >
      {/* Invoice / ID */}
      <div className='flex min-w-0 flex-1 items-center gap-2'>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className='truncate text-[13px] font-medium text-foreground'>
              {order.invoice || order.id}
            </span>
          </TooltipTrigger>
          <TooltipContent side='top'>
            {order.invoice || order.id}
          </TooltipContent>
        </Tooltip>
        <StatusBadge status={order.status} label={statusLabel} statusClass={statusClass} dotColor={dotColor} />
      </div>

      {/* Date */}
      <div className='w-[80px] shrink-0 text-[13px] tabular-nums text-text-tertiary'>
        {invoiceDate}
      </div>

      {/* Qty */}
      {!isTablet && (
        <div className='w-[60px] shrink-0 text-[13px] tabular-nums text-text-secondary'>
          {order.total_quan ?? '—'}
        </div>
      )}

      {/* Total */}
      <div className='w-[80px] shrink-0 text-right text-[13px] font-medium tabular-nums text-foreground'>
        {total}
      </div>

      {/* Actions */}
      <div
        className='flex justify-center opacity-0 transition-opacity group-hover/row:opacity-100'
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
              <svg width='15' height='15' viewBox='0 0 15 15' fill='none'>
                <circle cx='3' cy='7.5' r='1.2' fill='currentColor' />
                <circle cx='7.5' cy='7.5' r='1.2' fill='currentColor' />
                <circle cx='12' cy='7.5' r='1.2' fill='currentColor' />
              </svg>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align='end'
            className='w-[180px] rounded-[8px] p-1'
            style={{ boxShadow: 'var(--dropdown-shadow)' }}
          >
            <DropdownMenuItem
              variant='destructive'
              className='cursor-pointer gap-2 rounded-[6px] px-2 py-1 text-[13px]'
              onClick={() => onDelete(order)}
            >
              <Trash2 className='size-3.5' />
              Delete order
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// ── Status Badge ────────────────────────────────────────────

function StatusBadge({
  label,
  statusClass,
  dotColor,
}: {
  status: string
  label: string
  statusClass: string
  dotColor: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none',
        statusClass,
      )}
    >
      <span className={cn('size-1.5 rounded-full', dotColor)} />
      {label}
    </span>
  )
}
