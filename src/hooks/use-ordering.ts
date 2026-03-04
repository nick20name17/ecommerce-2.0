import type { SortingState } from '@tanstack/react-table'
import { useState } from 'react'

export const useOrdering = () => {
  const [sorting, setSorting] = useState<SortingState>([])

  const ordering = !sorting.length
    ? undefined
    : sorting[0]!.desc
      ? `-${sorting[0].id}`
      : sorting[0].id

  return { sorting, setSorting, ordering } as const
}
