import { api } from '..'

import type { EntityAttachment } from '../schema'
import type { Proposal, ProposalParams, ProposalResponse } from './schema'

function proposalParams(projectId?: number | null) {
  return projectId != null ? { project_id: projectId } : {}
}

export const proposalService = {
  get: async (params: ProposalParams = {}) => {
    const { data } = await api.get<ProposalResponse>('/data/proposals/', { params })
    return data
  },
  getById: async (autoid: string, projectId?: number | null) => {
    const { data } = await api.get<Proposal>(`/data/proposals/${autoid}/`, {
      params: proposalParams(projectId)
    })
    return data
  },
  delete: async (autoid: string, projectId: number) => {
    await api.delete(`/data/proposals/${autoid}/`, {
      params: { project_id: projectId }
    })
  },
  toOrder: async (autoid: string, projectId: number) => {
    const { data } = await api.post(`/data/proposals/${autoid}/to-order/`, null, {
      params: { project_id: projectId }
    })
    return data
  },
  getAttachments: async (autoid: string, projectId?: number | null) => {
    const { data } = await api.get<EntityAttachment[]>(
      `/data/proposals/${autoid}/attachments/`,
      { params: proposalParams(projectId) }
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
      `/data/proposals/${autoid}/attachments/`,
      formData,
      {
        params: proposalParams(projectId),
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
    await api.delete(`/data/proposals/${autoid}/attachments/${attachmentId}/`, {
      params: proposalParams(projectId)
    })
  }
}
