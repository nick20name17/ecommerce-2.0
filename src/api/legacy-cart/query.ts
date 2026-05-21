import { queryOptions } from '@tanstack/react-query'

import type { LegacyCartParams } from './schema'
import { legacyCartService } from './service'

export const LEGACY_CART_QUERY_KEYS = {
  all: () => ['legacy-carts'] as const,
  lists: () => [...LEGACY_CART_QUERY_KEYS.all(), 'list'] as const,
  list: (params: LegacyCartParams = {}) =>
    [...LEGACY_CART_QUERY_KEYS.lists(), params] as const
}

export const getLegacyCartsQuery = (params: LegacyCartParams = {}) =>
  queryOptions({
    queryKey: LEGACY_CART_QUERY_KEYS.list(params),
    queryFn: () => legacyCartService.get(params)
  })
