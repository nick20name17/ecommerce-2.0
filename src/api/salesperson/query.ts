import { queryOptions } from '@tanstack/react-query'

import { salespersonService } from './service'

export const SALESPERSON_QUERY_KEYS = {
  all: () => ['salespersons'] as const
}

export const getSalespersonsQuery = () =>
  queryOptions({
    queryKey: SALESPERSON_QUERY_KEYS.all(),
    queryFn: salespersonService.getAll,
    staleTime: Infinity
  })
