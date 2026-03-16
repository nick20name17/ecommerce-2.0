import { useMutation } from '@tanstack/react-query'
import { Check, Copy, TriangleAlert } from 'lucide-react'
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
import {
  Dialog,
  DialogBody,
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
  const [copied, setCopied] = useState(false)

  const isDeleteValid = deleteConfirmation === DELETE_CONFIRMATION_TEXT

  const handleCopy = async () => {
    await navigator.clipboard.writeText(DELETE_CONFIRMATION_TEXT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const deactivateMutation = useMutation({
    mutationFn: () => profileService.deactivateAccount(user.id),
    meta: { successMessage: 'Account deactivated successfully' },
    onSuccess: () => {
      setDeactivateOpen(false)
      logout()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: () => profileService.deleteAccount(user.id),
    meta: { successMessage: 'Account deleted successfully' },
    onSuccess: () => {
      setDeleteOpen(false)
      logout()
    }
  })

  const handleDeleteClose = (open: boolean) => {
    if (!open) {
      setDeleteConfirmation('')
      setCopied(false)
    }
    setDeleteOpen(open)
  }

  return (
    <>
      <div>
        <div className='bg-destructive/5 px-5 py-2'>
          <span className='text-[11px] font-semibold uppercase tracking-[0.06em] text-destructive/70'>
            Danger Zone
          </span>
        </div>
        <div className='space-y-0 text-[13px]'>
          {/* Deactivate */}
          <div className='flex items-center justify-between gap-4 border-b border-border-light px-5 py-3'>
            <div className='min-w-0'>
              <p className='font-medium text-foreground'>Deactivate Account</p>
              <p className='text-[12px] text-text-tertiary'>
                Temporarily disable your account. You can reactivate it later.
              </p>
            </div>
            <button
              type='button'
              className='inline-flex h-7 shrink-0 items-center rounded-[5px] border border-border bg-background px-2.5 text-[13px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-bg-hover hover:text-foreground'
              onClick={() => setDeactivateOpen(true)}
            >
              Deactivate
            </button>
          </div>

          {/* Delete */}
          <div className='flex items-center justify-between gap-4 px-5 py-3'>
            <div className='min-w-0'>
              <p className='font-medium text-foreground'>Delete Account</p>
              <p className='text-[12px] text-text-tertiary'>
                Permanently delete your account. This cannot be undone.
              </p>
            </div>
            <button
              type='button'
              className='inline-flex h-7 shrink-0 items-center rounded-[5px] border border-destructive/30 bg-destructive/5 px-2.5 text-[13px] font-medium text-destructive transition-colors duration-[80ms] hover:bg-destructive/10'
              onClick={() => setDeleteOpen(true)}
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Deactivate confirmation */}
      <AlertDialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
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
              isPending={deactivateMutation.isPending}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={handleDeleteClose}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader className='border-b bg-background px-6 py-4'>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription className='text-destructive'>
              <strong>Warning:</strong> This action is permanent and cannot be undone. All your data
              will be permanently deleted.
            </DialogDescription>
          </DialogHeader>

          <DialogBody>
            <div className='flex flex-col gap-2'>
              <label htmlFor='delete-confirm' className='text-[13px] font-medium'>
                Type{' '}
                <button
                  type='button'
                  onClick={handleCopy}
                  className='inline-flex cursor-pointer items-center gap-1 rounded px-1 font-bold transition-colors hover:bg-bg-hover'
                >
                  {DELETE_CONFIRMATION_TEXT}
                  {copied ? <Check className='size-3' /> : <Copy className='size-3' />}
                </button>{' '}
                to confirm
              </label>
              <Input
                id='delete-confirm'
                placeholder={DELETE_CONFIRMATION_TEXT}
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                disabled={deleteMutation.isPending}
              />
              {deleteConfirmation && !isDeleteValid ? (
                <p className='text-sm text-destructive'>Confirmation text does not match</p>
              ) : null}
            </div>
          </DialogBody>

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
