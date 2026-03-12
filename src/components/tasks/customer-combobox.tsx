import { useQuery } from '@tanstack/react-query'
import { ChevronsUpDown, Search, Users, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

import { getCustomersQuery } from '@/api/customer/query'
import type { Customer } from '@/api/customer/schema'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'

interface TaskCustomerComboboxProps {
  value: string | null
  onChange: (customerId: string | null) => void
  projectId?: number | null
  placeholder?: string
  valueLabel?: string | null
  triggerClassName?: string
}

export const TaskCustomerCombobox = ({ value, onChange, projectId, placeholder = 'Select customer...', valueLabel, triggerClassName }: TaskCustomerComboboxProps) => {
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
      ? (customers.find((x) => x.autoid === value) ?? {
          autoid: value,
          l_name: `Customer ${value}`
        })
      : null

  const displayLabel = valueLabel
    ?? (displayCustomer
      ? `${displayCustomer.l_name}`
      : null)

  const handleSearchChange = (q: string) => {
    setSearch(q)
    updateDebouncedSearch(q)
  }

  const handleSelect = (customer: Customer) => {
    onChange(customer.autoid)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      {triggerClassName ? (
        <PopoverTrigger asChild>
          <button type='button' className={triggerClassName}>
            {displayLabel ? (
              <span className='truncate'>{displayLabel}</span>
            ) : (
              <span>{placeholder}</span>
            )}
            <ChevronsUpDown className='ml-auto size-3 shrink-0 text-text-tertiary' />
          </button>
        </PopoverTrigger>
      ) : (
        <div className='flex min-w-0 gap-2'>
          <PopoverTrigger asChild>
            <Button variant='outline' className='min-w-0 flex-1 justify-between font-normal'>
              {displayLabel ? (
                <span className='truncate'>{displayLabel}</span>
              ) : (
                <span className='text-text-tertiary'>{placeholder}</span>
              )}
              <ChevronsUpDown className='ml-auto size-4 shrink-0 opacity-50' />
            </Button>
          </PopoverTrigger>
          {value != null && (
            <Button variant='ghost' size='icon' className='shrink-0' onClick={() => onChange(null)}>
              <X className='size-4' />
            </Button>
          )}
        </div>
      )}
      <PopoverContent
        className='w-80 overflow-hidden rounded-lg border-border p-0'
        align='start'
        style={{ boxShadow: 'var(--dropdown-shadow)' }}
      >
        <div className='flex items-center gap-1.5 border-b border-border px-2.5 py-[6px]'>
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
            className='flex-1 bg-transparent text-[13px] font-medium outline-none placeholder:text-text-tertiary'
          />
        </div>
        <div
          className='max-h-80 overflow-y-auto overscroll-contain p-1'
          onWheel={(e) => e.stopPropagation()}
        >
          {loading && customers.length === 0 ? (
            <div className='space-y-1'>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className='h-10 w-full rounded-[6px]' />
              ))}
            </div>
          ) : customers.length === 0 ? (
            <div className='flex flex-col items-center gap-2 py-6 text-text-tertiary'>
              <Users className='size-5 opacity-50' />
              <span className='text-[13px]'>
                {search ? 'No customers found' : 'Start typing to search'}
              </span>
            </div>
          ) : (
            <>
              {value && (
                <button
                  type='button'
                  className='flex w-full items-center gap-2 rounded-[6px] px-2.5 py-[7px] text-left text-[13px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-destructive/10 hover:text-destructive'
                  onClick={() => { onChange(null); setOpen(false) }}
                >
                  <X className='size-3.5 shrink-0' />
                  Remove customer
                </button>
              )}
              {customers.map((c) => {
                const location = [c.city, c.state].filter(Boolean).join(', ')
                const subtitle = [c.contact_1, location].filter(Boolean).join(' · ')
                return (
                  <button
                    key={c.autoid}
                    type='button'
                    className='flex w-full flex-col rounded-[6px] px-2.5 py-[7px] text-left transition-colors duration-[80ms] hover:bg-bg-hover'
                    onClick={() => handleSelect(c)}
                  >
                    <span className='truncate text-[13px] font-medium'>
                      <span className='font-semibold'>{c.autoid}</span>
                      {c.l_name && <span className='text-foreground'> — {c.l_name}</span>}
                    </span>
                    {subtitle && (
                      <span className='truncate text-[12px] text-text-tertiary'>{subtitle}</span>
                    )}
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
