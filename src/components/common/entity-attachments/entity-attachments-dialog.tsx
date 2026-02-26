import { useQuery } from '@tanstack/react-query'

import { getOrderAttachmentsQuery } from '@/api/order/query'
import { getProposalAttachmentsQuery } from '@/api/proposal/query'
import { EntityAttachments } from '@/components/common/entity-attachments/entity-attachments'
import type { EntityAttachmentType } from '@/components/common/entity-attachments/entity-attachments'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

interface EntityAttachmentsDialogProps {
  entityType: EntityAttachmentType
  entityLabel: string
  autoid: string
  projectId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EntityAttachmentsDialog({
  entityType,
  entityLabel,
  autoid,
  projectId,
  open,
  onOpenChange
}: EntityAttachmentsDialogProps) {
  const orderQuery = useQuery({
    ...getOrderAttachmentsQuery(autoid, projectId),
    enabled: open && entityType === 'order' && !!autoid
  })
  const proposalQuery = useQuery({
    ...getProposalAttachmentsQuery(autoid, projectId),
    enabled: open && entityType === 'proposal' && !!autoid
  })

  const { data: attachments = [], isLoading } =
    entityType === 'order' ? orderQuery : proposalQuery

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-lg'>
        <DialogHeader className='shrink-0 space-y-1 px-6 pt-6 pb-4'>
          <DialogTitle className='text-lg font-semibold'>Attachments</DialogTitle>
          <DialogDescription className='text-sm'>{entityLabel}</DialogDescription>
        </DialogHeader>
        <div className='min-h-0 flex-1 overflow-y-auto px-6 pt-2 pb-6'>
          <EntityAttachments
            entityType={entityType}
            entityId={autoid}
            projectId={projectId}
            attachments={attachments}
            mode='immediate'
            isLoading={isLoading}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
