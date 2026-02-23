import { api } from '..'

import type { ProposalParams, ProposalResponse } from './schema'

export const proposalService = {
  get: async (params: ProposalParams = {}) => {
    const { data } = await api.get<ProposalResponse>('/data/proposals/', { params })
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
  }
}
