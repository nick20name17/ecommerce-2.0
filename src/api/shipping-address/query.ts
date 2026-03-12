import { queryOptions } from '@tanstack/react-query'

import { shippingAddressService } from './service'

export const SHIPPING_ADDRESS_QUERY_KEYS = {
  all: () => ['shipping-addresses'] as const,
  list: (projectId?: number | null) => [...SHIPPING_ADDRESS_QUERY_KEYS.all(), projectId] as const,
}

export const getShippingAddressesQuery = (projectId?: number | null) =>
  queryOptions({
    queryKey: SHIPPING_ADDRESS_QUERY_KEYS.list(projectId),
    queryFn: () => shippingAddressService.getAll(projectId),
    enabled: projectId != null,
  })
