'use no memo'

import type { ColumnDef } from '@tanstack/react-table'
import { Link2Off, Loader2, MoreHorizontal, Paperclip, Trash2 } from 'lucide-react'

import type { Order } from '@/api/order/schema'
import { ColumnHeader } from '@/components/common/data-table/column-header'
import { createExpanderColumn } from '@/components/common/data-table/columns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getOrderStatusLabel, ORDER_STATUS_CLASS } from '@/constants/order'
import { formatCurrency, formatDate } from '@/helpers/formatters'
import { cn } from '@/lib/utils'

export type OrderRow = Order & { _pending?: true }

interface OrderColumnsOptions {
  onDelete: (order: Order) => void
  onDeleteLinkedProposal: (order: Order) => void
  onAttachments: (order: Order) => void
}

export const getOrderColumns = ({
  onDelete,
  onDeleteLinkedProposal,
  onAttachments,
}: OrderColumnsOptions): ColumnDef<OrderRow>[] => [
  createExpanderColumn<OrderRow>(),
  {
    accessorKey: 'invoice',
    header: ({ column }) => <ColumnHeader column={column} title='Invoice' />,
    cell: ({ row }) => {
      const pending = row.original._pending
      if (pending)
        return (
          <span className='text-muted-foreground flex items-center gap-2'>
            <Loader2 className='size-4 animate-spin' />
            Pending…
          </span>
        )
      const invoice = (row.original.invoice ?? '').trim()
      if (!invoice) return <span className='text-muted-foreground'>—</span>
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className='block max-w-full truncate font-medium'>{invoice}</span>
          </TooltipTrigger>
          <TooltipContent>{invoice}</TooltipContent>
        </Tooltip>
      )
    },
    size: 120,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <ColumnHeader column={column} title='Status' />,
    cell: ({ row }) => {
      if (row.original._pending)
        return (
          <Badge variant='outline' className='text-muted-foreground font-medium'>
            Creating…
          </Badge>
        )
      const status = row.original.status
      return (
        <Badge
          variant='outline'
          className={cn('font-medium', ORDER_STATUS_CLASS[status] ?? '')}
        >
          {getOrderStatusLabel(status)}
        </Badge>
      )
    },
    size: 130,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => <ColumnHeader column={column} title='Customer' />,
    cell: ({ row }) => {
      if (row.original._pending) return <span className='text-muted-foreground'>—</span>
      const name = row.original.name
      if (!name) return <span className='text-muted-foreground'>—</span>
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className='block max-w-full truncate'>{name}</span>
          </TooltipTrigger>
          <TooltipContent>{name}</TooltipContent>
        </Tooltip>
      )
    },
    size: 200,
  },
  {
    accessorKey: 'inv_date',
    header: ({ column }) => <ColumnHeader column={column} title='Order Date' />,
    cell: ({ row }) => (row.original._pending ? '—' : formatDate(row.original.inv_date)),
    size: 130,
  },
  {
    accessorKey: 'due_date',
    header: ({ column }) => <ColumnHeader column={column} title='Due Date' />,
    cell: ({ row }) => (row.original._pending ? '—' : formatDate(row.original.due_date)),
    size: 130,
  },
  {
    accessorKey: 'total',
    header: ({ column }) => <ColumnHeader column={column} title='Total' />,
    cell: ({ row }) =>
      row.original._pending ? (
        '—'
      ) : (
        <span className='font-medium'>{formatCurrency(row.original.total)}</span>
      ),
    size: 110,
  },
  {
    accessorKey: 'total_quan',
    header: ({ column }) => <ColumnHeader column={column} title='Qty' />,
    cell: ({ row }) => {
      if (row.original._pending) return '—'
      const totalQuan = parseInt(row.original.total_quan, 10) || 0
      const totalShip = parseInt(row.original.total_ship, 10) || 0
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
    size: 100,
    enableSorting: false,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      if (row.original._pending) return null
      return (
        <div
          role='group'
          className='flex justify-center'
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon-sm'>
                <MoreHorizontal />
                <span className='sr-only'>Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => onAttachments(row.original)}>
                <Paperclip className='size-4' />
                Attachments
              </DropdownMenuItem>
              {row.original.external_id && (
                <DropdownMenuItem
                  variant='destructive'
                  onClick={() => onDeleteLinkedProposal(row.original)}
                >
                  <Link2Off className='size-4' />
                  Delete Linked Proposal
                </DropdownMenuItem>
              )}
              <DropdownMenuItem variant='destructive' onClick={() => onDelete(row.original)}>
                <Trash2 className='size-4' />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
    size: 70,
    enableSorting: false,
  },
]
