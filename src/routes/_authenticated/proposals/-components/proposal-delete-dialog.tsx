import { useMutation } from '@tanstack/react-query'
import { TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'

import { PROPOSAL_QUERY_KEYS } from '@/api/proposal/query'
import type { Proposal } from '@/api/proposal/schema'
import { proposalService } from '@/api/proposal/service'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const CONFIRMATION_TEXT = 'DELETE THIS PROPOSAL'

interface ProposalDeleteDialogProps {
  proposal: Proposal | null
  projectId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ProposalDeleteDialog = ({
  proposal,
  projectId,
  open,
  onOpenChange
}: ProposalDeleteDialogProps) => {
  const [confirmText, setConfirmText] = useState('')

  const isConfirmed = confirmText === CONFIRMATION_TEXT

  useEffect(() => {
    if (!open) setConfirmText('')
  }, [open])

  const deleteMutation = useMutation({
    mutationFn: ({ autoid, projectId }: { autoid: string; projectId: number }) =>
      proposalService.delete(autoid, projectId),
    meta: {
      successMessage: 'Proposal deleted successfully',
      invalidatesQuery: PROPOSAL_QUERY_KEYS.lists()
    },
    onSuccess: () => {
      onOpenChange(false)
    }
  })

  const handleDelete = () => {
    if (!proposal || !isConfirmed || !projectId) return
    deleteMutation.mutate({ autoid: proposal.autoid, projectId })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className='bg-destructive/10 text-destructive'>
            <TriangleAlert />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Proposal</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete proposal {proposal?.quote}? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className='space-y-2'>
          <Label htmlFor='confirm-delete'>
            Type <span className='font-semibold'>{CONFIRMATION_TEXT}</span> to confirm
          </Label>
          <Input
            id='confirm-delete'
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={CONFIRMATION_TEXT}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            onClick={handleDelete}
            disabled={!isConfirmed || deleteMutation.isPending}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
