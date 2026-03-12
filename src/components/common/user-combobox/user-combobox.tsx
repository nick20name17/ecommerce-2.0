import { useQuery } from '@tanstack/react-query'
import { Check, ChevronsUpDown, Search, User, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

import { getUsersQuery } from '@/api/user/query'
import type { User as UserType } from '@/api/user/schema'
import { InitialsAvatar } from '@/components/ds'
import { USER_ROLE_LABELS } from '@/constants/user'
import type { UserRole } from '@/constants/user'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'

interface UserComboboxProps {
  value: number | null
  onChange: (userId: number | null) => void
  placeholder?: string
  role?: string
  valueLabel?: string | null
  triggerClassName?: string
  triggerIcon?: React.ReactNode
}

export function UserCombobox({
  value,
  onChange,
  placeholder = 'Select user...',
  role,
  valueLabel,
  triggerClassName,
  triggerIcon,
}: UserComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const updateDebouncedSearch = useDebouncedCallback((q: string) => setDebouncedSearch(q), 300)

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      setSearch('')
      setDebouncedSearch('')
      queueMicrotask(() => inputRef.current?.focus())
    }
  }

  const params = {
    limit: 50,
    offset: 0,
    search: debouncedSearch || undefined,
    role
  }
  const { data, isLoading, isFetching } = useQuery({
    ...getUsersQuery(params),
    enabled: open
  })
  const users = data?.results ?? []
  const loading = isLoading || (search !== debouncedSearch && isFetching)
  const selectedUser =
    value != null && users.length > 0 ? (users.find((x) => x.id === value) ?? null) : null

  const handleSearchChange = (q: string) => {
    setSearch(q)
    updateDebouncedSearch(q)
  }

  const handleSelect = (user: UserType) => {
    onChange(user.id)
    setOpen(false)
  }

  const displayLabel = selectedUser
    ? `${selectedUser.first_name} ${selectedUser.last_name}`
    : value != null
      ? (valueLabel ?? `User #${value}`)
      : null

  const displayInitials = displayLabel
    ? displayLabel.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase() ?? '').join('')
    : null

  return (
    <Popover
      open={open}
      onOpenChange={handleOpenChange}
    >
      <PopoverTrigger asChild>
        {triggerClassName ? (
          <button type='button' className={triggerClassName}>
            {displayLabel ? (
              <>
                {triggerIcon ?? <InitialsAvatar initials={displayInitials!} size={18} />}
                <span className='truncate'>{displayLabel}</span>
              </>
            ) : (
              <>
                {triggerIcon}
                <span>{placeholder}</span>
              </>
            )}
            {!triggerIcon && <ChevronsUpDown className='ml-auto size-3 shrink-0 text-text-tertiary' />}
          </button>
        ) : (
          <button
            type='button'
            className='flex h-9 min-w-0 w-full items-center justify-between gap-2 rounded-[6px] border border-input bg-background px-3 text-[13px] font-medium shadow-sm transition-colors duration-[80ms] hover:bg-bg-hover'
          >
            {displayLabel ? (
              <span className='flex items-center gap-2 truncate'>
                <InitialsAvatar initials={displayInitials!} size={18} />
                <span className='truncate'>{displayLabel}</span>
              </span>
            ) : (
              <span className='text-text-tertiary'>{placeholder}</span>
            )}
            <ChevronsUpDown className='ml-auto size-3 shrink-0 text-text-tertiary' />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        className='w-64 overflow-hidden rounded-lg border-border p-0'
        align='start'
        style={{
          boxShadow: 'var(--dropdown-shadow)',
          animation: 'dropIn 0.15s ease',
        }}
      >
        <div className='flex items-center gap-1.5 border-b border-border px-2.5 py-[6px]'>
          {loading ? (
            <Spinner className='size-3.5 shrink-0' />
          ) : (
            <Search className='size-3.5 shrink-0 text-text-tertiary' />
          )}
          <input
            ref={inputRef}
            placeholder='Search by name or email...'
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className='flex-1 bg-transparent text-[13px] font-medium outline-none placeholder:text-text-tertiary'
          />
        </div>
        <div
          className='max-h-64 overflow-y-auto overscroll-contain p-1'
          onWheel={(e) => e.stopPropagation()}
        >
          {loading && users.length === 0 ? (
            <div className='space-y-1'>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className='h-8 w-full rounded-[6px]' />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className='flex flex-col items-center gap-2 py-6 text-text-tertiary'>
              <User className='size-5 opacity-50' />
              <span className='text-[13px]'>
                {search ? 'No users found' : 'Start typing to search'}
              </span>
            </div>
          ) : (
            <>
              {(value != null || selectedUser) && (
                <button
                  type='button'
                  className='flex w-full items-center gap-2 rounded-[6px] px-2.5 py-[7px] text-left text-[13px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-destructive/10 hover:text-destructive'
                  onClick={() => {
                    onChange(null)
                    setOpen(false)
                  }}
                >
                  <X className='size-3.5 shrink-0' />
                  Remove assignee
                </button>
              )}
              {users.map((u) => {
                const selected = u.id === value
                const fullName = `${u.first_name} ${u.last_name}`.trim()
                const initials = fullName
                  ? fullName.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase() ?? '').join('')
                  : '\u2014'
                return (
                  <button
                    key={u.id}
                    type='button'
                    className='flex w-full items-center gap-2 rounded-[6px] px-2.5 py-[7px] text-left text-[13px] font-medium transition-colors duration-[80ms] hover:bg-bg-hover'
                    onClick={() => handleSelect(u)}
                  >
                    <InitialsAvatar initials={initials} size={20} />
                    <span className='flex-1 truncate'>
                      {fullName || '\u2014'}
                    </span>
                    <span className='shrink-0 text-[13px] text-text-tertiary'>
                      {USER_ROLE_LABELS[u.role as UserRole] ?? u.role}
                    </span>
                    {selected && <Check className='size-3.5 shrink-0 text-primary' strokeWidth={2} />}
                  </button>
                )
              })}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
