import type { ProposalStatus } from '@/constants/proposal'

import type { PaginatedResponse, PaginationParams } from '@/api/schema'

export type { ProposalStatus } from '@/constants/proposal'

export interface Proposal {
  autoid: string
  b_id: string
  quote: string
  b_name: string
  qt_date: string | null
  status: ProposalStatus
  tax: string
  subtotal: string
  total: string
  items?: ProposalItem[]
}

export interface ProposalItem {
  autoid: string
  inven: string
  doc_aid: string
  quan: string
  descr: string
  amount: string
}

export type ProposalResponse = PaginatedResponse<Proposal>

export interface ProposalParams extends PaginationParams {
  search?: string
  ordering?: string
  status?: ProposalStatus
  project_id?: number
}
