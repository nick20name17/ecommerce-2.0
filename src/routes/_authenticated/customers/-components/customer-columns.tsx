'use no memo'

import type { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import type { Customer } from '@/api/customer/schema'
import { ColumnHeader } from '@/components/common/data-table/column-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDate, formatPhone } from '@/helpers/formatters'

interface CustomerColumnsOptions {
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
}

export const getCustomerColumns = ({
  onEdit,
  onDelete
}: CustomerColumnsOptions): ColumnDef<Customer>[] => [
  {
    accessorKey: 'id',
    header: ({ column }) => (
      <ColumnHeader
        column={column}
        title='ID'
      />
    ),
    cell: ({ row }) => <span className='font-medium'>{row.original.id}</span>,
    size: 100
  },
  {
    accessorKey: 'l_name',
    header: ({ column }) => (
      <ColumnHeader
        column={column}
        title='Name'
      />
    ),
    cell: ({ row }) => {
      const name = row.original.l_name
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className='block max-w-full truncate'>{name}</span>
          </TooltipTrigger>
          <TooltipContent>{name}</TooltipContent>
        </Tooltip>
      )
    },
    size: 220
  },
  {
    accessorKey: 'contact_1',
    header: 'Phone',
    cell: ({ row }) => {
      const phone = row.original.contact_1
      if (!phone) return <span className='text-muted-foreground'>—</span>
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className='block max-w-full truncate'>{formatPhone(phone)}</span>
          </TooltipTrigger>
          <TooltipContent>{formatPhone(phone)}</TooltipContent>
        </Tooltip>
      )
    },
    size: 160,
    enableSorting: false
  },
  {
    accessorKey: 'contact_3',
    header: 'Email',
    cell: ({ row }) => {
      const email = row.original.contact_3
      if (!email) return <span className='text-muted-foreground'>—</span>
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className='block max-w-full truncate'>{email}</span>
          </TooltipTrigger>
          <TooltipContent>{email}</TooltipContent>
        </Tooltip>
      )
    },
    size: 220,
    enableSorting: false
  },
  {
    id: 'location',
    header: 'Location',
    cell: ({ row }) => {
      const { city, state } = row.original
      if (!city && !state) return <span className='text-muted-foreground'>—</span>
      const location = [city, state].filter(Boolean).join(', ')
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className='block max-w-full truncate'>{location}</span>
          </TooltipTrigger>
          <TooltipContent>{location}</TooltipContent>
        </Tooltip>
      )
    },
    size: 160,
    enableSorting: false
  },
  {
    accessorKey: 'inactive',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.inactive ? 'outline' : 'success'}>
        {row.original.inactive ? 'Inactive' : 'Active'}
      </Badge>
    ),
    size: 100,
    enableSorting: false
  },
  {
    accessorKey: 'last_order_date',
    header: ({ column }) => (
      <ColumnHeader
        column={column}
        title='Last Order Date'
      />
    ),
    cell: ({ row }) => formatDate(row.original.last_order_date),
    size: 130
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const customer = row.original

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
              <DropdownMenuItem onClick={() => onEdit(customer)}>
                <Pencil className='size-4' />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant='destructive'
                onClick={() => onDelete(customer)}
              >
                <Trash2 className='size-4' />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
    size: 50,
    enableSorting: false
  }
]

