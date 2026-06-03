import { AlertCircle, Image, Loader2, Settings2, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { CartItem, Product } from '@/api/product/schema'
import { productService } from '@/api/product/service'
import { NumberInput } from '@/components/ui/number-input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getErrorMessage } from '@/helpers/error'
import { formatCurrency } from '@/helpers/formatters'
import { cn } from '@/lib/utils'

// Cache product lookups so repeat IDs are instant
const productCache = new Map<string, Product>()

interface PendingEntry {
  id: string
  product?: Product
  key: string
}

interface CartEditableTableProps {
  items: CartItem[]
  loading: boolean
  disabled?: boolean
  customerId: string
  projectId: number | null
  updatingQuantityItemId?: number | null
  onProductFound: (product: Product) => void
  onEdit: (item: CartItem) => void
  onRemove: (itemId: number) => void
  onQuantityChange: (itemId: number, quantity: number) => void
}

export function CartEditableTable({
  items,
  loading,
  disabled,
  customerId,
  projectId,
  updatingQuantityItemId,
  onProductFound,
  onEdit,
  onRemove,
  onQuantityChange
}: CartEditableTableProps) {
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pendingEntries, setPendingEntries] = useState<PendingEntry[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Clear pending entries when their products appear in the real cart
  useEffect(() => {
    if (pendingEntries.length === 0) return
    setPendingEntries(prev =>
      prev.filter(
        pe => !pe.product || !items.some(item => item.product_autoid === pe.product!.autoid)
      )
    )
  }, [items]) // eslint-disable-line react-hooks/exhaustive-deps

  const searching = pendingEntries.some(pe => !pe.product)

  const handleSubmit = async () => {
    const id = inputValue.trim()
    if (!id || disabled || !customerId) return

    const entryKey = `${id}-${Date.now()}`
    const cacheKey = `${id.toLowerCase()}:${customerId}:${projectId ?? ''}`

    // Clear input immediately — non-blocking, user can type the next ID right away
    setInputValue('')
    setError(null)
    queueMicrotask(() => inputRef.current?.focus())

    // Check cache first
    const cached = productCache.get(cacheKey)
    if (cached) {
      const hasConfigurations = Number(cached.configurations) > 0
      const hasMultipleUnits = (cached.units?.length ?? 0) > 1
      if (!hasConfigurations && !hasMultipleUnits) {
        setPendingEntries(prev => [...prev, { id, product: cached, key: entryKey }])
      }
      onProductFound(cached)
      return
    }

    // Show a "searching" pending row
    setPendingEntries(prev => [...prev, { id, key: entryKey }])

    try {
      const res = await productService.get({
        id,
        limit: 1,
        customer_id: customerId,
        project_id: projectId ?? undefined
      })

      const product = res.results[0]

      if (!product) {
        setPendingEntries(prev => prev.filter(pe => pe.key !== entryKey))
        setError(`No product found for "${id}"`)
        return
      }

      // Cache for future lookups
      productCache.set(cacheKey, product)

      // Update pending entry with resolved product
      const hasConfigurations = Number(product.configurations) > 0
      const hasMultipleUnits = (product.units?.length ?? 0) > 1
      if (!hasConfigurations && !hasMultipleUnits) {
        setPendingEntries(prev => prev.map(pe => (pe.key === entryKey ? { ...pe, product } : pe)))
      } else {
        // Will open config sheet — remove pending entry
        setPendingEntries(prev => prev.filter(pe => pe.key !== entryKey))
      }

      onProductFound(product)
    } catch (err) {
      setPendingEntries(prev => prev.filter(pe => pe.key !== entryKey))
      setError(getErrorMessage(err))
    }
  }

  const canInput = !!customerId && !disabled

  return (
    <div className='flex h-full flex-col'>
      <div className='min-h-0 flex-1 overflow-auto'>
        <table className='w-full text-[13px]'>
          <thead className='sticky top-0 z-10 bg-bg-secondary select-none'>
            <tr className='border-b border-border text-left'>
              <th className='w-9 py-1.5 pr-0 pl-5 font-medium text-text-tertiary'></th>
              <th className='min-w-27.5 px-3 py-1.5 font-medium text-text-tertiary'>Inventory</th>
              <th className='min-w-40 px-3 py-1.5 font-medium text-text-tertiary'>Description</th>
              <th className='w-20 px-3 py-1.5 text-right font-medium text-text-tertiary'>Qty</th>
              <th className='w-15 px-3 py-1.5 font-medium text-text-tertiary'>Unit</th>
              <th className='w-22.5 px-3 py-1.5 text-right font-medium text-text-tertiary'>
                Price
              </th>
              <th className='w-25 px-3 py-1.5 text-right font-medium text-text-tertiary'>Amount</th>
              <th className='w-15 py-1.5 pr-5 pl-2 font-medium text-text-tertiary'></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className='border-b border-border-light'>
                  <td className='py-2 pr-0 pl-5'>
                    <Skeleton className='size-7 rounded-sm' />
                  </td>
                  <td className='px-3 py-2'>
                    <Skeleton className='h-4 w-16' />
                  </td>
                  <td className='px-3 py-2'>
                    <Skeleton className='h-4 w-32' />
                  </td>
                  <td className='px-3 py-2'>
                    <Skeleton className='ml-auto h-4 w-8' />
                  </td>
                  <td className='px-3 py-2'>
                    <Skeleton className='h-4 w-8' />
                  </td>
                  <td className='px-3 py-2'>
                    <Skeleton className='ml-auto h-4 w-14' />
                  </td>
                  <td className='px-3 py-2'>
                    <Skeleton className='ml-auto h-4 w-16' />
                  </td>
                  <td className='py-2 pr-5 pl-2' />
                </tr>
              ))
            ) : (
              <>
                {/* Real cart items */}
                {items.map(item => {
                  const isUpdating = updatingQuantityItemId === item.id
                  return (
                    <tr
                      key={item.id}
                      className='group/row border-b border-border-light transition-colors duration-100 hover:bg-bg-hover'
                    >
                      {/* Thumbnail */}
                      <td className='w-9 py-1.5 pr-0 pl-5'>
                        <div className='flex size-7 items-center justify-center overflow-hidden rounded-sm bg-bg-secondary'>
                          {item.photo ? (
                            <img
                              src={item.photo}
                              alt={item.name}
                              className='size-7 object-cover'
                              loading='lazy'
                            />
                          ) : (
                            <Image className='text-text-quaternary size-3' />
                          )}
                        </div>
                      </td>
                      {/* Inventory */}
                      <td className='px-3 py-1.5 font-medium text-foreground'>{item.product_id}</td>
                      {/* Description */}
                      <td className='max-w-75 px-3 py-1.5 text-text-secondary'>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className='block truncate'>{item.name || '—'}</span>
                          </TooltipTrigger>
                          <TooltipContent className='max-w-75'>{item.name}</TooltipContent>
                        </Tooltip>
                      </td>
                      {/* Qty */}
                      <td className='px-3 py-1.5 text-right'>
                        <div className='flex justify-end'>
                          <NumberInput
                            value={item.quantity}
                            min={1}
                            max={item.ignore_count ? undefined : item.max_count}
                            size='sm'
                            showMaxMessage
                            disabled={isUpdating}
                            onChange={qty => onQuantityChange(item.id, qty)}
                          />
                        </div>
                      </td>
                      {/* Unit */}
                      <td className='px-3 py-1.5 text-text-tertiary'>{item.unit || '—'}</td>
                      {/* Price */}
                      <td className='px-3 py-1.5 text-right text-text-secondary tabular-nums'>
                        {formatCurrency(item.price)}
                      </td>
                      {/* Amount */}
                      <td
                        className={cn(
                          'px-3 py-1.5 text-right font-medium text-foreground tabular-nums',
                          isUpdating && 'animate-pulse'
                        )}
                      >
                        {formatCurrency((item.price || 0) * (item.quantity || 0))}
                      </td>
                      {/* Actions */}
                      <td className='py-1.5 pr-5 pl-2'>
                        <div className='flex items-center gap-1'>
                          <button
                            type='button'
                            className='inline-flex h-6 items-center gap-1 rounded-[5px] border border-border bg-bg-secondary px-1.5 text-[11px] font-medium text-text-tertiary transition-colors duration-75 hover:bg-bg-active hover:text-foreground'
                            onClick={() => onEdit(item)}
                          >
                            <Settings2 className='size-3' />
                            Configure
                          </button>
                          <button
                            type='button'
                            className='text-text-quaternary inline-flex size-6 items-center justify-center rounded-[5px] opacity-0 transition-all duration-75 group-hover/row:opacity-100 hover:bg-bg-active hover:text-destructive'
                            onClick={() => onRemove(item.id)}
                          >
                            <Trash2 className='size-3' />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {/* Pending rows — searching or waiting for cart add */}
                {pendingEntries.map(pe => {
                  const product = pe.product
                  const price = product ? Number(product.price) || 0 : 0
                  return (
                    <tr key={pe.key} className='animate-pulse border-b border-border-light'>
                      <td className='w-9 py-1.5 pr-0 pl-5'>
                        <div className='flex size-7 items-center justify-center overflow-hidden rounded-sm bg-bg-secondary'>
                          {product?.photo ? (
                            <img
                              src={product.photo}
                              alt={product.descr_1}
                              className='size-7 object-cover'
                              loading='lazy'
                            />
                          ) : (
                            <Image className='text-text-quaternary size-3' />
                          )}
                        </div>
                      </td>
                      <td className='px-3 py-1.5 font-medium text-foreground/60'>
                        {product?.id ?? pe.id}
                      </td>
                      <td className='max-w-75 px-3 py-1.5 text-text-secondary/60'>
                        <span className='block truncate'>
                          {product ? product.descr_1 || '—' : 'Looking up…'}
                        </span>
                      </td>
                      <td className='px-3 py-1.5 text-right text-text-secondary/60 tabular-nums'>
                        {product ? '1' : '—'}
                      </td>
                      <td className='px-3 py-1.5 text-text-tertiary/60'>
                        {product ? product.unit || product.def_unit || '—' : '—'}
                      </td>
                      <td className='px-3 py-1.5 text-right text-text-secondary/60 tabular-nums'>
                        {product ? formatCurrency(price) : '—'}
                      </td>
                      <td className='px-3 py-1.5 text-right font-medium text-foreground/60 tabular-nums'>
                        {product ? formatCurrency(price) : '—'}
                      </td>
                      <td className='py-1.5 pr-5 pl-2'>
                        <Loader2 className='text-text-quaternary size-3.5 animate-spin' />
                      </td>
                    </tr>
                  )
                })}
              </>
            )}

            {/* Input row — always visible when not loading */}
            {!loading && (
              <tr className='border-b border-border-light'>
                <td className='py-1.5 pr-0 pl-5'>
                  <div className='flex size-7 items-center justify-center'>
                    {searching ? (
                      <Loader2 className='text-text-quaternary size-3.5 animate-spin' />
                    ) : (
                      <div className='border-border-heavy size-3 rounded-[3px] border border-dashed' />
                    )}
                  </div>
                </td>
                <td className='px-3 py-1.5' colSpan={2}>
                  <input
                    ref={inputRef}
                    type='text'
                    value={inputValue}
                    onChange={e => {
                      setInputValue(e.target.value.toUpperCase())
                      if (error) setError(null)
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleSubmit()
                      }
                    }}
                    placeholder={
                      canInput ? 'Type product ID and press Enter…' : 'Select a customer first'
                    }
                    disabled={!canInput || searching}
                    className={cn(
                      'placeholder:text-text-quaternary w-full bg-transparent text-[13px] font-medium uppercase outline-none placeholder:font-normal placeholder:normal-case disabled:cursor-not-allowed disabled:opacity-50',
                      error && 'text-destructive'
                    )}
                    autoComplete='off'
                    spellCheck={false}
                  />
                </td>
                <td className='text-text-quaternary px-3 py-1.5 text-right'>—</td>
                <td className='text-text-quaternary px-3 py-1.5'>—</td>
                <td className='text-text-quaternary px-3 py-1.5 text-right'>—</td>
                <td className='text-text-quaternary px-3 py-1.5 text-right'>—</td>
                <td className='py-1.5 pr-5 pl-2'>
                  {inputValue.trim() && !searching && (
                    <button
                      type='button'
                      className='rounded-sm bg-bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-text-tertiary transition-colors duration-75 hover:bg-bg-active hover:text-foreground'
                      onClick={handleSubmit}
                      tabIndex={-1}
                    >
                      Add
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Error message */}
      {error && (
        <div className='flex items-center gap-1.5 border-t border-border px-5 py-2 text-[12px] text-destructive'>
          <AlertCircle className='size-3 shrink-0' />
          {error}
        </div>
      )}
    </div>
  )
}
