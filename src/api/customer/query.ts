import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

import type { CustomerParams } from './schema'
import { customerService } from './service'

export const CUSTOMER_QUERY_KEYS = {
  all: () => ['customers'] as const,
  lists: () => [...CUSTOMER_QUERY_KEYS.all(), 'list'] as const,
  list: (params: CustomerParams = {}) => [...CUSTOMER_QUERY_KEYS.lists(), params] as const,
  details: () => [...CUSTOMER_QUERY_KEYS.all(), 'detail'] as const,
  detail: (id: string) => [...CUSTOMER_QUERY_KEYS.details(), id] as const
}

export const getCustomersQuery = (params: CustomerParams = {}) =>
  queryOptions({
    queryKey: CUSTOMER_QUERY_KEYS.list(params),
    queryFn: () => customerService.get(params)
  })

export const getCustomersInfiniteQuery = (params: Omit<CustomerParams, 'offset'>) =>
  infiniteQueryOptions({
    queryKey: [...CUSTOMER_QUERY_KEYS.lists(), 'infinite', params] as const,
    queryFn: ({ pageParam = 0 }) => customerService.get({ ...params, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (!lastPage.next) return undefined
      return (lastPageParam as number) + (params.limit ?? 50)
    },
  })

export const getCustomerDetailQuery = (id: string, projectId?: number | null) =>
  queryOptions({
    queryKey: [...CUSTOMER_QUERY_KEYS.detail(id), projectId] as const,
    queryFn: () =>
      customerService.getById(id, projectId != null ? { project_id: projectId } : undefined)
  })
