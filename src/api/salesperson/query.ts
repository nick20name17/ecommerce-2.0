import { queryOptions } from '@tanstack/react-query'

import { salespersonService } from './service'

export const SALESPERSON_QUERY_KEYS = {
  all: (projectId?: number | null) => ['salespersons', projectId] as const
}

export const getSalespersonsQuery = (projectId?: number | null) =>
  queryOptions({
    queryKey: SALESPERSON_QUERY_KEYS.all(projectId),
    queryFn: () => salespersonService.getAll({ project_id: projectId ?? undefined }),
    staleTime: Infinity
  })