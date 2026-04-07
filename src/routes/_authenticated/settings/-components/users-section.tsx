import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

import { PageEmpty } from '@/components/common/page-empty'
import { USER_QUERY_KEYS, getUsersQuery } from '@/api/user/query'
import type { User, UserParams } from '@/api/user/schema'
import { userService } from '@/api/user/service'
import { InitialsAvatar } from '@/components/ds'
import { RoleBadge } from '@/components/common/role-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getInitialsFromParts, getUserDisplayName } from '@/helpers/formatters'
import { cn } from '@/lib/utils'
import { useAuth } from '@/providers/auth'
import { UserDeleteDialog } from '../../users/-components/user-delete-dialog'
import { UserModal } from '../../users/-components/user-modal'

// ── User Status Toggle ──────────────────────────────────────

const UserStatusToggle = ({
  user,
  currentUserId,
}: {
  user: User
  currentUserId: number | undefined
}) => {
  const isSelf = user.id === currentUserId

  const toggleMutation = useMutation({
    mutationFn: () => userService.update({ id: user.id, payload: { is_active: !user.is_active } }),
    meta: {
      successMessage: `User ${user.is_active ? 'deactivated' : 'activated'}`,
      invalidatesQuery: USER_QUERY_KEYS.lists(),
    },
  })

  const toggle = (
    <Switch
      checked={user.is_active}
      disabled={isSelf || toggleMutation.isPending}
      onCheckedChange={() => toggleMutation.mutate()}
      aria-label={user.is_active ? 'Deactivate user' : 'Activate user'}
    />
  )

  if (!isSelf) return toggle

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className='inline-flex'>{toggle}</span>
      </TooltipTrigger>
      <TooltipContent>You cannot deactivate yourself</TooltipContent>
    </Tooltip>
  )
}

// ── Users Section ───────────────────────────────────────────

