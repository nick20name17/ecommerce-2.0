import { useMutation } from '@tanstack/react-query'
import { TriangleAlert } from 'lucide-react'

import { USERS_QUERY_KEYS } from '@/api/user/query'
import type { User } from '@/api/user/schema'
import { userService } from '@/api/user/service'
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
import { useAuth } from '@/providers/auth'

interface UserDeleteDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const UserDeleteDialog = ({ user, open, onOpenChange }: UserDeleteDialogProps) => {
  const { user: currentUser } = useAuth()
  const isSelf = user?.id === currentUser?.id

  const deleteMutation = useMutation({
    mutationFn: userService.delete,
    meta: {
      successMessage: 'User deleted successfully',
      invalidatesQuery: USERS_QUERY_KEYS.lists()
    },
    onSuccess: () => {
      onOpenChange(false)
    }
  })

  const handleDelete = () => {
    if (!user) return
    deleteMutation.mutate(user.id)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className='bg-destructive/10 text-destructive'>
            <TriangleAlert />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete User</AlertDialogTitle>
          <AlertDialogDescription>
            {isSelf
              ? 'You cannot delete your own account.'
              : `Are you sure you want to delete ${user?.first_name} ${user?.last_name}? This action cannot be undone.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            onClick={handleDelete}
            disabled={isSelf}
            isPending={deleteMutation.isPending}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
