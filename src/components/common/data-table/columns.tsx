'use no memo'

import type { AccessorKeyColumnDef, Row, Table } from '@tanstack/react-table'
import { ChevronDown, ChevronUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

export const createCheckboxColumn = <TData,>({
  disabled
}: { disabled?: boolean } = {}): AccessorKeyColumnDef<TData> => ({
  accessorKey: 'checkbox',
  header: ({ table }: { table: Table<TData> }) => (
    <div className='flex items-center justify-center'>
      <Checkbox
        disabled={disabled}
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
      />
    </div>
  ),
  cell: ({ row }: { row: Row<TData> }) => (
    <div
      className='flex items-center justify-center'
      id='checkbox'
    >
      <Checkbox
        disabled={disabled}
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
      />
    </div>
  ),
  size: 40,
  enableResizing: false,
  enableSorting: false,
  enableHiding: false
})

export const createExpanderColumn = <TData,>(): AccessorKeyColumnDef<TData> => ({
  accessorKey: 'expander',
  header: () => null,
  cell: ({ row }: { row: Row<TData> }) =>
    row.getCanExpand() ? (
      <div className='flex items-center justify-center'>
        <Button
          id='expander'
          className='size-7'
          size='icon-sm'
          variant='ghost'
          onClick={row.getToggleExpandedHandler()}
        >
          {row.getIsExpanded() ? <ChevronUp /> : <ChevronDown />}
        </Button>
      </div>
    ) : null,
  size: 40,
  enableResizing: false,
  enableSorting: false,
  enableHiding: false
})
