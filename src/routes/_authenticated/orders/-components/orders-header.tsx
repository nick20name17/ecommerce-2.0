import { ArrowDown, ArrowUp } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { OrderSortField, SortDir } from './orders-constants'

// ── Sortable Header ─────────────────────────────────────────

export function OrderSortableHeader({
  field,
  label,
  sortField,
  sortDir,
  onSort,
  className
}: {
  field: OrderSortField
  label: string
  sortField: OrderSortField | null
  sortDir: SortDir
  onSort: (field: OrderSortField) => void
  className?: string
}) {
  const active = sortField === field
  return (
    <button
      type='button'
      className={cn(
        'group hover:text-foreground inline-flex items-center gap-1 text-left transition-colors duration-[80ms]',
        active && 'text-foreground',
        className
      )}
      onClick={() => onSort(field)}
    >
      {label}
      {active ? (
        sortDir === 'asc' ? (
          <ArrowUp className='size-3' />
        ) : (
          <ArrowDown className='size-3' />
        )
      ) : (
        <ArrowUp className='size-3 opacity-30 transition-opacity group-hover:opacity-60' />
      )}
    </button>
  )
}
