import { useMutation } from '@tanstack/react-query'
import { TriangleAlert } from 'lucide-react'

import { CUSTOMER_QUERY_KEYS } from '@/api/customer/query'
import type { Customer } from '@/api/customer/schema'
import { customerService } from '@/api/customer/service'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface CustomerDeleteDialogProps {
  customer: Customer | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const CustomerDeleteDialog = ({
  customer,
  open,
  onOpenChange,
}: CustomerDeleteDialogProps) => {
  const deleteMutation = useMutation({
    mutationFn: customerService.delete,
    meta: {
      successMessage: 'Customer deleted successfully',
      invalidatesQuery: CUSTOMER_QUERY_KEYS.lists(),
    },
    onSuccess: () => {
      onOpenChange(false)
    },
  })

  const handleDelete = () => {
    if (!customer) return
    deleteMutation.mutate(customer.id)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className='bg-destructive/10 text-destructive'>
            <TriangleAlert />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Customer</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{' '}
            <span className='font-medium'>{customer?.l_name}</span>? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
