'use no memo'

import type { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash2, UserPlus } from 'lucide-react'

import type { Customer } from '@/api/customer/schema'
import type { FieldConfigResponse } from '@/api/field-config/schema'
import { EntityNotesTrigger } from '@/components/common/entity-notes/entity-notes-trigger'
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
      <span className='text-text-tertiary'>—</span>
    ),
  last_order_date: (v) => <span>{formatDate(v as string | null | undefined)}</span>
}

interface CustomerColumnsOptions {
  fieldConfig: FieldConfigResponse | null | undefined
  data: Customer[]
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
  onNotes?: (customer: Customer) => void
  onAssign?: (customer: Customer) => void
  canAssign?: boolean
}

export const getCustomerColumns = ({
  fieldConfig,
  data,
  onEdit,
  onDelete,
  onNotes,
  onAssign,
  canAssign
}: CustomerColumnsOptions): ColumnDef<Customer>[] => {
  const entity = 'customer'
  const orderedKeys = getOrderedDataKeys(data, entity, fieldConfig)
  const getLabel = (key: string) => getColumnLabel(key, entity, fieldConfig)
  const dataColumns = buildDynamicDataColumns<Customer>(orderedKeys, getLabel, {
    formatters: CUSTOMER_FORMATTERS
  })

  const notesColumn: ColumnDef<Customer> = {
    id: 'notes',
    header: 'Notes',
    cell: ({ row }) => {
      if (!onNotes) return null
      return (
        <div
          className='max-w-[140px] min-w-0'
          role='button'
          tabIndex={0}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && e.stopPropagation()}
        >
          <EntityNotesTrigger
            entityType='customer'
            autoid={row.original.autoid}
            onClick={() => onNotes(row.original)}
          />
        </div>
      )
    },
    size: 140,
    enableSorting: false
  }

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

  return [...dataColumns, notesColumn, actionsColumn]
}
