import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  ChevronLeft,
  ChevronRight,
  Image,
  Loader2,
  Package,
  Plus,
  Search,
  Settings2,
  X
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

import { getProductsQuery } from '@/api/product/query'
import type { Product } from '@/api/product/schema'
import { formatCurrency } from '@/helpers/formatters'
import { cn } from '@/lib/utils'

interface CatalogProductGridProps {
  customerId: string
  projectId?: number | null
  categoryId: string | null
  onSelect: (product: Product) => void
  addingProductAutoid?: string | null
  cartUpdating?: boolean
}

const DEFAULT_LIMIT = 24

export const CatalogProductGrid = ({
  customerId,
  projectId,
  categoryId,
  onSelect,
  addingProductAutoid,
  cartUpdating
}: CatalogProductGridProps) => {
  const [query, setQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [offset, setOffset] = useState(0)

  const updateDebouncedSearch = useDebouncedCallback((q: string) => setDebouncedSearch(q), 250)

  useEffect(() => {
    setOffset(0)
  }, [categoryId, debouncedSearch])

  const params = useMemo(
    () => ({
      limit: DEFAULT_LIMIT,
      offset,
      search: debouncedSearch || undefined,
      category: categoryId ?? undefined,
      customer_id: customerId,
      project_id: projectId ?? undefined
    }),
    [categoryId, customerId, debouncedSearch, offset, projectId]
  )

  const { data, isLoading, isFetching } = useQuery({
    ...getProductsQuery(params),
    placeholderData: keepPreviousData,
    enabled: !!customerId
  })

  const products = data?.results ?? []
  const count = data?.count ?? 0

  const loading = isLoading || isFetching

  const rangeStart = count === 0 ? 0 : offset + 1
  const rangeEnd = Math.min(offset + DEFAULT_LIMIT, count)
  const canPrev = offset > 0
  const canNext = offset + DEFAULT_LIMIT < count

  const handleInput = (value: string) => {
    setQuery(value)
    updateDebouncedSearch(value.trim())
  }

  const handleAdd = (product: Product) => {
    onSelect(product)
  }

  return (
    <div className='flex h-full min-h-0 flex-col'>
      {/* Search + pagination bar */}
      <div className='flex shrink-0 items-center gap-2 border-b border-border px-4 py-2'>
        <div className='flex flex-1 items-center gap-1.5 rounded-[6px] border border-border bg-background px-2.5 py-1.5'>
          {isFetching ? (
            <Loader2 className='size-3.5 shrink-0 animate-spin text-text-tertiary' />
          ) : (
            <Search className='size-3.5 shrink-0 text-text-tertiary' />
          )}
          <input
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            placeholder='Search by ID, UPC, description…'
            className='flex-1 bg-transparent text-[13px] outline-none placeholder:text-text-tertiary'
          />
          {query && (
            <button
              type='button'
              className='text-text-tertiary hover:text-foreground rounded-[3px] p-0.5 transition-colors'
              onClick={() => handleInput('')}
            >
              <X className='size-3' />
            </button>
          )}
        </div>

        <div className='flex shrink-0 items-center gap-1.5'>
          <span className='text-[12px] tabular-nums text-text-tertiary'>
            {loading ? '…' : `${rangeStart}–${rangeEnd} of ${count}`}
          </span>
          <button
            type='button'
            className='inline-flex size-6 items-center justify-center rounded-[5px] border border-border text-text-tertiary transition-colors hover:bg-bg-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-40'
            disabled={!canPrev}
            onClick={() => setOffset((v) => Math.max(0, v - DEFAULT_LIMIT))}
          >
            <ChevronLeft className='size-3' />
          </button>
          <button
            type='button'
            className='inline-flex size-6 items-center justify-center rounded-[5px] border border-border text-text-tertiary transition-colors hover:bg-bg-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-40'
            disabled={!canNext}
            onClick={() => setOffset((v) => v + DEFAULT_LIMIT)}
          >
            <ChevronRight className='size-3' />
          </button>
        </div>
      </div>

      {/* Table header */}
      <div className='flex shrink-0 items-center gap-3 border-b border-border bg-bg-secondary/60 px-4 py-1.5'>
        <div className='w-10 shrink-0' />
        <div className='w-[80px] shrink-0 text-[12px] font-medium uppercase tracking-[0.04em] text-text-tertiary'>
          ID
        </div>
        <div className='min-w-0 flex-1 text-[12px] font-medium uppercase tracking-[0.04em] text-text-tertiary'>
          Description
        </div>
        <div className='hidden w-[80px] shrink-0 text-right text-[12px] font-medium uppercase tracking-[0.04em] text-text-tertiary sm:block'>
          Price
        </div>
        <div className='w-[60px] shrink-0' />
      </div>

      {/* Product rows */}
      <div className='min-h-0 flex-1 overflow-y-auto'>
        {loading ? (
          <div className='space-y-0'>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className='flex items-center gap-3 border-b border-border-light px-4 py-2'>
                <div className='size-10 shrink-0 animate-pulse rounded-[6px] bg-border' />
                <div className='h-3 w-16 animate-pulse rounded bg-border' />
                <div className='h-3 flex-1 animate-pulse rounded bg-border' />
                <div className='hidden h-3 w-14 animate-pulse rounded bg-border sm:block' />
                <div className='h-6 w-12 animate-pulse rounded bg-border' />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className='flex flex-col items-center gap-2 px-4 py-16 text-center'>
            <Package className='size-6 text-text-tertiary opacity-40' />
            <p className='text-[13px] font-medium'>
              {debouncedSearch ? 'No matches' : 'No products'}
            </p>
            <p className='text-[13px] text-text-tertiary'>
              {debouncedSearch
                ? 'Try another search term.'
                : 'Use search or choose another category.'}
            </p>
          </div>
        ) : (
          products.map((product) => {
            const currentNum = Math.round((parseFloat(String(product.price)) || 0) * 100) / 100
            const oldNum = Math.round((parseFloat(String(product.old_price)) || 0) * 100) / 100
            const hasDiscount = oldNum > currentNum
            const hasConfigurations = Number(product.configurations) > 0
            const hasMultipleUnits = (product.units?.length ?? 0) > 1
            const needsConfig = hasConfigurations || hasMultipleUnits
            const isAdding = addingProductAutoid === product.autoid
            const photo = product.photo || (product.photos as string[] | undefined)?.[0]

            return (
              <div
                key={product.autoid}
                className='group/row flex items-center gap-3 border-b border-border-light px-4 py-1.5 transition-colors duration-75 hover:bg-bg-hover/50'
              >
                {/* Thumbnail */}
                <div className='flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[6px] bg-bg-secondary'>
                  {photo ? (
                    <img
                      src={photo}
                      alt={product.descr_1}
                      className='size-full object-cover'
                      loading='lazy'
                    />
                  ) : (
                    <Image className='size-4 text-text-quaternary' />
                  )}
                </div>

                {/* Product ID */}
                <div className='w-[80px] shrink-0'>
                  <span className='text-[13px] font-semibold tabular-nums text-foreground'>
                    {product.id}
                  </span>
                  {product.inactive && (
                    <span className='ml-1 rounded border border-border px-1 py-px text-[10px] font-medium text-text-tertiary'>
                      Inactive
                    </span>
                  )}
                </div>

                {/* Description */}
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-[13px] font-medium' title={product.descr_1}>
                    {product.descr_1}
                  </p>
                  <div className='flex items-center gap-2'>
                    {product.descr_2 && (
                      <p className='truncate text-[12px] text-text-tertiary' title={product.descr_2}>
                        {product.descr_2}
                      </p>
                    )}
                    {needsConfig && (
                      <span className='inline-flex shrink-0 items-center gap-1 rounded-[4px] bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary'>
                        <Settings2 className='size-2.5' />
                        {hasConfigurations ? 'Configurable' : 'Multi-unit'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className='hidden w-[80px] shrink-0 text-right sm:block'>
                  {hasDiscount && (
                    <p className='text-[11px] tabular-nums text-text-tertiary line-through'>
                      {formatCurrency(oldNum)}
                    </p>
                  )}
                  <p
                    className={cn(
                      'text-[13px] font-semibold tabular-nums',
                      hasDiscount && 'text-green-600'
                    )}
                  >
                    {formatCurrency(currentNum)}
                  </p>
                </div>

                {/* Add button */}
                <div className='w-[60px] shrink-0 text-right'>
                  <button
                    type='button'
                    className='inline-flex h-7 items-center gap-1 rounded-[5px] border border-border bg-bg-secondary px-2 text-[12px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground disabled:pointer-events-none disabled:opacity-40'
                    disabled={cartUpdating || isAdding}
                    onClick={() => handleAdd(product)}
                  >
                    {isAdding ? (
                      <Loader2 className='size-3 animate-spin' />
                    ) : (
                      <Plus className='size-3' />
                    )}
                    Add
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
