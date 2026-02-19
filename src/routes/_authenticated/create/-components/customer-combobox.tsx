import { useDebouncedCallback } from 'use-debounce'
import { useEffect, useRef, useState } from 'react'
import { ChevronsUpDown, Search, Users, X } from 'lucide-react'

import type { Customer } from '@/api/customer/schema'
import { customerService } from '@/api/customer/service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'

interface CustomerComboboxProps {
  value: Customer | null
  onChange: (customer: Customer | null) => void
  projectId?: number | null
}

export function CustomerCombobox({ value, onChange, projectId }: CustomerComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const requestIdRef = useRef(0)

  const fetchCustomers = async (query: string) => {
    const id = ++requestIdRef.current
    setLoading(true)
    try {
      const params: Record<string, unknown> = { limit: 50 }
      if (query) params.search = query
      if (projectId != null) params.project_id = projectId
      const res = await customerService.get(params)
      if (id === requestIdRef.current) setCustomers(res.results)
    } catch {
      if (id === requestIdRef.current) setCustomers([])
    } finally {
      if (id === requestIdRef.current) setLoading(false)
    }
  }

  const debouncedSearch = useDebouncedCallback((q: string) => fetchCustomers(q), 300)

  useEffect(() => {
    if (open) {
      fetchCustomers('')
      setTimeout(() => inputRef.current?.focus(), 0)
    } else {
      setSearch('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleSearchChange = (q: string) => {
    setSearch(q)
    setLoading(true)
    debouncedSearch(q)
  }

  const handleSelect = (customer: Customer) => {
    onChange(customer)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
              <span className='text-muted-foreground'>Select customer...</span>
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
          {loading ? <Spinner className='size-4 shrink-0' /> : <Search className='size-4 shrink-0 opacity-50' />}
          <Input
            ref={inputRef}
            placeholder='Search by name or ID...'
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className='h-8 border-0 p-0 shadow-none focus-visible:ring-0'
          />
        </div>
        <ScrollArea className='max-h-64'>
          {loading && customers.length === 0 ? (
            <div className='space-y-2 p-2'>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className='h-10 w-full' />
              ))}
            </div>
          ) : customers.length === 0 ? (
            <div className='text-muted-foreground flex flex-col items-center gap-2 py-8'>
              <Users className='size-6 opacity-50' />
              <span className='text-sm'>{search ? 'No customers found' : 'Start typing to search'}</span>
            </div>
          ) : (
            <div className='p-1'>
              {customers.map((c) => (
                <button
                  key={c.id}
                  type='button'
                  className='hover:bg-accent flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm'
                  onClick={() => handleSelect(c)}
                >
                  <div className='flex items-center gap-2 truncate'>
                    <span className='font-semibold'>{c.id}</span>
                    <span className='truncate'>{c.l_name}</span>
                  </div>
                  <div className='text-muted-foreground flex shrink-0 items-center gap-2 text-xs'>
                    {c.contact_1 && <span>{c.contact_1}</span>}
                    {c.city && c.state && <span>{c.city}, {c.state}</span>}
                    {c.inactive && (
                      <span className='bg-muted rounded px-1.5 py-0.5 text-[10px]'>Inactive</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
