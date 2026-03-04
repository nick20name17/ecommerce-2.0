'use no memo'

import type { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash2, UserPlus } from 'lucide-react'

import type { Customer } from '@/api/customer/schema'
import type { FieldConfigResponse } from '@/api/field-config/schema'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  buildDynamicDataColumns,
  getColumnLabel,
  getOrderedDataKeys
} from '@/helpers/dynamic-columns'
import type { DynamicCellFormatter } from '@/helpers/dynamic-columns'
import { formatDate, formatPhone } from '@/helpers/formatters'

const CUSTOMER_FORMATTERS: Partial<Record<string, DynamicCellFormatter<Customer>>> = {
  contact_1: (v) =>
    v ? (
      <span className='block max-w-full truncate'>{formatPhone(String(v))}</span>
    ) : (
      <span className='text-muted-foreground'>—</span>
    ),
  last_order_date: (v) => <span>{formatDate(v as string | null | undefined)}</span>,
  inactive: (v) => {
    const inactive = v === true
    return (
      <Badge variant={inactive ? 'outline' : 'success'}>{inactive ? 'Inactive' : 'Active'}</Badge>
    )
  }
}

interface CustomerColumnsOptions {
  fieldConfig: FieldConfigResponse | null | undefined
  data: Customer[]
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
  onAssign?: (customer: Customer) => void
  canAssign?: boolean
}

export function getCustomerColumns({
  fieldConfig,
  data,
  onEdit,
  onDelete,
  onAssign,
  canAssign
}: CustomerColumnsOptions): ColumnDef<Customer>[] {
  const entity = 'customer'
  const orderedKeys = getOrderedDataKeys(data, entity, fieldConfig)
  const getLabel = (key: string) => getColumnLabel(key, entity, fieldConfig)
  const dataColumns = buildDynamicDataColumns<Customer>(orderedKeys, getLabel, {
    formatters: CUSTOMER_FORMATTERS
  })

  const actionsColumn: ColumnDef<Customer> = {
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
              {canAssign && onAssign && (
                <DropdownMenuItem onClick={() => onAssign(customer)}>
                  <UserPlus className='size-4' />
                  Assign
                </DropdownMenuItem>
              )}
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

  return [...dataColumns, actionsColumn]
}
