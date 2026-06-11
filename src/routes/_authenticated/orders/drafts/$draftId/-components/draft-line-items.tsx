import { useQuery } from '@tanstack/react-query'
import { Check, Package, Plus, Search, Trash2, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

import type { DraftLineItem } from '@/api/draft-order/schema'
import { getProductsQuery } from '@/api/product/query'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { formatScore } from '../../-components/draft-constants'

const EMPTY_LINE: DraftLineItem = {
  qty: 1,
  unit: null,
  code: null,
  description: '',
  confidence: 1,
  product_id: null,
  candidates: []
}

const cellInputCls =
  'h-7 w-full rounded-[5px] border border-border bg-background px-1.5 text-[13px] outline-none transition-[border-color,box-shadow] focus:border-ring focus:ring-2 focus:ring-ring/50 disabled:pointer-events-none disabled:opacity-50'

interface DraftLineItemsProps {
  lines: DraftLineItem[]
  onChange: (lines: DraftLineItem[]) => void
  projectId: number | null
  disabled?: boolean
}

export function DraftLineItems({ lines, onChange, projectId, disabled }: DraftLineItemsProps) {
  const updateLine = (index: number, patch: Partial<DraftLineItem>) =>
    onChange(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)))

  const removeLine = (index: number) => onChange(lines.filter((_, i) => i !== index))

  const addLine = () => onChange([...lines, { ...EMPTY_LINE }])

  return (
    <div className='overflow-x-auto rounded-lg border border-border'>
      <div className='min-w-[560px]'>
        <div className='flex items-center gap-2 border-b border-border bg-bg-secondary px-3 py-1.5 text-[12px] font-medium text-text-tertiary select-none'>
          <div className='w-16 shrink-0'>Qty</div>
          <div className='w-14 shrink-0'>Unit</div>
          <div className='min-w-0 flex-1'>Description</div>
          <div className='w-56 shrink-0 xl:w-72'>Product</div>
          <div className='w-11 shrink-0 text-right'>Conf</div>
          <div className='w-6 shrink-0' />
        </div>

        {lines.length === 0 ? (
          <div className='flex flex-col items-center gap-1.5 py-8 text-text-tertiary'>
            <Package className='size-5 opacity-50' />
            <span className='text-[13px]'>No line items</span>
          </div>
        ) : (
          lines.map((line, index) => (
            <div
              key={index}
              className='flex items-start gap-2 border-b border-border-light px-3 py-2'
            >
              <div className='w-16 shrink-0'>
                <input
                  type='number'
                  min={0}
                  step='any'
                  aria-label='Quantity'
                  value={Number.isFinite(line.qty) ? line.qty : 0}
                  disabled={disabled}
                  onChange={e =>
                    updateLine(index, {
                      qty: e.target.value === '' ? 0 : Number(e.target.value)
                    })
                  }
                  className={cn(cellInputCls, 'text-right tabular-nums')}
                />
              </div>
              <div className='w-14 shrink-0'>
                <input
                  aria-label='Unit'
                  value={line.unit ?? ''}
                  disabled={disabled}
                  onChange={e => updateLine(index, { unit: e.target.value || null })}
                  className={cellInputCls}
                />
              </div>
              <div className='min-w-0 flex-1'>
                <input
                  aria-label='Description'
                  value={line.description}
                  maxLength={500}
                  disabled={disabled}
                  onChange={e => updateLine(index, { description: e.target.value })}
                  className={cellInputCls}
                />
                {line.code && (
                  <div className='mt-0.5 truncate text-[11px] text-text-tertiary tabular-nums'>
                    Code on sheet: {line.code}
                  </div>
                )}
              </div>
              <div className='w-56 shrink-0 xl:w-72'>
                <ProductCell
                  line={line}
                  disabled={disabled}
                  projectId={projectId}
                  onPick={id => updateLine(index, { product_id: id })}
                  onClear={() => updateLine(index, { product_id: null })}
                />
              </div>
              <div className='flex w-11 shrink-0 justify-end pt-1'>
                <span
                  className={cn(
                    'inline-block rounded border px-1 py-0.5 text-[11px] font-medium tabular-nums',
                    line.confidence < 0.7
                      ? 'border-amber-200 bg-amber-500/10 text-amber-700 dark:border-amber-800 dark:text-amber-400'
                      : 'border-border bg-bg-secondary text-text-tertiary'
                  )}
                >
                  {formatScore(line.confidence)}
                </span>
              </div>
              <div className='flex w-6 shrink-0 justify-end pt-1'>
                {!disabled && (
                  <button
                    type='button'
                    aria-label='Remove line'
                    title='Remove line'
                    onClick={() => removeLine(index)}
                    className='flex size-5.5 items-center justify-center rounded-[5px] text-text-tertiary transition-colors duration-100 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400'
                  >
                    <Trash2 className='size-3' />
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        {!disabled && (
          <div className='px-3 py-1.5'>
            <button
              type='button'
              onClick={addLine}
              className='inline-flex h-6.5 items-center gap-1 rounded-[5px] px-1.5 text-[12px] font-medium text-text-tertiary transition-colors duration-80 hover:bg-bg-hover hover:text-foreground'
            >
              <Plus className='size-3' />
              Add line
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Product cell: chosen product OR top-3 candidates + search ─

function ProductCell({
  line,
  onPick,
  onClear,
  projectId,
  disabled
}: {
  line: DraftLineItem
  onPick: (id: string) => void
  onClear: () => void
  projectId: number | null
  disabled?: boolean
}) {
  if (line.product_id) {
    const matched = line.candidates.find(c => c.id === line.product_id)
    return (
      <div className='flex h-7 min-w-0 items-center gap-1.5 px-0.5'>
        <Check className='size-3.5 shrink-0 text-green-600 dark:text-green-400' strokeWidth={2.5} />
        <span
          className='min-w-0 truncate text-[13px] font-medium tabular-nums'
          title={matched ? `${line.product_id} — ${matched.descr_1}` : line.product_id}
        >
          {line.product_id}
          {matched && <span className='font-normal text-text-tertiary'> — {matched.descr_1}</span>}
        </span>
        {!disabled && (
          <button
            type='button'
            aria-label='Clear product'
            title='Clear product'
            onClick={onClear}
            className='ml-auto shrink-0 rounded-[3px] p-0.5 text-text-tertiary transition-colors hover:bg-bg-active hover:text-foreground'
          >
            <X className='size-3' />
          </button>
        )}
      </div>
    )
  }

  const top = line.candidates.slice(0, 3)

  return (
    <div className='flex flex-col gap-0.5'>
      {top.map(candidate => (
        <button
          key={candidate.autoid}
          type='button'
          disabled={disabled}
          onClick={() => onPick(candidate.id)}
          title={`${candidate.id} — ${candidate.descr_1}`}
          className='flex w-full min-w-0 items-baseline gap-1 rounded-[5px] border border-border px-1.5 py-1 text-left text-[12px] transition-colors duration-80 hover:border-primary/40 hover:bg-primary/5 disabled:pointer-events-none disabled:opacity-50'
        >
          <span className='shrink-0 font-medium tabular-nums'>{candidate.id}</span>
          <span className='min-w-0 flex-1 truncate text-text-secondary'>{candidate.descr_1}</span>
          <span className='shrink-0 text-[11px] text-text-tertiary tabular-nums'>
            {formatScore(candidate.score)}
          </span>
        </button>
      ))}
      <ProductSearchPopover projectId={projectId} disabled={disabled} onPick={onPick} />
    </div>
  )
}

function ProductSearchPopover({
  projectId,
  disabled,
  onPick
}: {
  projectId: number | null
  disabled?: boolean
  onPick: (id: string) => void
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
    ...getProductsQuery({
      search: debouncedSearch,
      limit: 10,
      project_id: projectId ?? undefined
    }),
    enabled: open && debouncedSearch.length > 0
  })
  const products = data?.results ?? []
  const loading =
    debouncedSearch.length > 0 && (isLoading || (search !== debouncedSearch && isFetching))

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type='button'
          disabled={disabled}
          className='inline-flex h-6.5 w-fit items-center gap-1 rounded-[5px] border border-dashed border-border px-1.5 text-[12px] text-text-tertiary transition-colors duration-80 hover:bg-bg-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-50'
        >
          <Search className='size-3' />
          Search products
        </button>
      </PopoverTrigger>
      <PopoverContent className='w-96 p-0' align='start'>
        <div className='flex items-center gap-2 border-b px-3 py-2'>
          {loading ? (
            <Spinner className='size-3.5 shrink-0' />
          ) : (
            <Search className='size-3.5 shrink-0 text-text-tertiary' />
          )}
          <input
            ref={inputRef}
            aria-label='Search products'
            placeholder='Search by ID or description...'
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              updateDebouncedSearch(e.target.value)
            }}
            className='h-5 flex-1 bg-transparent text-sm outline-none placeholder:text-text-tertiary'
          />
        </div>
        <div
          className='max-h-72 overflow-y-auto overscroll-contain'
          onWheel={e => e.stopPropagation()}
        >
          {loading && products.length === 0 ? (
            <div className='space-y-1 p-1 py-2'>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className='h-8 w-full rounded-md' />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className='flex flex-col items-center gap-2 py-6 text-text-tertiary'>
              <Package className='size-5 opacity-50' />
              <span className='text-[13px]'>
                {debouncedSearch ? 'No products found' : 'Start typing to search'}
              </span>
            </div>
          ) : (
            <div className='p-1'>
              {products.map(product => (
                <button
                  key={product.autoid}
                  type='button'
                  className='flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-bg-hover'
                  onClick={() => {
                    onPick(product.id)
                    setOpen(false)
                  }}
                >
                  <span className='shrink-0 text-[13px] font-semibold text-foreground tabular-nums'>
                    {product.id}
                  </span>
                  <span className='text-[13px] text-text-tertiary'>—</span>
                  <span className='truncate text-[13px] text-text-secondary'>
                    {product.descr_1}
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
