import { api } from '..'

import type { Order, OrderParams, OrderResponse } from './schema'

export const orderService = {
  get: async (params: OrderParams) => {
    const { data } = await api.get<OrderResponse>('/data/orders/', { params })
    return data
  },
  getById: async (id: string) => {
    const { data } = await api.get<Order>(`/data/orders/${id}/`)
    return data
  },
  delete: async (autoid: string, projectId: number) => {
    await api.delete(`/data/orders/${autoid}/`, {
      params: { project_id: projectId }
    })
  }
}
