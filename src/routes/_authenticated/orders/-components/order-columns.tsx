'use no memo'

import type { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import type { Order, OrderStatus } from '@/api/order/schema'
import { ColumnHeader } from '@/components/common/data-table/column-header'
import { createCheckboxColumn } from '@/components/common/data-table/columns'
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

export const getOrderColumns = (): ColumnDef<Order>[] => [
  createExpanderColumn<Order>(),
  createCheckboxColumn<Order>(),
  {
    accessorKey: 'id',
    header: ({ column }) => <ColumnHeader column={column} title='Invoice' />,
    cell: ({ row }) => <span className='font-medium'>{row.original.id}</span>,
    size: 120,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <ColumnHeader column={column} title='Status' />,
    cell: ({ row }) => {
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
    cell: ({ row }) => formatDate(row.original.inv_date),
    size: 130,
  },
  {
    accessorKey: 'due_date',
    header: ({ column }) => <ColumnHeader column={column} title='Due Date' />,
    cell: ({ row }) => formatDate(row.original.due_date),
    size: 130,
  },
  {
    accessorKey: 'total',
    header: ({ column }) => <ColumnHeader column={column} title='Total' />,
    cell: ({ row }) => <span className='font-medium'>{formatCurrency(row.original.total)}</span>,
    size: 110,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <div onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size='icon-sm'>
              <MoreHorizontal />
              <span className='sr-only'>Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem disabled title='Coming soon'>
              <Pencil />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem disabled variant='destructive' title='Coming soon'>
              <Trash2 />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
    size: 70,
    enableSorting: false,
  },
]
