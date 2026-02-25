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

interface TaskCustomerComboboxProps {
  value: string | null
  onChange: (customerId: string | null) => void
  projectId?: number | null
}

export function TaskCustomerCombobox({ value, onChange, projectId }: TaskCustomerComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const updateDebouncedSearch = useDebouncedCallback((q: string) => setDebouncedSearch(q), 300)

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
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

  const displayCustomer =
    value != null
      ? (customers.find((x) => x.id === value) ?? { id: value, l_name: `Customer ${value}` })
      : null
  const displayLabel = displayCustomer ? `${displayCustomer.id} — ${displayCustomer.l_name}` : null

  const handleSearchChange = (q: string) => {
    setSearch(q)
    updateDebouncedSearch(q)
  }

  const handleSelect = (customer: Customer) => {
    onChange(customer.id)
    setOpen(false)
  }

  const handleClear = () => onChange(null)

  return (
    <Popover
      open={open}
      onOpenChange={handleOpenChange}
    >
      <div className='flex min-w-0 gap-2'>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            className='min-w-0 flex-1 justify-between font-normal'
          >
            {displayLabel ? (
              <span className='truncate'>{displayLabel}</span>
            ) : (
              <span className='text-muted-foreground'>Select customer...</span>
            )}
            <ChevronsUpDown className='ml-auto size-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        {value != null && (
          <Button
            variant='ghost'
            size='icon'
            className='shrink-0'
            onClick={handleClear}
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
            <div className='text-muted-foreground flex flex-col items-center gap-2 py-8'>
              <Users className='size-6 opacity-50' />
              <span className='text-sm'>
                {search ? 'No customers found' : 'Start typing to search'}
              </span>
            </div>
          ) : (
            <div className='p-1'>
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
                  {c.contact_1 && (
                    <span className='text-muted-foreground group-hover:text-accent-foreground shrink-0 text-xs'>
                      {c.contact_1}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

