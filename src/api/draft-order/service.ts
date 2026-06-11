import { api } from '..'

import type {
  DraftOrder,
  DraftOrderListParams,
  DraftOrderListResponse,
  UpdateDraftOrderPayload
} from './schema'

const params = (projectId?: number | null) => (projectId != null ? { project_id: projectId } : {})

export const draftOrderService = {
  /** Upload 1..20 documents — one DraftOrder per file, each queued for extraction. */
  upload: async (files: File[], projectId?: number | null) => {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    const { data } = await api.post<DraftOrder[]>('/data/draft-orders/upload/', formData, {
      params: params(projectId),
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  list: async (filters: DraftOrderListParams = {}, projectId?: number | null) => {
    const query: Record<string, unknown> = { ...params(projectId) }
    if (filters.status) query.status = filters.status
    if (filters.limit != null) query.limit = filters.limit
    if (filters.offset != null) query.offset = filters.offset
    const { data } = await api.get<DraftOrderListResponse>('/data/draft-orders/', {
      params: query
    })
    return data
  },

  getById: async (id: number, projectId?: number | null) => {
    const { data } = await api.get<DraftOrder>(`/data/draft-orders/${id}/`, {
      params: params(projectId)
    })
    return data
  },

  update: async (id: number, payload: UpdateDraftOrderPayload, projectId?: number | null) => {
    const { data } = await api.patch<DraftOrder>(`/data/draft-orders/${id}/`, payload, {
      params: params(projectId)
    })
    return data
  },

  /** Reset error + re-enqueue the extraction task. Allowed when status in (failed, ready). */
  retry: async (id: number, projectId?: number | null) => {
    const { data } = await api.post<DraftOrder>(`/data/draft-orders/${id}/retry/`, null, {
      params: params(projectId)
    })
    return data
  },

  /** Create the real EBMS order from the reviewed draft. Allowed when status == ready. */
  confirm: async (id: number, projectId?: number | null) => {
    const { data } = await api.post<{ AUTOID: string }>(`/data/draft-orders/${id}/confirm/`, null, {
      params: params(projectId)
    })
    return data
  },

  delete: async (id: number, projectId?: number | null) => {
    await api.delete(`/data/draft-orders/${id}/`, {
      params: params(projectId)
    })
  }
}
