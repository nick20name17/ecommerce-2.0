import { api } from '..'

import type { OrderParams, OrderResponse } from './schema'

export const orderService = {
  get: async (params: OrderParams) => {
    const { data } = await api.get<OrderResponse>('/data/orders/', { params })
    return data
  },
}
