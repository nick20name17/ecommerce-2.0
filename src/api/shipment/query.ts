import { queryOptions } from '@tanstack/react-query'

import type { ShipmentParams } from './schema'
import { shipmentService } from './service'

export const SHIPMENT_QUERY_KEYS = {
  all: () => ['shipments'] as const,
  lists: () => [...SHIPMENT_QUERY_KEYS.all(), 'list'] as const,
  list: (params: ShipmentParams = {}) => [...SHIPMENT_QUERY_KEYS.lists(), params] as const,
}

export const getShipmentsQuery = (params: ShipmentParams = {}) =>
  queryOptions({
    queryKey: SHIPMENT_QUERY_KEYS.list(params),
    queryFn: () => shipmentService.get(params),
  })
