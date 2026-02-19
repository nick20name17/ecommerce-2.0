import { api } from '..'
import type { Cart } from '../product/schema'

import type { AddToCartPayload, UpdateCartItemPayload } from './schema'

function buildParams(customerId: string, projectId?: number | null) {
  const params: Record<string, string> = { customer_id: customerId }
  if (projectId != null) params.project_id = projectId.toString()
  return params
}

export const cartService = {
  get: async (customerId: string, projectId?: number | null) => {
    const { data } = await api.get<Cart>('/cart/', { params: buildParams(customerId, projectId) })
    return data
  },

  addItem: async (
    payload: AddToCartPayload,
    customerId: string,
    projectId?: number | null
  ) => {
    const { data } = await api.post<Cart>('/cart/', payload, {
      params: buildParams(customerId, projectId),
    })
    return data
  },

  updateItem: async (
    itemId: number,
    payload: UpdateCartItemPayload,
    customerId: string,
    projectId?: number | null
  ) => {
    const { data } = await api.patch<Cart>(`/cart/${itemId}/`, payload, {
      params: buildParams(customerId, projectId),
    })
    return data
  },

  deleteItem: async (itemId: number, customerId: string, projectId?: number | null) => {
    const { data } = await api.delete<Cart>(`/cart/${itemId}/`, {
      params: buildParams(customerId, projectId),
    })
    return data
  },

  flush: async (customerId: string, projectId?: number | null) => {
    await api.delete('/cart/', {
      params: buildParams(customerId, projectId),
      data: { flush: true },
    })
  },

  submitProposal: async (customerId: string, projectId?: number | null) => {
    const { data } = await api.post('/cart/proposal/', null, {
      params: buildParams(customerId, projectId),
    })
    return data
  },

  submitOrder: async (customerId: string, projectId?: number | null) => {
    const { data } = await api.post('/cart/order/', null, {
      params: buildParams(customerId, projectId),
    })
    return data
  },
}
