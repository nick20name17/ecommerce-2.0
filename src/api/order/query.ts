import { queryOptions } from '@tanstack/react-query'

import type { OrderParams } from './schema'
import { orderService } from './service'

export const ORDER_QUERY_KEYS = {
  all: () => ['orders'] as const,
  lists: () => [...ORDER_QUERY_KEYS.all(), 'list'] as const,
  list: (params: OrderParams = {}) => [...ORDER_QUERY_KEYS.lists(), params] as const,
}

export const getOrdersQuery = (params: OrderParams = {}) =>
  queryOptions({
    queryKey: ORDER_QUERY_KEYS.list(params),
    queryFn: () => orderService.get(params),
  })
