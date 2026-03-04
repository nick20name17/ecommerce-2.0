import { useMutation } from '@tanstack/react-query'
import { UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ORDER_QUERY_KEYS } from '@/api/order/query'
import type { Order } from '@/api/order/schema'
import { orderService } from '@/api/order/service'
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

interface OrderAssignDialogProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId?: number | null
}

export function OrderAssignDialog({
  order,
  open,
  onOpenChange,
  projectId
}: OrderAssignDialogProps) {
  const currentUserId = order?.assigned_user?.id ?? null
  const [selectedUserId, setSelectedUserId] = useState<number | null>(currentUserId)

  useEffect(() => {
    if (open && order) setSelectedUserId(currentUserId)
  }, [open, order, currentUserId])

  const assignMutation = useMutation({
    mutationFn: ({ autoid, userId }: { autoid: string; userId: number | null }) =>
      orderService.assign(autoid, { user_id: userId }, projectId ?? undefined),
    meta: {
      successMessage: 'Order assigned successfully',
      invalidatesQuery: ORDER_QUERY_KEYS.all()
    },
    onSuccess: () => {
      onOpenChange(false)
    }
  })

  const handleConfirm = () => {
    if (!order) return
    assignMutation.mutate({ autoid: order.autoid, userId: selectedUserId })
  }

  if (!order) return null

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
            Assign a responsible user for order{' '}
            <span className='text-foreground font-medium'>{order.invoice ?? order.autoid}</span>.
          </p>
          <UserCombobox
            role='sale'
            value={selectedUserId}
            onChange={setSelectedUserId}
            placeholder='Select user...'
            valueLabel={
              order.assigned_user
                ? `${order.assigned_user.first_name} ${order.assigned_user.last_name}`
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
