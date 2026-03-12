import { Paperclip } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { getOrderAttachmentsQuery } from '@/api/order/query'
import { getProposalAttachmentsQuery } from '@/api/proposal/query'
import { EntityAttachments } from '@/components/common/entity-attachments/entity-attachments'
import type { EntityAttachmentType } from '@/components/common/entity-attachments/entity-attachments'
import {
  Dialog,
  DialogContent,
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

export const EntityAttachmentsDialog = ({
  entityType,
  entityLabel,
  autoid,
  projectId,
  open,
  onOpenChange
}: EntityAttachmentsDialogProps) => {
  const orderQuery = useQuery({
    ...getOrderAttachmentsQuery(autoid, projectId),
    enabled: open && entityType === 'order' && !!autoid
  })
  const proposalQuery = useQuery({
    ...getProposalAttachmentsQuery(autoid, projectId),
    enabled: open && entityType === 'proposal' && !!autoid
  })

  const { data: attachments = [], isLoading } = entityType === 'order' ? orderQuery : proposalQuery

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md'>
        <DialogHeader className='border-b border-border px-5 py-3'>
          <DialogTitle className='flex items-center gap-2 text-[14px]'>
            <Paperclip className='size-4 text-text-tertiary' />
            Attachments
            <span className='text-[12px] font-normal text-text-tertiary'>{entityLabel}</span>
          </DialogTitle>
        </DialogHeader>
        <div className='min-h-0 flex-1 overflow-y-auto'>
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
