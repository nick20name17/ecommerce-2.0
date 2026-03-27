import { api } from '..'

import type { ShipmentParams, ShipmentRecord } from './schema'

export const shipmentService = {
  get: async (params: ShipmentParams): Promise<ShipmentRecord[]> => {
    const { data } = await api.get<ShipmentRecord[]>('/pick-lists/shipments/', { params })
    return Array.isArray(data) ? data : []
  },
  void: async (orderAutoid: string, shipmentId: number) => {
    await api.post(`/data/orders/${orderAutoid}/shipments/${shipmentId}/void/`)
  },
}
