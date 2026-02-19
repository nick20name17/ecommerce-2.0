import { queryOptions } from '@tanstack/react-query'

import type { CustomerParams } from './schema'
import { customerService } from './service'

export const CUSTOMER_QUERY_KEYS = {
  all: () => ['customers'] as const,
  lists: () => [...CUSTOMER_QUERY_KEYS.all(), 'list'] as const,
  list: (params: CustomerParams = {}) => [...CUSTOMER_QUERY_KEYS.lists(), params] as const,
  details: () => [...CUSTOMER_QUERY_KEYS.all(), 'detail'] as const,
  detail: (id: string) => [...CUSTOMER_QUERY_KEYS.details(), id] as const,
}

export const getCustomersQuery = (params: CustomerParams = {}) =>
  queryOptions({
    queryKey: CUSTOMER_QUERY_KEYS.list(params),
    queryFn: () => customerService.get(params),
  })
