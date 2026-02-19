import { ChevronsUpDown, Search, User, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDebouncedCallback } from 'use-debounce'

import type { User as UserType } from '@/api/user/schema'
import { getUsersQuery } from '@/api/user/query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'

interface UserComboboxProps {
  value: number | null
  onChange: (userId: number | null) => void
}

export function UserCombobox({ value, onChange }: UserComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const updateDebouncedSearch = useDebouncedCallback((q: string) => setDebouncedSearch(q), 300)

  useEffect(() => {
    if (open) {
      setSearch('')
      setDebouncedSearch('')
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  useEffect(() => {
    if (open) updateDebouncedSearch(search)
  }, [open, search, updateDebouncedSearch])

  const params = { limit: 50, offset: 0, search: debouncedSearch || undefined }
  const { data, isLoading, isFetching } = useQuery({
    ...getUsersQuery(params),
    enabled: open,
  })
  const users = data?.results ?? []
  const loading = isLoading || (search !== debouncedSearch && isFetching)

  useEffect(() => {
    if (value != null && users.length > 0) {
      const u = users.find((x) => x.id === value)
      if (u) setSelectedUser(u)
    } else if (value == null) {
      setSelectedUser(null)
    }
  }, [value, users])

  const handleSearchChange = (q: string) => {
    setSearch(q)
    updateDebouncedSearch(q)
  }

  const handleSelect = (user: UserType) => {
    setSelectedUser(user)
    onChange(user.id)
    setOpen(false)
  }

  const displayLabel = selectedUser
    ? `${selectedUser.first_name} ${selectedUser.last_name}`
    : value != null
      ? `User #${value}`
      : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className='flex gap-2'>
        <PopoverTrigger asChild>
          <Button variant='outline' className='w-full justify-between font-normal'>
            {displayLabel ? (
              <span className='truncate'>{displayLabel}</span>
            ) : (
              <span className='text-muted-foreground'>Select user...</span>
            )}
            <ChevronsUpDown className='ml-auto size-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        {(value != null || selectedUser) && (
          <Button
            variant='ghost'
            size='icon'
            className='shrink-0'
            onClick={() => {
              setSelectedUser(null)
              onChange(null)
            }}
          >
            <X className='size-4' />
          </Button>
        )}
      </div>
      <PopoverContent className='w-(--radix-popover-trigger-width) p-0' align='start'>
        <div className='flex items-center gap-2 border-b px-3 py-2'>
          {loading ? (
            <Spinner className='size-4 shrink-0' />
          ) : (
            <Search className='size-4 shrink-0 opacity-50' />
          )}
          <Input
            ref={inputRef}
            placeholder='Search by name or email...'
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className='h-8 border-0 p-0 shadow-none focus-visible:ring-0'
          />
        </div>
        <div
          className='max-h-64 overflow-y-auto overscroll-contain'
          onWheel={(e) => e.stopPropagation()}
        >
          {loading && users.length === 0 ? (
            <div className='space-y-2 p-2'>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className='h-10 w-full' />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className='text-muted-foreground flex flex-col items-center gap-2 py-8'>
              <User className='size-6 opacity-50' />
              <span className='text-sm'>
                {search ? 'No users found' : 'Start typing to search'}
              </span>
            </div>
          ) : (
            <div className='p-1'>
              <button
                type='button'
                className='group hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm'
                onClick={() => {
                  onChange(null)
                  setSelectedUser(null)
                  setOpen(false)
                }}
              >
                <span className='text-muted-foreground group-hover:text-accent-foreground'>
                  Unassigned
                </span>
              </button>
              {users.map((u) => (
                <button
                  key={u.id}
                  type='button'
                  className='group hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm'
                  onClick={() => handleSelect(u)}
                >
                  <span className='truncate group-hover:text-accent-foreground'>
                    {u.first_name} {u.last_name}
                  </span>
                  <span className='text-muted-foreground truncate text-xs group-hover:text-accent-foreground'>
                    {u.email}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
