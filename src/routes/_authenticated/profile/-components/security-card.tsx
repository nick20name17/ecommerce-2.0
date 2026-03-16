import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Lock } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { type ChangePasswordFormValues, ChangePasswordSchema } from '@/api/profile/schema'
import { profileService } from '@/api/profile/service'
import { PasswordInput } from '@/components/common/inputs/password-input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'

export const SecurityCard = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div>
        <div className='bg-bg-secondary/60 px-5 py-2'>
          <span className='text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary'>
            Security
          </span>
        </div>
        <div className='px-5 py-3'>
          <p className='mb-3 text-[13px] text-text-tertiary'>
            Keep your account secure by using a strong password.
          </p>
          <button
            type='button'
            className='inline-flex h-7 items-center gap-1.5 rounded-[5px] border border-border bg-background px-2.5 text-[13px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-bg-hover hover:text-foreground'
            onClick={() => setOpen(true)}
          >
            <Lock className='size-3.5' />
            Change Password
          </button>
        </div>
      </div>

      <ChangePasswordDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

const ChangePasswordDialog = ({
  open,
  onOpenChange
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) => {
  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      old_password: '',
      new_password: '',
      new_password_confirm: ''
    }
  })

  const mutation = useMutation({
    mutationFn: profileService.changePassword,
    meta: { successMessage: 'Password changed successfully' },
    onSuccess: () => {
      form.reset()
      onOpenChange(false)
    }
  })

  const handleSubmit = form.handleSubmit((data) => mutation.mutate(data))

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) form.reset()
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-md'>
        <DialogHeader className='sticky top-0 z-10 border-b bg-background px-6 py-4'>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>

        <DialogBody className='px-6 py-4'>
          <form id='password-form' onSubmit={handleSubmit}>
            <FieldGroup>
              <Controller
                name='old_password'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='old-password'>Current Password</FieldLabel>
                    <PasswordInput {...field} id='old-password' />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name='new_password'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='new-password'>New Password</FieldLabel>
                    <PasswordInput {...field} id='new-password' />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name='new_password_confirm'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='new-password-confirm'>Confirm New Password</FieldLabel>
                    <PasswordInput {...field} id='new-password-confirm' />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>
          </form>
        </DialogBody>

        <DialogFooter className='sticky bottom-0 z-10 border-t bg-background px-6 py-4'>
          <Button
            variant='outline'
            onClick={() => handleClose(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type='submit'
            form='password-form'
            isPending={mutation.isPending}
            disabled={mutation.isPending}
          >
            Change Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
