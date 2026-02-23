'use no memo'

import type { Column } from '@tanstack/react-table'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'

import { cn } from '@/lib/utils'

interface DataColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>
  title: string
}

export const ColumnHeader = <TData, TValue>({
  column,
  title
}: DataColumnHeaderProps<TData, TValue>) => {
  if (!column.getCanSort()) {
    return <span>{title}</span>
  }

  const isSorted = column.getIsSorted()

  return (
    <button
      onClick={column.getToggleSortingHandler()}
      className={cn(
        'inline-flex size-full cursor-pointer items-center justify-between gap-1.5 whitespace-nowrap transition-colors',
        'hover:text-foreground focus-visible:outline-0 disabled:pointer-events-none',
        '[&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0',
        isSorted ? 'text-foreground' : 'text-muted-foreground'
      )}
    >
      <span className='truncate'>{title}</span>
      {isSorted === 'desc' ? (
        <ChevronDown className='text-primary' />
      ) : isSorted === 'asc' ? (
        <ChevronUp className='text-primary' />
      ) : (
        <ChevronsUpDown className='opacity-50' />
      )}
    </button>
  )
}
