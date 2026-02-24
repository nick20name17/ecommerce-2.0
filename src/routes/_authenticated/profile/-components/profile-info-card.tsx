import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'

import { type UpdateProfileFormValues, UpdateProfileSchema } from '@/api/profile/schema'
import { profileService } from '@/api/profile/service'
import { USER_QUERY_KEYS } from '@/api/user/query'
import type { User } from '@/api/user/schema'
import { RoleBadge } from '@/components/common/role-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/helpers/formatters'
import { updateSessionUser } from '@/helpers/auth'

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
      successMessage: 'Profile updated successfully'
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(USER_QUERY_KEYS.detail('me'), updatedUser)
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.lists() })
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
        <form
          id='profile-form'
          onSubmit={handleSubmit}
        >
          <FieldGroup>
            <div className='grid grid-cols-2 gap-4'>
              <Field>
                <FieldLabel className='text-muted-foreground text-xs'>Email</FieldLabel>
                <p className='text-sm'>{user.email}</p>
              </Field>
              <Field>
                <FieldLabel className='text-muted-foreground text-xs'>Member Since</FieldLabel>
                <p className='text-sm'>
                  {formatDate(user.date_joined)}
                </p>
              </Field>
            </div>

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
                <RoleBadge role={user.role} />
              </div>
            </Field>

            {user.project ? (
              <Field>
                <FieldLabel className='text-muted-foreground text-xs'>Project</FieldLabel>
                <p className='text-sm'>{user.project_name || `Project #${user.project}`}</p>
              </Field>
            ) : null}
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
