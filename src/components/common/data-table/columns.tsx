'use no memo'

import type { AccessorKeyColumnDef, Row } from '@tanstack/react-table'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'

export const createExpanderColumn = <TData,>(): AccessorKeyColumnDef<TData> => ({
  accessorKey: 'expander',
  header: () => null,
  cell: ({ row }: { row: Row<TData> }) =>
    row.getCanExpand() ? (
      <div className='flex items-center justify-center'>
        <button
          type='button'
          className='inline-flex size-6 items-center justify-center rounded-[5px] text-text-tertiary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground'
          onClick={row.getToggleExpandedHandler()}
        >
          <ChevronDown
            className={cn(
              'size-3.5 transition-transform duration-100',
              row.getIsExpanded() && '-rotate-180'
            )}
          />
        </button>
      </div>
    ) : null,
  size: 40,
  enableResizing: false,
  enableSorting: false,
  enableHiding: false
})
