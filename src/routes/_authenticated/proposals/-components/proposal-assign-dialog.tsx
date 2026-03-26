import { PROPOSAL_QUERY_KEYS } from '@/api/proposal/query'
import type { Proposal } from '@/api/proposal/schema'
import { proposalService } from '@/api/proposal/service'
import { MultiAssignDialog } from '@/components/common/multi-assign-dialog'

interface ProposalAssignDialogProps {
  proposal: Proposal | null
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId?: number | null
}

export const ProposalAssignDialog = ({
  proposal,
  open,
  onOpenChange,
  projectId,
}: ProposalAssignDialogProps) => {
  if (!proposal) return null

  return (
    <MultiAssignDialog
      open={open}
      onOpenChange={onOpenChange}
      entityLabel={`proposal ${proposal.quote ?? proposal.autoid}`}
      assignedUsers={proposal.assigned_users ?? (proposal.assigned_user ? [proposal.assigned_user] : [])}
      assignFn={(payload) => proposalService.assign(proposal.autoid, payload, projectId)}
      invalidateQueryKey={PROPOSAL_QUERY_KEYS.all()}
      projectId={projectId}
    />
  )
}
