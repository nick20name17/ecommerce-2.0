import { useQuery } from '@tanstack/react-query'
import { AlertCircle, Package, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

import { catalogService } from '@/api/catalog/service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface UnassignedProductsPanelProps {
  projectId: number | null
  isMobile?: boolean
}

export const UnassignedProductsPanel = ({
  projectId,
  isMobile,
}: UnassignedProductsPanelProps) => {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const limit = 50

  const debouncedSetSearch = useDebouncedCallback((val: string) => {
    setDebouncedSearch(val)
    setOffset(0)
  }, 300)

  const handleSearch = (val: string) => {
    setSearch(val)
    debouncedSetSearch(val)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['unassigned-products', projectId, debouncedSearch, offset],
    queryFn: () =>
      catalogService.getUnassignedProducts({
        project_id: projectId ?? undefined,
        search: debouncedSearch || undefined,
        limit,
        offset,
      }),
    staleTime: 60_000,
  })

  const products = data?.results ?? []
  const total = data?.count ?? 0
  const hasMore = offset + limit < total

  return (
    <div className='flex h-full flex-col'>
      {/* Header */}
      <div
        className={cn(
          'flex items-center gap-2 border-b border-border py-3',
          isMobile ? 'flex-wrap px-3.5' : 'px-6'
        )}
      >
        <AlertCircle className='size-4 text-amber-500 shrink-0' />
        <h2 className='text-[14px] font-semibold flex-1'>
          Unassigned Products
          {total > 0 && (
            <span className='ml-1.5 text-[12px] font-normal text-text-tertiary'>
              ({total})
            </span>
          )}
        </h2>
      </div>

      {/* Search */}
      <div className={cn('border-b border-border py-2', isMobile ? 'px-3.5' : 'px-6')}>
        <div className='relative'>
          <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-text-tertiary' />
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder='Search by ID or description...'
            className='pl-8 h-8 text-[13px]'
          />
        </div>
      </div>

      {/* List */}
      <div className='flex-1 overflow-y-auto'>
        {isLoading ? (
          <div className={cn('flex flex-col gap-1 py-3', isMobile ? 'px-3.5' : 'px-6')}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className='h-9 w-full rounded-md' />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-full text-text-tertiary py-12'>
            <Package className='size-8 mb-2 text-text-quaternary' />
            <p className='text-[13px]'>
              {debouncedSearch ? 'No matching products' : 'All products are assigned to categories'}
            </p>
          </div>
        ) : (
          <>
            <div className='flex flex-col'>
              {products.map((product) => (
                <div
                  key={product.autoid}
                  className={cn(
                    'flex items-center gap-3 border-b border-border-light py-2',
                    isMobile ? 'px-3.5' : 'px-6'
                  )}
                >
                  <Package className='size-4 text-amber-500 shrink-0' />
                  <div className='flex-1 min-w-0'>
                    <div className='text-[13px] font-medium truncate font-mono'>
                      {product.id}
                    </div>
                    {product.descr_1 && (
                      <div className='text-[11px] text-text-tertiary truncate'>
                        {product.descr_1}
                      </div>
                    )}
                  </div>
                  {product.wtree_id && (
                    <span className='text-[10px] text-text-quaternary tabular-nums shrink-0'>
                      cat:{product.wtree_id}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {(hasMore || offset > 0) && (
              <div className={cn(
                'flex items-center justify-between border-t border-border py-2',
                isMobile ? 'px-3.5' : 'px-6'
              )}>
                <span className='text-[11px] text-text-tertiary'>
                  {offset + 1}–{Math.min(offset + limit, total)} of {total}
                </span>
                <div className='flex gap-1'>
                  <Button
                    variant='outline'
                    size='xs'
                    disabled={offset === 0}
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant='outline'
                    size='xs'
                    disabled={!hasMore}
                    onClick={() => setOffset(offset + limit)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
