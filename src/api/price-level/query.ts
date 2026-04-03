import { queryOptions } from '@tanstack/react-query'

import { priceLevelService } from './service'

export const PRICE_LEVEL_QUERY_KEYS = {
  all: () => ['price-levels'] as const,
  list: (projectId?: number | null) => [...PRICE_LEVEL_QUERY_KEYS.all(), projectId] as const
}

export const getPriceLevelsQuery = (projectId?: number | null) =>
  queryOptions({
    queryKey: PRICE_LEVEL_QUERY_KEYS.list(projectId),
    queryFn: () => priceLevelService.get(projectId),
    staleTime: Infinity
  })
