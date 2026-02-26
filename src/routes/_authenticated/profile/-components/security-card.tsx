import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Lock } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { type ChangePasswordFormValues, ChangePasswordSchema } from '@/api/profile/schema'
import { profileService } from '@/api/profile/service'
import { PasswordInput } from '@/components/common/inputs/password-input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Keep your account secure by using a strong password.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant='outline' onClick={() => setOpen(true)}>
            <Lock />
            Change Password
          </Button>
        </CardContent>
      </Card>

      <ChangePasswordDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

function ChangePasswordDialog({
  open,
  onOpenChange
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
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
    meta: {
      successMessage: 'Password changed successfully'
    },
    onSuccess: () => {
      form.reset()
      onOpenChange(false)
    }
  })

  const handleSubmit = form.handleSubmit((data) => mutation.mutate(data))

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset()
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='flex max-h-[90vh] flex-col sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>

        <DialogBody>
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

        <DialogFooter>
          <Button variant='outline' onClick={() => handleClose(false)} disabled={mutation.isPending}>
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
