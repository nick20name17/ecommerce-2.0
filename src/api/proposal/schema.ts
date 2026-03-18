import type { AssignedUser } from '@/api/schema'
import type { PaginatedResponse, PaginationParams } from '@/api/schema'
import type { ProposalStatus } from '@/constants/proposal'

export type { ProposalStatus } from '@/constants/proposal'

export interface Proposal {
  autoid: string
  b_id: string
  quote: string
  b_name: string
  qt_date: string | null
  status: ProposalStatus
  descr: string
  tax: string
  tot_tax: string
  subtotal: string
  total: string
  items?: ProposalItem[]
  assigned_user?: AssignedUser | null
  [key: string]: unknown
}

export interface ProposalItem {
  autoid: string
  inven: string
  doc_aid: string
  arqt_aid: string
  quan: string
  unit: string
  descr: string
  amount: string
  [key: string]: unknown
}

export interface ToOrderResponse {
  AUTOID: string
  INVOICE: string
  ID: string
  C_ID: string
  TOTAL: string
  SUBTOTAL: string
  STATUS: string
  WEBSALE: boolean
}

export type ProposalResponse = PaginatedResponse<Proposal>

export interface ProposalParams extends PaginationParams {
  search?: string
  autoid?: string
  ordering?: string
  status?: string
  project_id?: number
  b_id?: string
  notes?: boolean
}
