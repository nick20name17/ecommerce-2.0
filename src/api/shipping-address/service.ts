import { api } from '..'

import type { ShippingAddress, ShippingAddressPayload } from './schema'

const projectParams = (projectId?: number | null) =>
  projectId != null ? { project_id: projectId } : {}

export const shippingAddressService = {
  getAll: async (projectId?: number | null) => {
    const { data } = await api.get<{ results: ShippingAddress[] } | ShippingAddress[]>('/data/shipping-addresses/', {
      params: projectParams(projectId),
    })
    // API may return { results: [...] } or a flat array
    return Array.isArray(data) ? data : data.results
  },

  getById: async (id: number, projectId?: number | null) => {
    const { data } = await api.get<ShippingAddress>(`/data/shipping-addresses/${id}/`, {
      params: projectParams(projectId),
    })
    return data
  },

  create: async (payload: ShippingAddressPayload, projectId?: number | null) => {
    const { data } = await api.post<ShippingAddress>('/data/shipping-addresses/', payload, {
      params: projectParams(projectId),
    })
    return data
  },

  update: async (id: number, payload: Partial<ShippingAddressPayload>, projectId?: number | null) => {
    const { data } = await api.patch<ShippingAddress>(`/data/shipping-addresses/${id}/`, payload, {
      params: projectParams(projectId),
    })
    return data
  },

  delete: async (id: number, projectId?: number | null) => {
    await api.delete(`/data/shipping-addresses/${id}/`, {
      params: projectParams(projectId),
    })
  },
}
