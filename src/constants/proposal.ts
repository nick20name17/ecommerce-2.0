export const PROPOSAL_STATUS = {
  open: 'O',
  accepted: 'A',
  lost: 'L',
  cancelled: 'C',
  expired: 'E',
  new: 'N',
  onHold: 'H',
} as const

export type ProposalStatus =
  (typeof PROPOSAL_STATUS)[keyof typeof PROPOSAL_STATUS]

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  [PROPOSAL_STATUS.open]: 'Open',
  [PROPOSAL_STATUS.accepted]: 'Accepted',
  [PROPOSAL_STATUS.lost]: 'Lost',
  [PROPOSAL_STATUS.cancelled]: 'Cancelled',
  [PROPOSAL_STATUS.expired]: 'Expired',
  [PROPOSAL_STATUS.new]: 'New',
  [PROPOSAL_STATUS.onHold]: 'On Hold',
}

export function getProposalStatusLabel(status: ProposalStatus): string {
  return PROPOSAL_STATUS_LABELS[status] ?? status
}

export type ProposalStatusBadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'success'
  | 'outline'

export function getProposalStatusBadgeVariant(
  status: ProposalStatus
): ProposalStatusBadgeVariant {
  switch (status) {
    case PROPOSAL_STATUS.accepted:
      return 'success'
    case PROPOSAL_STATUS.lost:
    case PROPOSAL_STATUS.cancelled:
      return 'destructive'
    case PROPOSAL_STATUS.expired:
    case PROPOSAL_STATUS.onHold:
      return 'secondary'
    case PROPOSAL_STATUS.open:
    case PROPOSAL_STATUS.new:
    default:
      return 'default'
  }
}
