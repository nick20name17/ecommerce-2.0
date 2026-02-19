import { useDebouncedCallback } from 'use-debounce'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Image, Loader2, Package, Search, X } from 'lucide-react'

import type { Product } from '@/api/product/schema'
import { getProductsQuery } from '@/api/product/query'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/helpers/formatters'

interface ProductSearchProps {
  customerId: string | null
  projectId?: number | null
  onSelect: (product: Product) => void
  disabled?: boolean
}

export function ProductSearch({ customerId, projectId, onSelect, disabled }: ProductSearchProps) {
  const [query, setQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const updateDebouncedSearch = useDebouncedCallback((q: string) => setDebouncedSearch(q), 300)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowResults(false)
        setHighlighted(-1)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const params = {
    limit: 50,
    search: debouncedSearch,
    customer_id: customerId ?? undefined,
    project_id: projectId ?? undefined,
  }
  const { data, isLoading, isFetching } = useQuery({
    ...getProductsQuery(params),
    enabled: !!customerId && debouncedSearch.length > 0,
  })
  const results = data?.results ?? []
  const loading = isLoading || (query.trim() !== debouncedSearch && isFetching)

  const handleInput = (value: string) => {
    setQuery(value)
    setHighlighted(-1)
    if (!value.trim()) {
      setShowResults(false)
      setDebouncedSearch('')
      return
    }
    setShowResults(true)
    updateDebouncedSearch(value.trim())
  }

  const handleSelect = (product: Product) => {
    onSelect(product)
    setQuery('')
    setDebouncedSearch('')
    setShowResults(false)
    setHighlighted(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlighted >= 0 && highlighted < results.length) handleSelect(results[highlighted])
    } else if (e.key === 'Escape') {
      setShowResults(false)
      setHighlighted(-1)
    }
  }

  const isDisabled = disabled || !customerId

  return (
    <div ref={wrapperRef} className='relative'>
      <div className='relative flex items-center'>
        <span className='text-muted-foreground pointer-events-none absolute left-3'>
          {loading ? <Loader2 className='size-4 animate-spin' /> : <Search className='size-4' />}
        </span>
        <input
          type='text'
          className='border-input placeholder:text-muted-foreground focus:border-ring focus:ring-ring/50 h-10 w-full rounded-md border bg-transparent px-9 text-sm outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50'
          placeholder={customerId ? 'Search product by ID...' : 'Select a customer first'}
          disabled={isDisabled}
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => {
            if (query.trim() && results.length > 0) setShowResults(true)
          }}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            type='button'
            className='text-muted-foreground hover:text-foreground absolute right-2 rounded-full p-1'
            onClick={() => handleInput('')}
          >
            <X className='size-4' />
          </button>
        )}
      </div>

      {showResults && (
        <div className='bg-popover ring-foreground/10 absolute top-full z-50 mt-1 max-h-[350px] w-full overflow-hidden rounded-lg shadow-md ring-1'>
          {loading && results.length === 0 ? (
            <div className='text-muted-foreground flex items-center gap-2 px-4 py-6'>
              <Loader2 className='size-4 animate-spin' />
              <span className='text-sm'>Loading products...</span>
            </div>
          ) : results.length === 0 ? (
            <div className='text-muted-foreground flex flex-col items-center gap-2 py-6'>
              <Package className='size-6 opacity-50' />
              <span className='text-sm'>No products found</span>
            </div>
          ) : (
            <div className='max-h-[350px] overflow-y-auto'>
              {results.map((product, index) => (
                <button
                  key={product.autoid}
                  type='button'
                  className={`group flex w-full gap-3 border-b px-3 py-2.5 text-left text-sm last:border-b-0 ${
                    highlighted === index ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'
                  }`}
                  onClick={() => handleSelect(product)}
                  onMouseEnter={() => setHighlighted(index)}
                >
                  <div className='bg-muted flex size-10 shrink-0 items-center justify-center overflow-hidden rounded'>
                    {product.photo ? (
                      <img
                        src={product.photo}
                        alt={product.descr_1}
                        className='size-full object-cover'
                      />
                    ) : (
                      <Image className='text-muted-foreground size-4 group-hover:text-accent-foreground' />
                    )}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center justify-between gap-2'>
                      <div className='flex items-center gap-2 truncate group-hover:text-accent-foreground'>
                        <Badge variant='secondary' className='shrink-0 text-xs'>
                          {product.id}
                        </Badge>
                        <span className='truncate'>{product.descr_1}</span>
                      </div>
                      <div className='flex shrink-0 items-center gap-2'>
                        <PriceDisplay price={product.price} oldPrice={product.old_price} />
                        {product.inactive && (
                          <Badge variant='secondary' className='text-[10px]'>
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                    {Array.isArray(product.product_specs) && product.product_specs.length > 0 && (
                      <div className='text-muted-foreground mt-0.5 flex flex-wrap gap-1 text-xs group-hover:text-accent-foreground'>
                        {(product.product_specs as Array<{ descr: string; info: string }>)
                          .slice(0, 3)
                          .map((spec, i) => (
                            <span key={spec.descr}>
                              <span className='text-muted-foreground/70'>{spec.descr}:</span>{' '}
                              <span>{spec.info}</span>
                              {i <
                                Math.min((product.product_specs as unknown[]).length, 3) - 1 && (
                                <span className='text-muted-foreground/40 ml-1'>·</span>
                              )}
                            </span>
                          ))}
                        {(product.product_specs as unknown[]).length > 3 && (
                          <span className='italic'>
                            +{(product.product_specs as unknown[]).length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PriceDisplay({
  price,
  oldPrice,
}: {
  price: string | number
  oldPrice?: string | number
}) {
  const currentNum = Math.round((parseFloat(String(price)) || 0) * 100) / 100
  const oldNum = Math.round((parseFloat(String(oldPrice)) || 0) * 100) / 100
  const hasDiscount = oldPrice && oldNum > currentNum

  return (
    <span className='flex items-center gap-1.5 text-sm'>
      {hasDiscount && (
        <span className='text-muted-foreground text-xs line-through'>
          {formatCurrency(oldNum)}
        </span>
      )}
      <span className={hasDiscount ? 'font-semibold text-green-600' : ''}>
        {formatCurrency(currentNum)}
      </span>
    </span>
  )
}
