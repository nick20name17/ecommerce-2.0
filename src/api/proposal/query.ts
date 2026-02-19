import { queryOptions } from '@tanstack/react-query'

import type { ProposalParams } from './schema'
import { proposalService } from './service'

export const PROPOSAL_QUERY_KEYS = {
  all: () => ['proposals'] as const,
  lists: () => [...PROPOSAL_QUERY_KEYS.all(), 'list'] as const,
  list: (params: ProposalParams = {}) => [...PROPOSAL_QUERY_KEYS.lists(), params] as const,
}

export const getProposalsQuery = (params: ProposalParams = {}) =>
  queryOptions({
    queryKey: PROPOSAL_QUERY_KEYS.list(params),
    queryFn: () => proposalService.get(params),
  })
