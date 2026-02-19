import { useMutation } from '@tanstack/react-query'
import { TriangleAlert } from 'lucide-react'
import { useState } from 'react'

import { profileService } from '@/api/profile/service'
import type { User } from '@/api/user/schema'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/providers/auth'

const DELETE_CONFIRMATION_TEXT = 'DELETE MY ACCOUNT'

interface DangerZoneCardProps {
  user: User
}

export const DangerZoneCard = ({ user }: DangerZoneCardProps) => {
  const { logout } = useAuth()

  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  const isDeleteValid = deleteConfirmation === DELETE_CONFIRMATION_TEXT

  const deactivateMutation = useMutation({
    mutationFn: () => profileService.deactivateAccount(user.id),
    meta: {
      successMessage: 'Account deactivated successfully'
    },
    onSuccess: () => {
      setDeactivateOpen(false)
      logout()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: () => profileService.deleteAccount(user.id),
    meta: {
      successMessage: 'Account deleted successfully'
    },
    onSuccess: () => {
      setDeleteOpen(false)
      logout()
    }
  })

  const handleDeleteClose = (open: boolean) => {
    if (!open) setDeleteConfirmation('')
    setDeleteOpen(open)
  }

  return (
    <>
      <Card className='ring-destructive/30'>
        <CardHeader>
          <CardTitle className='text-destructive'>Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          <div className='flex flex-col gap-1'>
            <span className='text-muted-foreground text-xs font-medium'>Deactivate Account</span>
            <p className='text-muted-foreground text-sm'>
              Temporarily disable your account. You can reactivate it later.
            </p>
            <div className='mt-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setDeactivateOpen(true)}
              >
                Deactivate Account
              </Button>
            </div>
          </div>

          <div className='flex flex-col gap-1'>
            <span className='text-muted-foreground text-xs font-medium'>Delete Account</span>
            <p className='text-muted-foreground text-sm'>
              Permanently delete your account. This cannot be undone.
            </p>
            <div className='mt-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setDeleteOpen(true)}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deactivate confirmation */}
      <AlertDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className='bg-destructive/10 text-destructive'>
              <TriangleAlert />
            </AlertDialogMedia>
            <AlertDialogTitle>Deactivate Account</AlertDialogTitle>
            <AlertDialogDescription>
              Your account will be temporarily disabled. You won&apos;t be able to log in until an
              administrator reactivates your account. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={() => deactivateMutation.mutate()}
              disabled={deactivateMutation.isPending}
            >
              {deactivateMutation.isPending ? 'Deactivating...' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <Dialog
        open={deleteOpen}
        onOpenChange={handleDeleteClose}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription className='text-destructive'>
              <strong>Warning:</strong> This action is permanent and cannot be undone. All your data
              will be permanently deleted.
            </DialogDescription>
          </DialogHeader>

          <div className='flex flex-col gap-2'>
            <label
              htmlFor='delete-confirm'
              className='text-sm font-medium'
            >
              Type <strong>{DELETE_CONFIRMATION_TEXT}</strong> to confirm
            </label>
            <Input
              id='delete-confirm'
              placeholder={DELETE_CONFIRMATION_TEXT}
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              disabled={deleteMutation.isPending}
            />
            {deleteConfirmation && !isDeleteValid ? (
              <p className='text-destructive text-sm'>Confirmation text does not match</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => handleDeleteClose(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={() => deleteMutation.mutate()}
              isPending={deleteMutation.isPending}
              disabled={!isDeleteValid || deleteMutation.isPending}
            >
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
