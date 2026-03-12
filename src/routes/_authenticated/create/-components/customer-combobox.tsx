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
      <PopoverTrigger asChild>
        <Button variant='outline' className='w-full justify-between font-normal'>
          {value ? (
            <span className='min-w-0 truncate text-[13px] font-medium' title={`${value.id} — ${value.l_name}`}>
              {value.l_name}
            </span>
          ) : (
            <span className='text-text-tertiary'>{placeholder}</span>
          )}
          {value ? (
            <span
              role='button'
              tabIndex={0}
              className='ml-auto shrink-0 rounded-[3px] p-0.5 text-text-tertiary transition-colors hover:bg-bg-active hover:text-foreground'
              onClick={(e) => {
                e.stopPropagation()
                onChange(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation()
                  onChange(null)
                }
              }}
            >
              <X className='size-3.5' />
            </span>
          ) : (
            <ChevronsUpDown className='ml-auto size-4 shrink-0 opacity-50' />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='min-w-[400px] w-(--radix-popover-trigger-width) p-0' align='start'>
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
        <div className='max-h-80 overflow-y-auto overscroll-contain' onWheel={(e) => e.stopPropagation()}>
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
                <span className='text-[13px]'>{search ? 'No customers found' : 'Start typing to search'}</span>
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
                const meta = [c.contact_1, c.city && c.state ? `${c.city}, ${c.state}` : null].filter(Boolean)
                return (
                  <button
                    key={c.id}
                    type='button'
                    className='flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-bg-hover'
                    onClick={() => handleSelect(c)}
                  >
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-1.5'>
                        <span className='shrink-0 text-[13px] font-semibold tabular-nums text-foreground'>{c.id}</span>
                        <span className='text-[13px] text-text-quaternary'>—</span>
                        <span className='truncate text-[13px] text-text-secondary'>{c.l_name}</span>
                        {c.inactive && (
                          <span className='shrink-0 rounded border border-border px-1.5 py-px text-[11px] font-medium text-text-tertiary'>Inactive</span>
                        )}
                      </div>
                      {meta.length > 0 && (
                        <div className='truncate text-[12px] text-text-tertiary'>{meta.join(' · ')}</div>
                      )}
                    </div>
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
