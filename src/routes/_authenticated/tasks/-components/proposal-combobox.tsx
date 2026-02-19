import { ChevronsUpDown, FileText, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDebouncedCallback } from 'use-debounce'

import type { Proposal } from '@/api/proposal/schema'
import { getProposalsQuery } from '@/api/proposal/query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'

interface ProposalComboboxProps {
  value: string | null
  onChange: (autoid: string | null) => void
  projectId?: number | null
}

export function ProposalCombobox({ value, onChange, projectId }: ProposalComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
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

  const params = {
    limit: 50,
    search: debouncedSearch || undefined,
    project_id: projectId ?? undefined,
  }
  const { data, isLoading, isFetching } = useQuery({
    ...getProposalsQuery(params),
    enabled: open,
  })
  const proposals = data?.results ?? []
  const loading = isLoading || (search !== debouncedSearch && isFetching)

  useEffect(() => {
    if (value != null && proposals.length > 0) {
      const p = proposals.find((x) => x.autoid === value)
      if (p) setSelectedProposal(p)
    } else if (value == null) {
      setSelectedProposal(null)
    }
  }, [value, proposals])

  const handleSearchChange = (q: string) => {
    setSearch(q)
    updateDebouncedSearch(q)
  }

  const handleSelect = (proposal: Proposal) => {
    setSelectedProposal(proposal)
    onChange(proposal.autoid)
    setOpen(false)
  }

  const displayLabel = selectedProposal
    ? `${selectedProposal.quote}${selectedProposal.b_name ? ` — ${selectedProposal.b_name}` : ''}`
    : value
      ? `Proposal ${value}`
      : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className='flex gap-2'>
        <PopoverTrigger asChild>
          <Button variant='outline' className='w-full justify-between font-normal'>
            {displayLabel ? (
              <span className='truncate'>{displayLabel}</span>
            ) : (
              <span className='text-muted-foreground'>Select proposal...</span>
            )}
            <ChevronsUpDown className='ml-auto size-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        {(value != null || selectedProposal) && (
          <Button
            variant='ghost'
            size='icon'
            className='shrink-0'
            onClick={() => {
              setSelectedProposal(null)
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
            placeholder='Search by quote or name...'
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className='h-8 border-0 p-0 shadow-none focus-visible:ring-0'
          />
        </div>
        <div
          className='max-h-64 overflow-y-auto overscroll-contain'
          onWheel={(e) => e.stopPropagation()}
        >
          {loading && proposals.length === 0 ? (
            <div className='space-y-2 p-2'>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className='h-10 w-full' />
              ))}
            </div>
          ) : proposals.length === 0 ? (
            <div className='text-muted-foreground flex flex-col items-center gap-2 py-8'>
              <FileText className='size-6 opacity-50' />
              <span className='text-sm'>
                {search ? 'No proposals found' : 'Start typing to search'}
              </span>
            </div>
          ) : (
            <div className='p-1'>
              {proposals.map((p) => (
                <button
                  key={p.autoid}
                  type='button'
                  className='group hover:bg-accent hover:text-accent-foreground flex w-full flex-col gap-0.5 rounded-md px-2 py-2 text-left text-sm'
                  onClick={() => handleSelect(p)}
                >
                  <span className='font-medium group-hover:text-accent-foreground'>{p.quote}</span>
                  {p.b_name && (
                    <span className='text-muted-foreground truncate text-xs group-hover:text-accent-foreground'>
                      {p.b_name}
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
