import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useDebouncedCallback } from 'use-debounce'
import { ChevronLeft, ChevronRight, Image, Loader2, Package, Search, ShoppingCart, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { getProductsQuery } from '@/api/product/query'
import type { Product } from '@/api/product/schema'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatCurrency } from '@/helpers/formatters'
import { cn } from '@/lib/utils'

interface CatalogProductGridProps {
  customerId: string
  projectId?: number | null
  categoryId: string | null
  onSelect: (product: Product) => void
  onClose?: () => void
}

const DEFAULT_LIMIT = 24

function CatalogProductCardImage({
  photo,
  photos,
  alt,
}: {
  photo: string | undefined
  photos: string[] | undefined
  alt: string
}) {
  const urls = (photos?.length ? (photos as string[]) : null) ?? (photo ? [photo] : [])
  const [index, setIndex] = useState(0)
  useEffect(() => {
    setIndex((i) => (i >= urls.length ? 0 : i))
  }, [urls.length])
  const current = urls[index]
  const hasMultiple = urls.length > 1

  if (!current) {
    return (
      <div className='flex size-20 shrink-0 items-center justify-center rounded-xl bg-muted'>
        <Image className='size-6 text-muted-foreground' />
      </div>
    )
  }

  return (
    <div className='group/img relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted'>
      <img
        src={current}
        alt={alt}
        className='size-full object-cover'
        loading='lazy'
      />
      {hasMultiple && (
        <>
          <button
            type='button'
            className='absolute left-0 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-r bg-background/80 text-muted-foreground opacity-0 transition-opacity hover:opacity-100 group-hover/img:opacity-100'
            onClick={(e) => {
              e.stopPropagation()
              setIndex((i) => (i === 0 ? urls.length - 1 : i - 1))
            }}
            aria-label='Previous image'
          >
            <ChevronLeft className='size-2.5' />
          </button>
          <button
            type='button'
            className='absolute right-0 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-l bg-background/80 text-muted-foreground opacity-0 transition-opacity hover:opacity-100 group-hover/img:opacity-100'
            onClick={(e) => {
              e.stopPropagation()
              setIndex((i) => (i === urls.length - 1 ? 0 : i + 1))
            }}
            aria-label='Next image'
          >
            <ChevronRight className='size-2.5' />
          </button>
          <span className='absolute bottom-0.5 right-0.5 rounded bg-foreground/70 px-1 py-0.5 text-[10px] font-medium text-background'>
            {index + 1}/{urls.length}
          </span>
        </>
      )}
    </div>
  )
}

