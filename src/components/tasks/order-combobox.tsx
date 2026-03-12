import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ChevronsUpDown, Search, ShoppingCart, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

import { getOrdersQuery } from '@/api/order/query'
import type { Order, OrderParams } from '@/api/order/schema'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'

interface OrderComboboxProps {
  value: string | null
  onChange: (autoid: string | null) => void
  projectId?: number | null
  placeholder?: string
  valueLabel?: string | null
  triggerClassName?: string
}

export const OrderCombobox = ({ value, onChange, projectId, placeholder = 'Select order...', valueLabel, triggerClassName }: OrderComboboxProps) => {
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

  const params: OrderParams = {
    limit: 20,
    search: debouncedSearch || undefined,
    project_id: projectId ?? undefined
  }
  const { data, isLoading, isFetching } = useQuery({
    ...getOrdersQuery(params),
    enabled: open,
    staleTime: 30_000,
    placeholderData: keepPreviousData
  })
  const orders = data?.results ?? []
  const loading = isLoading || (search !== debouncedSearch && isFetching)
  const selectedOrder =
    value != null && orders.length > 0 ? (orders.find((x) => x.autoid === value) ?? null) : null

  const handleSearchChange = (q: string) => {
    setSearch(q)
    updateDebouncedSearch(q)
  }

  const handleSelect = (order: Order) => {
    onChange(order.autoid)
    setOpen(false)
  }

  const displayLabel = valueLabel
    ?? (selectedOrder
      ? `${selectedOrder.invoice}${selectedOrder.name ? ` — ${selectedOrder.name}` : ''}`
      : value
        ? `Order ${value}`
        : null)

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
          {value && (
            <Button variant='ghost' size='icon' className='shrink-0' onClick={() => onChange(null)}>
              <X className='size-4' />
            </Button>
          )}
        </div>
      )}
      <PopoverContent
        className='w-64 overflow-hidden rounded-lg border-border p-0'
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
            placeholder='Search by invoice or name...'
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className='flex-1 bg-transparent text-[13px] font-medium outline-none placeholder:text-text-tertiary'
          />
        </div>
        <div
          className='max-h-64 overflow-y-auto overscroll-contain p-1'
          onWheel={(e) => e.stopPropagation()}
        >
          {loading && orders.length === 0 ? (
            <div className='space-y-1'>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className='h-8 w-full rounded-[6px]' />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className='flex flex-col items-center gap-2 py-6 text-text-tertiary'>
              <ShoppingCart className='size-5 opacity-50' />
              <span className='text-[13px]'>
                {search ? 'No orders found' : 'Start typing to search'}
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
                  Remove order
                </button>
              )}
              {orders.map((o) => (
                <button
                  key={o.autoid}
                  type='button'
                  className='flex w-full flex-col gap-0.5 rounded-[6px] px-2.5 py-[7px] text-left text-[13px] font-medium transition-colors duration-[80ms] hover:bg-bg-hover'
                  onClick={() => handleSelect(o)}
                >
                  <span className='font-medium'>{o.invoice}</span>
                  {o.name && (
                    <span className='truncate text-[13px] text-text-tertiary'>{o.name}</span>
                  )}
                </button>
              ))}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
