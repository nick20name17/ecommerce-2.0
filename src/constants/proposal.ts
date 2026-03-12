export const PROPOSAL_STATUS = {
  open: 'O',
  accepted: 'A',
  lost: 'L',
  cancelled: 'C',
  expired: 'E',
  new: 'N',
  onHold: 'H'
} as const

export type ProposalStatus = (typeof PROPOSAL_STATUS)[keyof typeof PROPOSAL_STATUS]

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  [PROPOSAL_STATUS.open]: 'Open',
  [PROPOSAL_STATUS.accepted]: 'Accepted',
  [PROPOSAL_STATUS.lost]: 'Lost',
  [PROPOSAL_STATUS.cancelled]: 'Cancelled',
  [PROPOSAL_STATUS.expired]: 'Expired',
  [PROPOSAL_STATUS.new]: 'New',
  [PROPOSAL_STATUS.onHold]: 'On Hold'
}

export const PROPOSAL_STATUS_CLASS: Record<ProposalStatus, string> = {
  [PROPOSAL_STATUS.open]:
    'border-blue-300 bg-blue-500/10 text-blue-800 dark:border-blue-600 dark:bg-blue-500/20 dark:text-blue-300',
  [PROPOSAL_STATUS.accepted]:
    'border-green-300 bg-green-500/10 text-green-800 dark:border-green-600 dark:bg-green-500/20 dark:text-green-300',
  [PROPOSAL_STATUS.lost]:
    'border-red-300 bg-red-500/10 text-red-800 dark:border-red-600 dark:bg-red-500/20 dark:text-red-300',
  [PROPOSAL_STATUS.cancelled]:
    'border-slate-300 bg-slate-500/10 text-slate-700 dark:border-slate-600 dark:bg-slate-500/20 dark:text-slate-300',
  [PROPOSAL_STATUS.expired]:
    'border-amber-300 bg-amber-500/10 text-amber-800 dark:border-amber-600 dark:bg-amber-500/20 dark:text-amber-300',
  [PROPOSAL_STATUS.new]:
    'border-violet-300 bg-violet-500/10 text-violet-800 dark:border-violet-600 dark:bg-violet-500/20 dark:text-violet-300',
  [PROPOSAL_STATUS.onHold]:
    'border-slate-300 bg-slate-500/10 text-slate-700 dark:border-slate-600 dark:bg-slate-500/20 dark:text-slate-300',
}

export const getProposalStatusLabel = (status: ProposalStatus): string =>
  PROPOSAL_STATUS_LABELS[status] ?? status


