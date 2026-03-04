'use no memo'

import type { ColumnDef } from '@tanstack/react-table'
import { Link2Off, Loader2, MoreHorizontal, Paperclip, Trash2, UserPlus } from 'lucide-react'

import type { FieldConfigResponse } from '@/api/field-config/schema'
import type { Order } from '@/api/order/schema'
import { createExpanderColumn } from '@/components/common/data-table/columns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ORDER_STATUS_CLASS, getOrderStatusLabel } from '@/constants/order'
import type { OrderStatus } from '@/constants/order'
import {
  buildDynamicDataColumns,
  getColumnLabel,
  getOrderedDataKeys
} from '@/helpers/dynamic-columns'
import type { DynamicCellFormatter } from '@/helpers/dynamic-columns'
import { formatCurrency, formatDate } from '@/helpers/formatters'
import { cn } from '@/lib/utils'

export type OrderRow = Order & { _pending?: true }

export type OrderActionsVariant = 'full' | 'deleteOnly'

interface OrderColumnsOptions {
  fieldConfig: FieldConfigResponse | null | undefined
  data: OrderRow[]
  onDelete: (order: Order) => void
  onDeleteLinkedProposal?: (order: Order) => void
  onAttachments?: (order: Order) => void
  onAssign?: (order: Order) => void
  canAssign?: boolean
  actionsVariant?: OrderActionsVariant
}

const ORDER_FORMATTERS: Partial<Record<string, DynamicCellFormatter<OrderRow>>> = {
  status: (v, row) => {
    if (row._pending)
      return (
        <Badge
          variant='outline'
          className='text-muted-foreground font-medium'
        >
          Creating…
        </Badge>
      )
    const status = (v ?? row.status) as OrderStatus
    return (
      <Badge
        variant='outline'
        className={cn('font-medium', ORDER_STATUS_CLASS[status] ?? '')}
      >
        {getOrderStatusLabel(status)}
      </Badge>
    )
  },
  inv_date: (v, row) => (row._pending ? '—' : formatDate((v ?? row.inv_date) as string | null)),
  due_date: (v, row) => (row._pending ? '—' : formatDate((v ?? row.due_date) as string | null)),
  total: (v, row) =>
    row._pending ? (
      '—'
    ) : (
      <span className='font-medium'>{formatCurrency((v ?? row.total) as string, '—')}</span>
    ),
  total_quan: (v, row) => {
    if (row._pending) return '—'
    const totalQuan = parseInt(String(v ?? row.total_quan), 10) || 0
    const totalShip = parseInt(String(row.total_ship), 10) || 0
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            {totalQuan} / {totalShip}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Total Quan: {totalQuan}</p>
          <p>Total Ship: {totalShip}</p>
        </TooltipContent>
      </Tooltip>
    )
  },
  invoice: (v, row) => {
    if (row._pending)
      return (
        <span className='text-muted-foreground flex items-center gap-2'>
          <Loader2 className='size-4 animate-spin' />
          Pending…
        </span>
      )
    const invoice = String(v ?? row.invoice ?? '').trim() || '—'
    if (invoice === '—') return <span className='text-muted-foreground'>—</span>
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className='block max-w-full truncate font-medium'>{invoice}</span>
        </TooltipTrigger>
        <TooltipContent>{invoice}</TooltipContent>
      </Tooltip>
    )
  }
}

export const getOrderColumns = ({
  fieldConfig,
  data,
  onDelete,
  onDeleteLinkedProposal,
  onAttachments,
  onAssign,
  canAssign,
  actionsVariant = 'full'
}: OrderColumnsOptions): ColumnDef<OrderRow>[] => {
  const entity = 'order'
  const orderedKeys = getOrderedDataKeys(data, entity, fieldConfig)
  const getLabel = (key: string) => getColumnLabel(key, entity, fieldConfig)
  const dataColumns = buildDynamicDataColumns<OrderRow>(orderedKeys, getLabel, {
    formatters: ORDER_FORMATTERS
  })

  const actionsColumn: ColumnDef<OrderRow> = {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      if (row.original._pending) return null
      const showAttachments = actionsVariant === 'full' && onAttachments
      const showDeleteLinked =
        actionsVariant === 'full' && onDeleteLinkedProposal && row.original.external_id
      return (
        <div
          role='group'
          className='flex justify-center'
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='icon-sm'
              >
                <MoreHorizontal />
                <span className='sr-only'>Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              {canAssign && onAssign && (
                <DropdownMenuItem onClick={() => onAssign(row.original)}>
                  <UserPlus className='size-4' />
                  Assign
                </DropdownMenuItem>
              )}
              {showAttachments && (
                <DropdownMenuItem onClick={() => onAttachments(row.original)}>
                  <Paperclip className='size-4' />
                  Attachments
                </DropdownMenuItem>
              )}
              {showDeleteLinked && (
                <DropdownMenuItem
                  variant='destructive'
                  onClick={() => onDeleteLinkedProposal(row.original)}
                >
                  <Link2Off className='size-4' />
                  Delete Linked Proposal
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                variant='destructive'
                onClick={() => onDelete(row.original)}
              >
                <Trash2 className='size-4' />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
    size: 70,
    enableSorting: false
  }

  return [createExpanderColumn<OrderRow>(), ...dataColumns, actionsColumn]
}
