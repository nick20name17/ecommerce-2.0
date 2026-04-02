import { api } from '..'

import type { ShipmentParams, ShipmentResponse } from './schema'

export const shipmentService = {
  get: async (params: ShipmentParams) => {
    const { data } = await api.get<ShipmentResponse>('/pick-lists/shipments/', { params })
    return data
  },
  void: async (orderAutoid: string, shipmentId: number) => {
    await api.post(`/data/orders/${orderAutoid}/shipments/${shipmentId}/void/`)
  },
}
