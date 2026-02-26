'use no memo'

import type { AccessorKeyColumnDef, Row } from '@tanstack/react-table'
import { ChevronDown, ChevronUp } from 'lucide-react'

import { Button } from '@/components/ui/button'

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
