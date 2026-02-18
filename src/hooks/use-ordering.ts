import type { SortingState } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

export function useOrdering() {
  const [sorting, setSorting] = useState<SortingState>([])

  const ordering = useMemo(() => {
    if (!sorting.length) return undefined
    const sort = sorting[0]
    return sort.desc ? `-${sort.id}` : sort.id
  }, [sorting])

  return { sorting, setSorting, ordering } as const
}