export function CatalogProductGrid({
  customerId,
  projectId,
  categoryId,
  onSelect,
  onClose,
}: CatalogProductGridProps) {
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
      project_id: projectId ?? undefined,
    }),
    [categoryId, customerId, debouncedSearch, offset, projectId]
  )

  const { data, isLoading, isFetching } = useQuery({
    ...getProductsQuery(params),
    placeholderData: keepPreviousData,
    enabled: !!customerId,
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
    onClose?.()
  }

  const emptyTitle = debouncedSearch ? 'No matches' : 'No products'
  const emptyHint = debouncedSearch
    ? 'Try another search term.'
    : 'Use search or choose another category to display items.'

  return (
    <div className='flex h-full min-h-0 flex-col'>
      <div className='shrink-0 border-b px-4 py-3'>
        <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
          <div className='min-w-0'>
            <p className='text-xs font-medium text-muted-foreground'>Products</p>
            <p className='text-sm font-semibold'>
              {loading ? 'Loading…' : `${rangeStart}–${rangeEnd} of ${count}`}
            </p>
          </div>

          <div className='flex min-w-0 flex-1 items-center gap-2 lg:max-w-[520px]'>
            <div className='relative min-w-0 flex-1'>
              <span className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
                {isFetching ? <Loader2 className='size-4 animate-spin' /> : <Search className='size-4' />}
              </span>
              <Input
                value={query}
                onChange={(e) => handleInput(e.target.value)}
                placeholder='Search by ID, UPC, description…'
                className='h-10 pl-9 pr-9'
              />
              {query && (
                <button
                  type='button'
                  className='absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground'
                  onClick={() => handleInput('')}
                  title='Clear'
                >
                  <X className='size-4' />
                </button>
              )}
            </div>

            <div className='hidden shrink-0 items-center gap-1.5 lg:flex'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={!canPrev}
                onClick={() => setOffset((v) => Math.max(0, v - DEFAULT_LIMIT))}
              >
                Prev
              </Button>
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={!canNext}
                onClick={() => setOffset((v) => v + DEFAULT_LIMIT)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>

        <div className='mt-3 flex items-center justify-between gap-3 lg:hidden'>
          <p className='text-xs text-muted-foreground'>
            Page {Math.floor(offset / DEFAULT_LIMIT) + 1}
          </p>
          <div className='flex items-center gap-1.5'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={!canPrev}
              onClick={() => setOffset((v) => Math.max(0, v - DEFAULT_LIMIT))}
            >
              Prev
            </Button>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={!canNext}
              onClick={() => setOffset((v) => v + DEFAULT_LIMIT)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className='min-h-0 flex-1'>
        <div className='p-4'>
          {loading ? (
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={`product-skeleton-${i}`} className='h-[110px] animate-pulse rounded-xl bg-muted' />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className='flex flex-col items-center gap-2 px-4 py-14 text-center'>
              <Package className='size-7 text-muted-foreground' />
              <p className='text-sm font-medium'>{emptyTitle}</p>
              <p className='text-xs text-muted-foreground'>{emptyHint}</p>
            </div>
          ) : (
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'>
              {products.map((product) => {
                const currentNum = Math.round((parseFloat(String(product.price)) || 0) * 100) / 100
                const oldNum = Math.round((parseFloat(String(product.old_price)) || 0) * 100) / 100
                const hasDiscount = oldNum > currentNum
                const hasConfigurations = Number(product.configurations) > 0
                const hasMultipleUnits = (product.units?.length ?? 0) > 1
                const needsConfig = hasConfigurations || hasMultipleUnits

                return (
                  <div
                    key={product.autoid}
                    className='group rounded-2xl border bg-card p-3 shadow-sm transition-colors hover:bg-muted/10'
                  >
                    <div className='flex gap-3'>
                      <CatalogProductCardImage
                        photo={product.photo}
                        photos={product.photos as string[] | undefined}
                        alt={product.descr_1}
                      />

                      <div className='min-w-0 flex-1'>
                        <div className='flex items-start justify-between gap-2'>
                          <div className='min-w-0'>
                            <div className='flex items-center gap-2'>
                              <Badge variant='secondary' className='shrink-0 text-[10px]'>
                                {product.id}
                              </Badge>
                              {product.inactive && (
                                <Badge variant='secondary' className='shrink-0 text-[10px]'>
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            <p className='mt-1 truncate text-sm font-medium' title={product.descr_1}>
                              {product.descr_1}
                            </p>
                            {product.descr_2 && (
                              <p className='truncate text-xs text-muted-foreground' title={product.descr_2}>
                                {product.descr_2}
                              </p>
                            )}
                          </div>

                          <div className='shrink-0 text-right'>
                            {hasDiscount && (
                              <p className='text-xs text-muted-foreground line-through'>
                                {formatCurrency(oldNum)}
                              </p>
                            )}
                            <p className={cn('text-sm font-semibold tabular-nums', hasDiscount && 'text-green-600')}>
                              {formatCurrency(currentNum)}
                            </p>
                          </div>
                        </div>

                        <div className='mt-2 flex items-center justify-between gap-2'>
                          <div className='min-w-0'>
                            {needsConfig ? (
                              <p className='truncate text-xs text-muted-foreground' title='Configurations or multiple units available'>
                                {hasConfigurations ? 'Configurable' : 'Multiple units'}
                              </p>
                            ) : (
                              <p className='truncate text-xs text-muted-foreground' title={product.location}>
                                {product.location || ' '}
                              </p>
                            )}
                          </div>

                          <Button type='button' size='sm' className='shrink-0 gap-1.5' onClick={() => handleAdd(product)}>
                            <ShoppingCart className='size-4' />
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

