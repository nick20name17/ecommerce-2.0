import { api } from '..'

import type { PickingOrdersParams, PickingOrdersResponse } from './schema'

export const ordersForPickingService = {
  get: async (params?: PickingOrdersParams) => {
    const { data } = await api.get<PickingOrdersResponse>('/data/orders-for-picking/', {
      params,
    })
    return data
  },
}
