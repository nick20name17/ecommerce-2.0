import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'

import { type UpdateProfileFormValues, UpdateProfileSchema } from '@/api/profile/schema'
import { profileService } from '@/api/profile/service'
import { USERS_QUERY_KEYS } from '@/api/user/query'
import type { User } from '@/api/user/schema'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { DATE_FORMATS } from '@/constants/app'
import { getUserRoleLabel } from '@/constants/user'
import { updateSessionUser } from '@/helpers/auth'
import { format } from 'date-fns'

interface ProfileInfoCardProps {
  user: User
}

export const ProfileInfoCard = ({ user }: ProfileInfoCardProps) => {
  const queryClient = useQueryClient()

  const form = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      first_name: user.first_name,
      last_name: user.last_name
    }
  })

  const mutation = useMutation({
    mutationFn: profileService.updateProfile,
    meta: {
      successMessage: 'Profile updated successfully',
      invalidatesQuery: USERS_QUERY_KEYS.detail('me')
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(USERS_QUERY_KEYS.detail('me'), updatedUser)
      updateSessionUser(updatedUser)
      form.reset({
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name
      })
    }
  })

  const handleSubmit = form.handleSubmit((data) => mutation.mutate(data))

  const handleCancel = () => {
    form.reset({
      first_name: user.first_name,
      last_name: user.last_name
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form id='profile-form' onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel className='text-muted-foreground text-xs'>Email</FieldLabel>
              <p className='text-sm'>{user.email}</p>
            </Field>

            <Controller
              name='first_name'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='first-name'>First Name</FieldLabel>
                  <Input
                    {...field}
                    id='first-name'
                    placeholder='Enter first name'
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name='last_name'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='last-name'>Last Name</FieldLabel>
                  <Input
                    {...field}
                    id='last-name'
                    placeholder='Enter last name'
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Field>
              <FieldLabel className='text-muted-foreground text-xs'>Role</FieldLabel>
              <div>
                <Badge variant='secondary'>{getUserRoleLabel(user.role)}</Badge>
              </div>
            </Field>

            {user.project ? (
              <Field>
                <FieldLabel className='text-muted-foreground text-xs'>Project</FieldLabel>
                <p className='text-sm'>{user.project_name || `Project #${user.project}`}</p>
              </Field>
            ) : null}

            <Field>
              <FieldLabel className='text-muted-foreground text-xs'>Member Since</FieldLabel>
              <p className='text-sm'>
                {user.date_joined
                  ? format(new Date(user.date_joined), DATE_FORMATS.display)
                  : '—'}
              </p>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className='justify-end gap-2'>
        <Button
          type='button'
          variant='outline'
          disabled={!form.formState.isDirty || mutation.isPending}
          onClick={handleCancel}
        >
          Cancel
        </Button>
        <Button
          type='submit'
          form='profile-form'
          isPending={mutation.isPending}
          disabled={!form.formState.isDirty || mutation.isPending}
        >
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  )
}
