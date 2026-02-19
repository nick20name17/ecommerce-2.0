import { api } from '..'

import type { Proposal, ProposalParams, ProposalResponse } from './schema'

export const proposalService = {
  get: async (params: ProposalParams = {}) => {
    const { data } = await api.get<ProposalResponse>('/data/proposals/', { params })
    return data
  }
}
