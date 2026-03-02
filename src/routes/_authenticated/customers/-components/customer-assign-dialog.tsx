import { useMutation } from '@tanstack/react-query'
import { UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'

import { CUSTOMER_QUERY_KEYS } from '@/api/customer/query'
import type { Customer } from '@/api/customer/schema'
import { customerService } from '@/api/customer/service'
import { UserCombobox } from '@/components/common/user-combobox/user-combobox'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface CustomerAssignDialogProps {
  customer: Customer | null
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId?: number | null
}

export function CustomerAssignDialog({
  customer,
  open,
  onOpenChange,
  projectId
}: CustomerAssignDialogProps) {
  const currentUserId =
    customer && typeof (customer as { responsible_user?: number }).responsible_user === 'number'
      ? (customer as { responsible_user?: number }).responsible_user ?? null
      : null
  const [selectedUserId, setSelectedUserId] = useState<number | null>(currentUserId)

  useEffect(() => {
    if (open && customer) setSelectedUserId(currentUserId)
  }, [open, customer, currentUserId])

  const assignMutation = useMutation({
    mutationFn: ({
      autoid,
      userId
    }: {
      autoid: string
      userId: number | null
    }) =>
      customerService.assign(
        autoid,
        { user_id: userId },
        projectId ?? undefined
      ),
    meta: {
      successMessage: 'Customer assigned successfully',
      invalidatesQuery: CUSTOMER_QUERY_KEYS.all()
    },
    onSuccess: () => {
      onOpenChange(false)
    }
  })

  const handleConfirm = () => {
    if (!customer) return
    assignMutation.mutate({ autoid: customer.id, userId: selectedUserId })
  }

  if (!customer) return null

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
            Assign a responsible user for{' '}
            <span className='font-medium text-foreground'>{customer.l_name}</span>.
          </p>
          <UserCombobox
              role='sale'
              value={selectedUserId}
              onChange={setSelectedUserId}
              placeholder='Select user...'
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
