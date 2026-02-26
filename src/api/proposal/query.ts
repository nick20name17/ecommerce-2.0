import { queryOptions } from '@tanstack/react-query'

import type { ProposalParams } from './schema'
import { proposalService } from './service'

export const PROPOSAL_QUERY_KEYS = {
  all: () => ['proposals'] as const,
  lists: () => [...PROPOSAL_QUERY_KEYS.all(), 'list'] as const,
  list: (params: ProposalParams = {}) => [...PROPOSAL_QUERY_KEYS.lists(), params] as const,
  details: () => [...PROPOSAL_QUERY_KEYS.all(), 'detail'] as const,
  detail: (autoid: string) => [...PROPOSAL_QUERY_KEYS.details(), autoid] as const,
  attachments: (autoid: string) =>
    [...PROPOSAL_QUERY_KEYS.all(), 'attachments', autoid] as const,
}

export const getProposalsQuery = (params: ProposalParams = {}) =>
  queryOptions({
    queryKey: PROPOSAL_QUERY_KEYS.list(params),
    queryFn: () => proposalService.get(params),
  })

export const getProposalDetailQuery = (autoid: string, projectId?: number | null) =>
  queryOptions({
    queryKey: PROPOSAL_QUERY_KEYS.detail(autoid),
    queryFn: () => proposalService.getById(autoid, projectId),
    enabled: !!autoid,
  })

export const getProposalAttachmentsQuery = (
  autoid: string,
  projectId?: number | null
) =>
  queryOptions({
    queryKey: PROPOSAL_QUERY_KEYS.attachments(autoid),
    queryFn: () => proposalService.getAttachments(autoid, projectId),
    enabled: !!autoid,
  })
