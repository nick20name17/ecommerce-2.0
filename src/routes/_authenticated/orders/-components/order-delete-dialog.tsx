import { useMutation } from '@tanstack/react-query'
import { TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ORDER_QUERY_KEYS } from '@/api/order/query'
import type { Order } from '@/api/order/schema'
import { orderService } from '@/api/order/service'
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

const CONFIRMATION_TEXT = 'DELETE THIS ORDER'

interface OrderDeleteDialogProps {
  order: Order | null
  projectId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const OrderDeleteDialog = ({ order, projectId, open, onOpenChange }: OrderDeleteDialogProps) => {
  const [confirmText, setConfirmText] = useState('')

  const isConfirmed = confirmText === CONFIRMATION_TEXT

  useEffect(() => {
    if (!open) setConfirmText('')
  }, [open])

  const deleteMutation = useMutation({
    mutationFn: ({ autoid, projectId }: { autoid: string; projectId: number }) =>
      orderService.delete(autoid, projectId),
    meta: {
      successMessage: 'Order deleted successfully',
      invalidatesQuery: ORDER_QUERY_KEYS.lists()
    },
    onSuccess: () => {
      onOpenChange(false)
    }
  })

  const handleDelete = () => {
    if (!order || !isConfirmed || !projectId) return
    deleteMutation.mutate({ autoid: order.autoid, projectId })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className='bg-destructive/10 text-destructive'>
            <TriangleAlert />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Order</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete order {order?.id}? This action cannot be undone.
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
