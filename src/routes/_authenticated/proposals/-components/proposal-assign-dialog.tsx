import { useMutation } from '@tanstack/react-query'
import { UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'

import { PROPOSAL_QUERY_KEYS } from '@/api/proposal/query'
import type { Proposal } from '@/api/proposal/schema'
import { proposalService } from '@/api/proposal/service'
import { UserCombobox } from '@/components/common/user-combobox/user-combobox'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

interface ProposalAssignDialogProps {
  proposal: Proposal | null
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId?: number | null
}

export function ProposalAssignDialog({
  proposal,
  open,
  onOpenChange,
  projectId
}: ProposalAssignDialogProps) {
  const currentUserId = proposal?.assigned_user?.id ?? null
  const [selectedUserId, setSelectedUserId] = useState<number | null>(currentUserId)

  useEffect(() => {
    if (open && proposal) setSelectedUserId(currentUserId)
  }, [open, proposal, currentUserId])

  const assignMutation = useMutation({
    mutationFn: ({ autoid, userId }: { autoid: string; userId: number | null }) =>
      proposalService.assign(autoid, { user_id: userId }, projectId ?? undefined),
    meta: {
      successMessage: 'Proposal assigned successfully',
      invalidatesQuery: PROPOSAL_QUERY_KEYS.all()
    },
    onSuccess: () => {
      onOpenChange(false)
    }
  })

  const handleConfirm = () => {
    if (!proposal) return
    assignMutation.mutate({ autoid: proposal.autoid, userId: selectedUserId })
  }

  if (!proposal) return null

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setSelectedUserId(currentUserId)
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <UserPlus className='size-5' />
            Assign user
          </DialogTitle>
        </DialogHeader>
        <DialogBody className='flex flex-col gap-4'>
          <p className='text-muted-foreground text-sm'>
            Assign a responsible user for proposal{' '}
            <span className='text-foreground font-medium'>{proposal.quote ?? proposal.autoid}</span>
            .
          </p>
          <UserCombobox
            role='sale'
            value={selectedUserId}
            onChange={setSelectedUserId}
            placeholder='Select user...'
            valueLabel={
              proposal.assigned_user
                ? `${proposal.assigned_user.first_name} ${proposal.assigned_user.last_name}`
                : null
            }
          />
        </DialogBody>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            isPending={assignMutation.isPending}
          >
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
