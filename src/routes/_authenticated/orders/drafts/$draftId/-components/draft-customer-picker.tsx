import { useQuery } from '@tanstack/react-query'
import { Check, Search, Users, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

import { getCustomersQuery } from '@/api/customer/query'
import type { CustomerCandidate } from '@/api/draft-order/schema'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { formatScore } from '../../-components/draft-constants'

interface DraftCustomerPickerProps {
  value: string | null
  candidates: CustomerCandidate[]
  onChange: (id: string | null, name?: string) => void
  projectId: number | null
  disabled?: boolean
}

/**
 * Customer chooser for the draft review page: candidate chips from the
 * extraction + a search popover backed by the regular customer search
 * (adapted from CustomerCombobox).
 */
export function DraftCustomerPicker({
  value,
  candidates,
  onChange,
  projectId,
  disabled
}: DraftCustomerPickerProps) {
  // Remember the name of a customer picked via search (candidates carry their own).
  const [pickedName, setPickedName] = useState<string | null>(null)

  const chosenName = value
    ? (candidates.find(c => c.id === value)?.name ?? pickedName ?? null)
    : null

  if (value) {
    return (
      <div className='flex flex-wrap items-center gap-2'>
        <span className='inline-flex h-7 items-center gap-1.5 rounded-[5px] border border-green-200 bg-green-500/10 px-2 text-[13px] font-medium text-green-800 dark:border-green-800 dark:text-green-300'>
          <Check className='size-3.5 shrink-0' strokeWidth={2.5} />
          <span className='tabular-nums'>{value}</span>
          {chosenName && <span className='font-normal opacity-80'>— {chosenName}</span>}
          {!disabled && (
            <button
              type='button'
              aria-label='Clear customer'
              className='-mr-0.5 rounded-[3px] p-0.5 transition-colors hover:bg-green-500/20'
              onClick={() => {
                setPickedName(null)
                onChange(null)
              }}
            >
              <X className='size-3' />
            </button>
          )}
        </span>
      </div>
    )
  }

  return (
    <div className='flex flex-wrap items-center gap-1.5'>
      {candidates.map(candidate => (
        <button
          key={candidate.id}
          type='button'
          disabled={disabled}
          onClick={() => onChange(candidate.id, candidate.name)}
          className={cn(
            'inline-flex h-7 items-center gap-1.5 rounded-[5px] border border-border bg-background px-2 text-[13px]',
            'transition-colors duration-80 hover:border-primary/40 hover:bg-primary/5 disabled:pointer-events-none disabled:opacity-50'
          )}
        >
          <span className='font-medium tabular-nums'>{candidate.id}</span>
          <span className='max-w-44 truncate text-text-secondary'>{candidate.name}</span>
          <span className='text-[11px] text-text-tertiary tabular-nums'>
            {formatScore(candidate.score)}
          </span>
        </button>
      ))}
      <CustomerSearchPopover
        projectId={projectId}
        disabled={disabled}
        onPick={(id, name) => {
          setPickedName(name)
          onChange(id, name)
        }}
      />
    </div>
  )
}

function CustomerSearchPopover({
  projectId,
  disabled,
  onPick
}: {
  projectId: number | null
  disabled?: boolean
  onPick: (id: string, name: string) => void
}) {
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

  const { data, isLoading, isFetching } = useQuery({
    ...getCustomersQuery({
      limit: 50,
      search: debouncedSearch || undefined,
      project_id: projectId ?? undefined
    }),
    enabled: open
  })
  const customers = data?.results ?? []
  const loading = isLoading || (search !== debouncedSearch && isFetching)

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type='button'
          disabled={disabled}
          className='inline-flex h-7 items-center gap-1 rounded-[5px] border border-dashed border-border px-2 text-[13px] text-text-tertiary transition-colors duration-80 hover:bg-bg-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-50'
        >
          <Search className='size-3' />
          Search customers
        </button>
      </PopoverTrigger>
      <PopoverContent className='w-100 p-0' align='start'>
        <div className='flex items-center gap-2 border-b px-3 py-2'>
          {loading ? (
            <Spinner className='size-3.5 shrink-0' />
          ) : (
            <Search className='size-3.5 shrink-0 text-text-tertiary' />
          )}
          <input
            ref={inputRef}
            aria-label='Search customers'
            placeholder='Search by name or ID...'
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              updateDebouncedSearch(e.target.value)
            }}
            className='h-5 flex-1 bg-transparent text-sm outline-none placeholder:text-text-tertiary'
          />
        </div>
        <div
          className='max-h-80 overflow-y-auto overscroll-contain'
          onWheel={e => e.stopPropagation()}
        >
          {loading && customers.length === 0 ? (
            <div className='space-y-1 p-1 py-2'>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className='h-8 w-full rounded-md' />
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
            <div className='p-1'>
              {customers.map(c => (
                <button
                  key={c.id}
                  type='button'
                  className='flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-bg-hover'
                  onClick={() => {
                    onPick(c.id, c.l_name)
                    setOpen(false)
                  }}
                >
                  <span className='shrink-0 text-[13px] font-semibold text-foreground tabular-nums'>
                    {c.id}
                  </span>
                  <span className='text-[13px] text-text-tertiary'>—</span>
                  <span className='truncate text-[13px] text-text-secondary'>{c.l_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
