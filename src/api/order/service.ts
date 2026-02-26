import { api } from '..'

import type { EntityAttachment } from '../schema'
import type { Order, OrderParams, OrderResponse } from './schema'

function orderParams(projectId?: number | null) {
  return projectId != null ? { project_id: projectId } : {}
}

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
  },
  deleteLinkedProposal: async (autoid: string) => {
    await api.delete(`/data/orders/${autoid}/linked-proposal/`)
  },
  getAttachments: async (autoid: string, projectId?: number | null) => {
    const { data } = await api.get<EntityAttachment[]>(
      `/data/orders/${autoid}/attachments/`,
      { params: orderParams(projectId) }
    )
    return data
  },
  uploadAttachment: async (
    autoid: string,
    file: File,
    projectId?: number | null
  ) => {
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
  deleteAttachment: async (
    autoid: string,
    attachmentId: number,
    projectId?: number | null
  ) => {
    await api.delete(`/data/orders/${autoid}/attachments/${attachmentId}/`, {
      params: orderParams(projectId)
    })
  }
}
