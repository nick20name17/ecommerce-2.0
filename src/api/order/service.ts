import { api } from '..'

import type { EntityAssignRequest, EntityAssignmentResponse, EntityAttachment } from '../schema'

import type { Order, OrderParams, OrderPatchPayload, OrderResponse, PickStatusRequest, ShippingRatesRequest, ShippingRatesResponse } from './schema'

const orderParams = (projectId?: number | null) =>
  projectId != null ? { project_id: projectId } : {}

export const orderService = {
  get: async (params: OrderParams) => {
    const { data } = await api.get<OrderResponse>('/data/orders/', { params })
    return data
  },
  getById: async (id: string, projectId?: number | null) => {
    const { data } = await api.get<Order>(`/data/orders/${id}/`, {
      params: orderParams(projectId)
    })
    return data
  },
  patch: async (autoid: string, payload: OrderPatchPayload, projectId?: number | null) => {
    const { data } = await api.patch<Order>(`/data/orders/${autoid}/`, payload, {
      params: orderParams(projectId),
    })
    return data
  },
  delete: async (autoid: string, projectId: number) => {
    await api.delete(`/data/orders/${autoid}/`, {
      params: { project_id: projectId }
    })
  },
  deleteLinkedProposal: async (autoid: string) => {
    await api.delete(`/data/orders/${autoid}/linked-proposal/`)
  },
  getAttachments: async (autoid: string, projectId?: number | null) => {
    const { data } = await api.get<EntityAttachment[]>(`/data/orders/${autoid}/attachments/`, {
      params: orderParams(projectId)
    })
    return data
  },
  uploadAttachment: async (autoid: string, file: File, projectId?: number | null) => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await api.post<EntityAttachment>(
      `/data/orders/${autoid}/attachments/`,
      formData,
      {
        params: orderParams(projectId),
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    )
    return data
  },
  deleteAttachment: async (autoid: string, attachmentId: number, projectId?: number | null) => {
    await api.delete(`/data/orders/${autoid}/attachments/${attachmentId}/`, {
      params: orderParams(projectId)
    })
  },

  setItemPickStatus: async (autoid: string, itemAutoid: string, payload: PickStatusRequest, projectId?: number | null) => {
    await api.patch(`/data/orders/${autoid}/items/${itemAutoid}/pick/`, payload, {
      params: orderParams(projectId),
    })
  },

  getShippingRates: async (autoid: string, payload: ShippingRatesRequest) => {
    const { data } = await api.post<ShippingRatesResponse>(
      `/data/orders/${autoid}/shipping-rates/`,
      payload
    )
    return data
  },

  assign: async (autoid: string, payload: EntityAssignRequest, projectId?: number | null) => {
    const { data } = await api.post<EntityAssignmentResponse>(
      `/data/orders/${autoid}/assign/`,
      payload,
      { params: orderParams(projectId) }
    )
    return data
  }
}