export const UsersSection = () => {
  const [search, setSearch] = useState('')
  const debouncedSetSearch = useDebouncedCallback((value: string) => setSearch(value), 300)
  const { user: currentUser } = useAuth()

  const [modalUser, setModalUser] = useState<User | 'create' | null>(null)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)

  const params: UserParams = {
    limit: 500,
  }

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getUsersQuery(params),
    placeholderData: keepPreviousData,
  })

  const allUsers = data?.results ?? []
  const users = search
    ? allUsers.filter((u) => {
        const term = search.toLowerCase()
      const fullName = getUserDisplayName(u).toLowerCase()
        return fullName.includes(term) || u.email.toLowerCase().includes(term)
      })
    : allUsers
  const editingUser = typeof modalUser === 'object' ? modalUser : null
  const loading = isLoading || isPlaceholderData

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      {/* Toolbar */}
      <div className='flex shrink-0 items-center gap-2 border-b border-border px-6 py-1.5'>
        <div className='flex h-7 w-[220px] items-center gap-1.5 rounded-[5px] border border-border bg-background px-2 transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50'>
          <Search className='size-3 shrink-0 text-text-tertiary' />
          <input
            defaultValue={search}
            onChange={(e) => debouncedSetSearch(e.target.value)}
            placeholder='Search users...'
            className='flex-1 bg-transparent text-[13px] outline-none placeholder:text-text-tertiary'
          />
        </div>
        <div className='flex-1' />
        <button
          type='button'
          className='inline-flex h-7 items-center gap-1 rounded-[5px] bg-primary px-2.5 text-[13px] font-semibold text-primary-foreground transition-opacity duration-[80ms] hover:opacity-90'
          onClick={() => setModalUser('create')}
        >
          <Plus className='size-3.5' />
          New User
        </button>
      </div>

      {/* Table header */}
      <div className='sticky top-0 z-10 flex shrink-0 items-center gap-4 border-b border-border bg-bg-secondary px-6 py-1.5'>
        <div className='min-w-0 flex-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary'>
          User
        </div>
        <div className='hidden min-w-0 flex-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary sm:block'>
          Email
        </div>
        <div className='w-[80px] shrink-0 text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary'>
          Role
        </div>
        <div className='w-[60px] shrink-0 text-center text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary'>
          Active
        </div>
        <div className='w-[56px] shrink-0' />
      </div>

      {/* Table body */}
      <div className='min-h-0 flex-1 overflow-auto'>
        {loading && !users.length ? (
          <div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className='flex items-center gap-4 border-b border-border-light px-6 py-2'>
                <div className='flex min-w-0 flex-1 items-center gap-2.5'>
                  <Skeleton className='size-7 rounded-full' />
                  <Skeleton className='h-3.5 w-28' />
                </div>
                <div className='hidden min-w-0 flex-1 sm:block'>
                  <Skeleton className='h-3.5 w-36' />
                </div>
                <div className='w-[80px] shrink-0'>
                  <Skeleton className='h-5 w-14 rounded-[4px]' />
                </div>
                <div className='flex w-[60px] shrink-0 justify-center'>
                  <Skeleton className='h-5 w-9 rounded-full' />
                </div>
                <div className='w-[56px] shrink-0' />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <PageEmpty icon={Search} title='No users found' description={search ? 'Try a different search term.' : 'Add your first user to get started.'} />
        ) : (
          users.map((user) => {
            const fullName = getUserDisplayName(user)
            const initials = getInitialsFromParts(user.first_name, user.last_name, user.email)
            const isSelf = user.id === currentUser?.id

            return (
              <div
                key={user.id}
                className={cn(
                  'group/row flex items-center gap-4 border-b border-border-light px-6 py-1.5 transition-colors duration-75 hover:bg-bg-hover/40',
                  loading && 'opacity-60',
                )}
              >
                {/* Name + avatar */}
                <div className='flex min-w-0 flex-1 items-center gap-2.5'>
                  <InitialsAvatar initials={initials} size={26} />
                  <span className='truncate text-[13px] font-medium text-foreground'>{fullName}</span>
                  {isSelf && (
                    <span className='shrink-0 rounded-[4px] bg-primary/10 px-1.5 py-[1px] text-[10px] font-semibold text-primary'>
                      You
                    </span>
                  )}
                </div>

                {/* Email */}
                <div className='hidden min-w-0 flex-1 sm:block'>
                  <span className='block text-[13px] text-text-tertiary'>{user.email}</span>
                </div>

                {/* Role */}
                <div className='w-[80px] shrink-0'>
                  <RoleBadge role={user.role} />
                </div>

                {/* Active toggle */}
                <div className='flex w-[60px] shrink-0 justify-center'>
                  <UserStatusToggle user={user} currentUserId={currentUser?.id} />
                </div>

                {/* Actions */}
                <div className='flex w-[56px] shrink-0 items-center justify-end gap-1 opacity-0 transition-opacity duration-75 group-hover/row:opacity-100'>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type='button'
                        className='inline-flex size-7 items-center justify-center rounded-[6px] text-text-quaternary transition-colors duration-75 hover:bg-bg-active hover:text-foreground'
                        onClick={() => setModalUser(user)}
                      >
                        <Pencil className='size-3.5' />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Edit</TooltipContent>
                  </Tooltip>
                  {!isSelf && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type='button'
                          className='inline-flex size-7 items-center justify-center rounded-[6px] text-text-quaternary transition-colors duration-75 hover:bg-destructive/10 hover:text-destructive'
                          onClick={() => setDeleteUser(user)}
                        >
                          <Trash2 className='size-3.5' />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      <UserModal
        key={editingUser?.id ?? 'create'}
        open={modalUser !== null}
        onOpenChange={(open) => !open && setModalUser(null)}
        user={editingUser}
      />
      <UserDeleteDialog
        user={deleteUser}
        open={!!deleteUser}
        onOpenChange={(open) => !open && setDeleteUser(null)}
      />
    </div>
  )
}
