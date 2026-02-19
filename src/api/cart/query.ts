import { queryOptions } from '@tanstack/react-query'

import { cartService } from './service'

export const CART_QUERY_KEYS = {
  all: () => ['cart'] as const,
  detail: (customerId: string, projectId?: number | null) =>
    [...CART_QUERY_KEYS.all(), customerId, projectId ?? ''] as const,
}

export const getCartQuery = (customerId: string, projectId?: number | null) =>
  queryOptions({
    queryKey: CART_QUERY_KEYS.detail(customerId, projectId),
    queryFn: () => cartService.get(customerId, projectId),
    enabled: !!customerId,
  })
