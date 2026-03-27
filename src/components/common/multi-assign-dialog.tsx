import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, UserPlus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

import type { AssignedUser, EntityAssignRequest } from '@/api/schema'
import { getUsersQuery } from '@/api/user/query'
import { InitialsAvatar } from '@/components/ds'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { getUserDisplayName } from '@/helpers/formatters'

interface MultiAssignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Display label (e.g. "order 1234") */
  entityLabel: string
  /** Currently assigned users */
  assignedUsers: AssignedUser[]
  /** Calls the entity's assign endpoint */
  assignFn: (payload: EntityAssignRequest) => Promise<unknown>
  /** Query keys to invalidate after assign/unassign */
  invalidateQueryKey: readonly unknown[]
  projectId?: number | null
}

export function MultiAssignDialog({
  open,
  onOpenChange,
  entityLabel,
  assignedUsers,
  assignFn,
  invalidateQueryKey,
}: MultiAssignDialogProps) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [localAssigned, setLocalAssigned] = useState<AssignedUser[]>(assignedUsers)

  // Sync local state when prop changes (e.g. after query refetch on detail pages)
  useEffect(() => {
    setLocalAssigned(assignedUsers)
  }, [assignedUsers])

  const updateDebouncedSearch = useDebouncedCallback((q: string) => setDebouncedSearch(q), 300)

  const handleSearchChange = (q: string) => {
    setSearch(q)
    updateDebouncedSearch(q)
  }

  const params = { limit: 50, offset: 0, search: debouncedSearch || undefined, role: 'sale' as const }
  const { data, isLoading, isFetching } = useQuery({
    ...getUsersQuery(params),
    enabled: open,
  })
  const users = data?.results ?? []
  const loading = isLoading || (search !== debouncedSearch && isFetching)

  const assignedIds = new Set(localAssigned.map((u) => u.id))

  const assignMutation = useMutation({
    mutationFn: assignFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateQueryKey })
    },
    onError: () => {
      // Revert optimistic update on failure
      setLocalAssigned(assignedUsers)
    },
    meta: { errorMessage: 'Failed to update assignment' },
  })

  const handleAssign = (userId: number) => {
    const user = users.find((u) => u.id === userId)
    if (user) {
      setLocalAssigned((prev) => [...prev, { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name }])
    }
    assignMutation.mutate({ user_id: userId })
  }

  const handleUnassign = (userId: number) => {
    setLocalAssigned((prev) => prev.filter((u) => u.id !== userId))
    assignMutation.mutate({ user_id: userId, remove: true })
  }

  const handleUnassignAll = () => {
    setLocalAssigned([])
    assignMutation.mutate({ user_id: null })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setSearch('')
          setDebouncedSearch('')
        }
        onOpenChange(next)
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <UserPlus className='size-5' />
            Assign users
          </DialogTitle>
        </DialogHeader>
        <DialogBody className='flex flex-col gap-4'>
          <p className='text-[13px] text-text-tertiary'>
            Manage assigned users for{' '}
            <span className='font-medium text-foreground'>{entityLabel}</span>.
          </p>

          {/* Currently assigned */}
          {localAssigned.length > 0 && (
            <div className='flex flex-col gap-1.5'>
              <span className='text-[11px] font-medium uppercase tracking-wider text-text-quaternary'>
                Assigned ({localAssigned.length})
              </span>
              <div className='flex flex-wrap gap-1.5'>
                {localAssigned.map((user) => {
                  const name = getUserDisplayName(user)
                  const initials = name
                    .split(' ')
                    .slice(0, 2)
                    .map((n) => n[0]?.toUpperCase() ?? '')
                    .join('')
                  return (
                    <span
                      key={user.id}
                      className='inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-secondary py-0.5 pl-1 pr-1.5 text-[12px] font-medium text-foreground'
                    >
                      <InitialsAvatar initials={initials} size={18} />
                      <span className='max-w-[120px] truncate'>{name}</span>
                      <button
                        type='button'
                        className='inline-flex size-4 items-center justify-center rounded-full text-text-tertiary transition-colors hover:bg-destructive/10 hover:text-destructive'
                        onClick={() => handleUnassign(user.id)}
                        disabled={assignMutation.isPending}
                      >
                        <X className='size-3' />
                      </button>
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Search & add */}
          <div className='overflow-hidden rounded-lg border border-border'>
            <div className='flex items-center gap-1.5 border-b border-border px-2.5 py-[6px]'>
              {loading ? (
                <Spinner className='size-3.5 shrink-0' />
              ) : (
                <Search className='size-3.5 shrink-0 text-text-tertiary' />
              )}
              <input
                ref={inputRef}
                placeholder='Search users to add...'
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className='flex-1 bg-transparent text-[13px] font-medium outline-none placeholder:text-text-tertiary'
                autoFocus
              />
            </div>
            <div className='max-h-48 overflow-y-auto overscroll-contain p-1'>
              {loading && users.length === 0 ? (
                <div className='space-y-1'>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className='h-8 w-full rounded-[6px]' />
                  ))}
                </div>
              ) : users.length === 0 ? (
                <div className='py-4 text-center text-[13px] text-text-tertiary'>
                  {search ? 'No users found' : 'Start typing to search'}
                </div>
              ) : (
                users.map((u) => {
                  const isAssigned = assignedIds.has(u.id)
                  const fullName = getUserDisplayName(u)
                  const initials = fullName
                    .split(' ')
                    .slice(0, 2)
                    .map((n) => n[0]?.toUpperCase() ?? '')
                    .join('')
                  return (
                    <button
                      key={u.id}
                      type='button'
                      disabled={isAssigned || assignMutation.isPending}
                      className='flex w-full items-center gap-2 rounded-[6px] px-2.5 py-[7px] text-left text-[13px] font-medium transition-colors duration-[80ms] hover:bg-bg-hover disabled:opacity-50'
                      onClick={() => handleAssign(u.id)}
                    >
                      <InitialsAvatar initials={initials} size={20} />
                      <span className='flex-1 truncate'>{fullName || '\u2014'}</span>
                      {isAssigned && (
                        <span className='shrink-0 text-[11px] text-text-tertiary'>Assigned</span>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          {localAssigned.length > 0 && (
            <Button
              variant='outline'
              className='mr-auto text-destructive hover:bg-destructive/10 hover:text-destructive'
              onClick={handleUnassignAll}
              isPending={assignMutation.isPending}
            >
              Remove all
            </Button>
          )}
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
