import { useQuery } from '@tanstack/react-query'
import { ChevronsUpDown, Search, Users, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

import { getCustomersQuery } from '@/api/customer/query'
import type { Customer } from '@/api/customer/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
    <Popover
      open={open}
      onOpenChange={handleOpenChange}
    >
      <div className='flex gap-2'>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            className='w-full justify-between font-normal'
          >
            {value ? (
              <span className='flex items-center gap-2 truncate'>
                <span className='font-semibold'>{value.id}</span>
                <span className='truncate'>{value.l_name}</span>
                {value.contact_1 && (
                  <span className='text-muted-foreground text-xs'>{value.contact_1}</span>
                )}
              </span>
            ) : (
              <span className='text-muted-foreground'>{placeholder}</span>
            )}
            <ChevronsUpDown className='ml-auto size-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        {value && (
          <Button
            variant='ghost'
            size='icon'
            className='shrink-0'
            onClick={() => onChange(null)}
          >
            <X className='size-4' />
          </Button>
        )}
      </div>
      <PopoverContent
        className='w-(--radix-popover-trigger-width) p-0'
        align='start'
      >
        <div className='flex items-center gap-2 border-b px-3 py-2'>
          {loading ? (
            <Spinner className='size-4 shrink-0' />
          ) : (
            <Search className='size-4 shrink-0 opacity-50' />
          )}
          <Input
            ref={inputRef}
            placeholder='Search by name or ID...'
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className='h-8 border-0 p-0 shadow-none focus-visible:ring-0'
          />
        </div>
        <div
          className='max-h-64 overflow-y-auto overscroll-contain'
          onWheel={(e) => e.stopPropagation()}
        >
          {loading && customers.length === 0 ? (
            <div className='space-y-2 p-2'>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className='h-10 w-full'
                />
              ))}
            </div>
          ) : customers.length === 0 ? (
            <div className='p-1'>
              {showAllOption && (
                <button
                  type='button'
                  className='hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-medium'
                  onClick={handleSelectAll}
                >
                  All customers
                </button>
              )}
              <div className='text-muted-foreground flex flex-col items-center gap-2 py-6'>
                <Users className='size-6 opacity-50' />
                <span className='text-sm'>
                  {search ? 'No customers found' : 'Start typing to search'}
                </span>
              </div>
            </div>
          ) : (
            <div className='p-1'>
              {showAllOption && (
                <button
                  type='button'
                  className='hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-medium'
                  onClick={handleSelectAll}
                >
                  All customers
                </button>
              )}
              {customers.map((c) => (
                <button
                  key={c.id}
                  type='button'
                  className='group hover:bg-accent hover:text-accent-foreground flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm'
                  onClick={() => handleSelect(c)}
                >
                  <div className='group-hover:text-accent-foreground flex min-w-0 gap-2'>
                    <span className='font-semibold'>{c.id}</span>
                    <span className='truncate'>{c.l_name}</span>
                  </div>
                  <div className='text-muted-foreground group-hover:text-accent-foreground flex shrink-0 items-center gap-2 text-xs'>
                    {c.contact_1 && <span>{c.contact_1}</span>}
                    {c.city && c.state && (
                      <span>
                        {c.city}, {c.state}
                      </span>
                    )}
                    {c.inactive && (
                      <span className='bg-muted rounded px-1.5 py-0.5 text-[10px]'>Inactive</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

