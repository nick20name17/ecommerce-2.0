import { useQuery } from '@tanstack/react-query'
import { Check, ChevronsUpDown, Search, Users, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

import { getCustomersQuery } from '@/api/customer/query'
import type { Customer } from '@/api/customer/schema'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'

interface CustomerComboboxProps {
  value: Customer | null
  onChange: (customer: Customer | null) => void
  projectId?: number | null
  placeholder?: string
  showAllOption?: boolean
}

export function CustomerCombobox({
  value,
  onChange,
  projectId,
  placeholder = 'Select customer...',
  showAllOption = false
}: CustomerComboboxProps) {
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
    search: debouncedSearch || undefined,
    project_id: projectId ?? undefined
  }
  const { data, isLoading, isFetching } = useQuery({
    ...getCustomersQuery(params),
    enabled: open
  })
  const customers = data?.results ?? []
  const loading = isLoading || (search !== debouncedSearch && isFetching)

  const handleSearchChange = (q: string) => {
    setSearch(q)
    updateDebouncedSearch(q)
  }

  const handleSelect = (customer: Customer) => {
    onChange(customer)
    setOpen(false)
  }

  const handleSelectAll = () => {
    onChange(null)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <div className='flex gap-2'>
        <PopoverTrigger asChild>
          <Button variant='outline' className='w-full justify-between font-normal'>
            {value ? (
              <span className='flex items-center gap-2 truncate'>
                <span className='font-medium'>{value.id}</span>
                <span className='truncate'>{value.l_name}</span>
                {value.contact_1 && (
                  <span className='text-xs text-text-tertiary'>{value.contact_1}</span>
                )}
              </span>
            ) : (
              <span className='text-text-tertiary'>{placeholder}</span>
            )}
            <ChevronsUpDown className='ml-auto size-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        {value && (
          <Button variant='ghost' size='icon' className='shrink-0' onClick={() => onChange(null)}>
            <X className='size-4' />
          </Button>
        )}
      </div>
      <PopoverContent className='w-(--radix-popover-trigger-width) p-0' align='start'>
        <div className='flex items-center gap-2 border-b px-3 py-2'>
          {loading ? (
            <Spinner className='size-3.5 shrink-0' />
          ) : (
            <Search className='size-3.5 shrink-0 text-text-tertiary' />
          )}
          <input
            ref={inputRef}
            placeholder='Search by name or ID...'
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className='h-5 flex-1 bg-transparent text-sm outline-none placeholder:text-text-tertiary'
          />
        </div>
        <div className='max-h-64 overflow-y-auto overscroll-contain' onWheel={(e) => e.stopPropagation()}>
          {loading && customers.length === 0 ? (
            <div className='p-1'>
              {showAllOption && (
                <button
                  type='button'
                  className='flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium transition-colors hover:bg-bg-hover'
                  onClick={handleSelectAll}
                >
                  All customers
                </button>
              )}
              <div className='space-y-1 py-1'>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className='h-8 w-full rounded-md' />
                ))}
              </div>
            </div>
          ) : customers.length === 0 ? (
            <div className='p-1'>
              {showAllOption && (
                <button
                  type='button'
                  className='flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium transition-colors hover:bg-bg-hover'
                  onClick={handleSelectAll}
                >
                  All customers
                </button>
              )}
              <div className='flex flex-col items-center gap-2 py-6 text-text-tertiary'>
                <Users className='size-5 opacity-50' />
                <span className='text-xs'>{search ? 'No customers found' : 'Start typing to search'}</span>
              </div>
            </div>
          ) : (
            <div className='p-1'>
              {showAllOption && (
                <button
                  type='button'
                  className='flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium transition-colors hover:bg-bg-hover'
                  onClick={handleSelectAll}
                >
                  All customers
                </button>
              )}
              {customers.map((c) => {
                const selected = value?.id === c.id
                return (
                  <button
                    key={c.id}
                    type='button'
                    className='flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-bg-hover'
                    onClick={() => handleSelect(c)}
                  >
                    <span className='shrink-0 font-medium'>{c.id}</span>
                    <span className='flex-1 truncate'>{c.l_name}</span>
                    <span className='flex shrink-0 items-center gap-2 text-xs text-text-tertiary'>
                      {c.contact_1 && <span>{c.contact_1}</span>}
                      {c.city && c.state && <span>{c.city}, {c.state}</span>}
                      {c.inactive && (
                        <span className='rounded bg-muted px-1.5 py-0.5 text-[10px]'>Inactive</span>
                      )}
                    </span>
                    {selected && <Check className='size-3.5 shrink-0 text-foreground' strokeWidth={2} />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
