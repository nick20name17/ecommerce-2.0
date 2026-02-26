import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Controller, FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form'

import { getProjectsQuery } from '@/api/project/query'
import { USER_QUERY_KEYS } from '@/api/user/query'
import {
  type CreateUserFormValues,
  CreateUserSchema,
  type UpdateUserFormValues,
  UpdateUserSchema,
  type User
} from '@/api/user/schema'
import { userService } from '@/api/user/service'
import { PasswordInput } from '@/components/common/inputs/password-input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { USER_ROLES, USER_ROLE_LABELS, isSuperAdmin } from '@/constants/user'
import type { UserRole } from '@/constants/user'
import { useAuth } from '@/providers/auth'

interface UserModalProps {
  user?: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const UserModal = ({ user, open, onOpenChange }: UserModalProps) => {
  const isEdit = !!user

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-md'>
        {isEdit ? (
          <EditForm
            user={user}
            onOpenChange={onOpenChange}
          />
        ) : (
          <CreateForm onOpenChange={onOpenChange} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function SharedFields({ editingUser }: { editingUser?: User | null }) {
  const { control, setValue } = useFormContext()
  const role = useWatch({ control, name: 'role', defaultValue: undefined })
  const showProject = role !== undefined && !isSuperAdmin(role as UserRole)

  const { user: currentUser } = useAuth()
  const { data: projectsData } = useQuery(getProjectsQuery({ limit: 500 }))
  const projects = projectsData?.results ?? []

  const roleOptions = (Object.entries(USER_ROLE_LABELS) as [UserRole, string][]).filter(
    ([value]) => {
      if (currentUser?.role && isSuperAdmin(currentUser.role)) return true
      if (value === USER_ROLES.superadmin) {
        return editingUser?.role === USER_ROLES.superadmin
      }
      return true
    }
  )

  return (
    <>
      <div className='grid grid-cols-2 gap-4'>
        <Controller
          name='first_name'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='first-name'>First Name</FieldLabel>
              <Input
                {...field}
                id='first-name'
                placeholder='John'
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name='last_name'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='last-name'>Last Name</FieldLabel>
              <Input
                {...field}
                id='last-name'
                placeholder='Doe'
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <Controller
        name='email'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor='email'>Email</FieldLabel>
            <Input
              {...field}
              id='email'
              type='email'
              placeholder='example@example.com'
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name='role'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Role</FieldLabel>
            <Select
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value)
                if (value === USER_ROLES.superadmin) setValue('project', 0)
              }}
            >
              <SelectTrigger
                className='w-full'
                aria-invalid={fieldState.invalid}
              >
                <SelectValue placeholder='Select role' />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map(([value, label]) => (
                  <SelectItem
                    key={value}
                    value={value}
                  >
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {showProject && (
        <Controller
          name='project'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Project</FieldLabel>
              <Select
                value={field.value === 0 || field.value === undefined ? '' : String(field.value)}
                onValueChange={(v) => field.onChange(v ? Number(v) : 0)}
              >
                <SelectTrigger
                  className='w-full'
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue placeholder='Select project' />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem
                      key={p.id}
                      value={String(p.id)}
                    >
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      )}
    </>
  )
}

function CreateForm({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      role: 'sale',
      project: 0,
      password: '',
      password_confirm: ''
    }
  })

  const mutation = useMutation({
    mutationFn: userService.create,
    meta: {
      successMessage: 'User created successfully',
      invalidatesQuery: USER_QUERY_KEYS.lists()
    },
    onSuccess: () => {
      onOpenChange(false)
      form.reset()
    }
  })

  const handleSubmit = form.handleSubmit((data) => mutation.mutate(data))

  return (
    <FormProvider {...form}>
      <DialogHeader className='bg-background sticky top-0 z-10 border-b px-6 py-4'>
        <DialogTitle>Create User</DialogTitle>
      </DialogHeader>

      <DialogBody className='px-6 py-4'>
        <form
          id='user-form'
          onSubmit={handleSubmit}
        >
          <FieldGroup>
            <SharedFields editingUser={null} />

            <div className='grid grid-cols-2 gap-4'>
              <Controller
                name='password'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='password'>Password</FieldLabel>
                    <PasswordInput
                      {...field}
                      id='password'
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name='password_confirm'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='password-confirm'>Confirm</FieldLabel>
                    <PasswordInput
                      {...field}
                      id='password-confirm'
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
          </FieldGroup>
        </form>
      </DialogBody>

      <DialogFooter className='bg-background sticky bottom-0 z-10 border-t px-6 py-4'>
        <Button
          variant='outline'
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button
          type='submit'
          form='user-form'
          isPending={mutation.isPending}
          disabled={mutation.isPending}
        >
          Create User
        </Button>
      </DialogFooter>
    </FormProvider>
  )
}

function EditForm({ user, onOpenChange }: { user: User; onOpenChange: (open: boolean) => void }) {
  const { user: currentUser } = useAuth()
  const isSelf = user.id === currentUser?.id

  const form = useForm<UpdateUserFormValues>({
    resolver: zodResolver(UpdateUserSchema),
    defaultValues: {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      project: user.project,
      is_active: user.is_active
    }
  })

  const mutation = useMutation({
    mutationFn: userService.update,
    meta: {
      successMessage: 'User updated successfully',
      invalidatesQuery: USER_QUERY_KEYS.lists()
    },
    onSuccess: () => onOpenChange(false)
  })

  const handleSubmit = form.handleSubmit((data) => {
    mutation.mutate({ id: user.id, payload: data })
  })

  return (
    <FormProvider {...form}>
      <DialogHeader className='bg-background sticky top-0 z-10 border-b px-6 py-4'>
        <DialogTitle>Edit User</DialogTitle>
      </DialogHeader>

      <DialogBody className='px-6 py-4'>
        <form
          id='user-form'
          onSubmit={handleSubmit}
        >
          <FieldGroup>
            <SharedFields editingUser={user} />

            <Controller
              name='is_active'
              control={form.control}
              render={({ field }) => (
                <Field
                  orientation='horizontal'
                  data-disabled={isSelf}
                >
                  <Checkbox
                    id='is-active'
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSelf}
                  />
                  <FieldLabel htmlFor='is-active'>Active account</FieldLabel>
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </DialogBody>

      <DialogFooter className='bg-background sticky bottom-0 z-10 border-t px-6 py-4'>
        <Button
          variant='outline'
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button
          type='submit'
          form='user-form'
          isPending={mutation.isPending}
          disabled={!form.formState.isDirty || mutation.isPending}
        >
          Save Changes
        </Button>
      </DialogFooter>
    </FormProvider>
  )
}

