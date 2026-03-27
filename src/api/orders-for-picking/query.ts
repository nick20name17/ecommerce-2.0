import { queryOptions } from '@tanstack/react-query'

import type { PickingOrdersParams } from './schema'
import { ordersForPickingService } from './service'

export const PICKING_QUERY_KEYS = {
  all: () => ['orders-for-picking'] as const,
  lists: () => [...PICKING_QUERY_KEYS.all(), 'list'] as const,
  list: (params?: PickingOrdersParams) => [...PICKING_QUERY_KEYS.lists(), params] as const,
}

export const getOrdersForPickingQuery = (params?: PickingOrdersParams) =>
  queryOptions({
    queryKey: PICKING_QUERY_KEYS.list(params),
    queryFn: () => ordersForPickingService.get(params),
  })
