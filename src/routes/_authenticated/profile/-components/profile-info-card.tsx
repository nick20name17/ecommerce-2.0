import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'

import { type UpdateProfileFormValues, UpdateProfileSchema } from '@/api/profile/schema'
import { profileService } from '@/api/profile/service'
import { USER_QUERY_KEYS } from '@/api/user/query'
import type { User } from '@/api/user/schema'
import { RoleBadge } from '@/components/common/role-badge'
import { updateSessionUser } from '@/helpers/auth'
import { formatDate } from '@/helpers/formatters'

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
    meta: { successMessage: 'Profile updated successfully' },
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

  return (
    <div>
      <div className='bg-bg-secondary/60 px-5 py-2'>
        <span className='text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary'>
          Profile Information
        </span>
      </div>
      <div className='text-[13px]'>
        {/* Read-only fields */}
        <ProfileRow label='Email' value={user.email} />
        <ProfileRow label='Member Since' value={formatDate(user.date_joined)} />

        {/* Editable fields */}
        <form id='profile-form' onSubmit={handleSubmit}>
          <Controller
            name='first_name'
            control={form.control}
            render={({ field, fieldState }) => (
              <FieldRow
                label='First Name'
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            name='last_name'
            control={form.control}
            render={({ field, fieldState }) => (
              <FieldRow
                label='Last Name'
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
        </form>

        {/* Role */}
        <ProfileRow label='Role'>
          <RoleBadge role={user.role} />
        </ProfileRow>

        {/* Project */}
        {user.project && (
          <ProfileRow label='Project' value={user.project_name || `Project #${user.project}`} />
        )}

        {/* Save bar */}
        {form.formState.isDirty && (
          <div className='flex items-center justify-end gap-2 bg-bg-secondary/40 px-5 py-2.5'>
            <button
              type='button'
              className='inline-flex h-7 items-center gap-1 rounded-[5px] border border-border bg-background px-2.5 text-[13px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-bg-hover'
              onClick={() => form.reset({ first_name: user.first_name, last_name: user.last_name })}
              disabled={mutation.isPending}
            >
              Cancel
            </button>
            <button
              type='submit'
              form='profile-form'
              className='inline-flex h-7 items-center gap-1 rounded-[5px] bg-primary px-2.5 text-[13px] font-medium text-primary-foreground transition-colors duration-[80ms] hover:opacity-90 disabled:opacity-50'
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Read-only Row ───────────────────────────────────────────

function ProfileRow({
  label,
  value,
  children,
}: {
  label: string
  value?: string
  children?: React.ReactNode
}) {
  return (
    <div className='flex items-center justify-between gap-4 border-b border-border-light px-5 py-2.5'>
      <span className='shrink-0 text-[12px] font-medium text-text-tertiary'>{label}</span>
      {children ?? (
        <span className='min-w-0 truncate text-right font-medium text-foreground'>{value}</span>
      )}
    </div>
  )
}

// ── Editable Field Row ──────────────────────────────────────

function FieldRow({
  label,
  value,
  onChange,
  error,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  return (
    <div className='border-b border-border-light px-5 py-2'>
      <label className='mb-1 block text-[12px] font-medium text-text-tertiary'>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='w-full rounded-[5px] border border-border bg-background px-2.5 py-1.5 text-[13px] font-medium text-foreground outline-none transition-[border-color,box-shadow] duration-75 placeholder:text-text-quaternary focus:border-primary/50 focus:ring-1 focus:ring-primary/20'
        placeholder={`Enter ${label.toLowerCase()}`}
      />
      {error && <p className='mt-1 text-[11px] text-destructive'>{error}</p>}
    </div>
  )
}
