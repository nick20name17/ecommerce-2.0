import {
  ClipboardList,
  Link2Off,
  ListTodo,
  Loader2,
  MoreHorizontal,
  Paperclip,
  StickyNote,
  Trash2,
  UserPlus
} from 'lucide-react'

import type { Order } from '@/api/order/schema'
import { InitialsAvatar } from '@/components/ds'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ORDER_STATUS, ORDER_STATUS_CLASS, getOrderStatusLabel } from '@/constants/order'
import { formatCurrency, formatDate, getInitials, getUserDisplayName } from '@/helpers/formatters'
import { cn } from '@/lib/utils'
import { PickBadge, PackedBadge } from './orders-badges'
import { STATUS_DOT_COLORS } from './orders-constants'

// ── Props ────────────────────────────────────────────────────

export interface OrderRowProps {
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
}

// ── Pending Order Row ────────────────────────────────────────

export function PendingOrderRow({ autoid, isMobile }: { autoid: string; isMobile: boolean }) {
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

export function OrderRow({
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
}: OrderRowProps) {
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
        <span className='shrink-0 text-[13px] font-medium tabular-nums'>
          {invoice}
        </span>
        <span className='text-text-tertiary min-w-0 flex-1 truncate text-[13px]'>{order.name || '—'}</span>
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
      <div className={cn('text-foreground shrink-0 text-right text-[13px] font-medium tabular-nums', isTablet ? 'w-[80px]' : 'w-[100px]')}>
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
      {!isTablet && (
        <div className='flex w-27.5 shrink-0 items-center justify-center gap-1'>
          <PickBadge pickStatus={order.pick_status} />
          <PackedBadge packedStatus={order.packed_status} />
        </div>
      )}

      {/* Salesman */}
      {!isTablet && (
        <div className='w-[90px] shrink-0 truncate text-[13px] text-text-secondary'>
          {order.salesman || <span className='text-text-tertiary'>&mdash;</span>}
        </div>
      )}

      {/* Responsible */}
      <div className={cn('shrink-0', isTablet ? 'w-[46px]' : 'w-[120px]')}>
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
