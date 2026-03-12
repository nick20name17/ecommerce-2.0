import { useQuery } from '@tanstack/react-query'
import { Image, Loader2, ShoppingBag, Trash2 } from 'lucide-react'

import { getCartQuery } from '@/api/cart/query'
import type { CartItem } from '@/api/product/schema'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCurrency } from '@/helpers/formatters'
import { cn } from '@/lib/utils'

const MAX_VISIBLE_ITEMS = 8

interface CatalogMiniCartProps {
  customerId: string
  projectId?: number | null
  onRemove?: (itemId: number) => void
  removingItemId?: number | null
  className?: string
}

export const CatalogMiniCart = ({
  customerId,
  projectId,
  onRemove,
  removingItemId,
  className
}: CatalogMiniCartProps) => {
  const { data: cart, isLoading } = useQuery({
    ...getCartQuery(customerId, projectId)
  })

  const items = cart?.items ?? []
  const displayItems = items.slice(0, MAX_VISIBLE_ITEMS)
  const hasMore = items.length > MAX_VISIBLE_ITEMS
  const total = Number(cart?.total) ?? 0
  const oldTotal = Number(cart?.old_total) ?? 0
  const hasDiscount = oldTotal - total > 0.01

  return (
    <div className={cn('flex flex-col border-l border-border bg-bg-secondary/20', className)}>
      {/* Header */}
      <div className='flex shrink-0 items-center gap-2 border-b border-border px-4 py-2'>
        <ShoppingBag className='size-3.5 text-text-tertiary' />
        <span className='text-[12px] font-semibold uppercase tracking-[0.04em] text-text-tertiary'>
          Cart
        </span>
        <span className='text-[12px] tabular-nums text-text-tertiary'>
          {isLoading ? '…' : `${items.length} item${items.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {isLoading ? (
        <div className='flex-1 space-y-0'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className='flex items-center gap-2.5 border-b border-border-light px-4 py-2'
            >
              <div className='size-7 shrink-0 animate-pulse rounded-[4px] bg-border' />
              <div className='min-w-0 flex-1 space-y-1'>
                <div className='h-3 w-14 animate-pulse rounded bg-border' />
                <div className='h-3 w-20 animate-pulse rounded bg-border' />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className='flex flex-1 flex-col items-center justify-center gap-1.5 px-4 py-10'>
          <ShoppingBag className='size-5 text-text-tertiary opacity-30' />
          <p className='text-[13px] font-medium text-text-secondary'>Empty cart</p>
          <p className='text-[12px] text-text-quaternary'>Add products from the catalog</p>
        </div>
      ) : (
        <div className='min-h-0 flex-1 overflow-y-auto'>
          {displayItems.map((item) => (
            <MiniCartItemRow
              key={item.id}
              item={item}
              onRemove={onRemove}
              removing={removingItemId === item.id}
            />
          ))}
          {hasMore && (
            <div className='border-b border-border-light px-4 py-1.5 text-center text-[12px] text-text-tertiary'>
              +{items.length - MAX_VISIBLE_ITEMS} more item{items.length - MAX_VISIBLE_ITEMS !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

      {/* Footer total */}
      {!isLoading && items.length > 0 && (
        <div className='shrink-0 border-t border-border px-4 py-2.5'>
          {hasDiscount && (
            <div className='flex justify-between text-[12px] text-text-tertiary'>
              <span>Subtotal</span>
              <span className='tabular-nums line-through'>{formatCurrency(oldTotal)}</span>
            </div>
          )}
          <div className='flex items-center justify-between'>
            <span className='text-[12px] font-medium uppercase tracking-[0.04em] text-text-tertiary'>
              Total
            </span>
            <span className='text-[14px] font-bold tabular-nums'>{formatCurrency(total)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function MiniCartItemRow({
  item,
  onRemove,
  removing
}: {
  item: CartItem
  onRemove?: (itemId: number) => void
  removing?: boolean
}) {
  const lineTotal = (item.price ?? 0) * (item.quantity ?? 0)
  return (
    <div className='group/item flex items-center gap-2.5 border-b border-border-light px-4 py-1.5 transition-colors duration-75 hover:bg-bg-hover/50'>
      {/* Thumbnail */}
      <div className='flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-[4px] bg-bg-secondary'>
        {item.photo ? (
          <img src={item.photo} alt={item.name} className='size-full object-cover' />
        ) : (
          <Image className='size-3 text-text-quaternary' />
        )}
      </div>

      {/* Info */}
      <div className='min-w-0 flex-1'>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className='block truncate text-[12px] font-semibold tabular-nums'>
              {item.product_id}
            </span>
          </TooltipTrigger>
          <TooltipContent>{item.name}</TooltipContent>
        </Tooltip>
        <p className='truncate text-[11px] text-text-tertiary'>
          {item.quantity} × {formatCurrency(item.price ?? 0)}
        </p>
      </div>

      {/* Amount */}
      <span className='shrink-0 text-[12px] font-medium tabular-nums text-text-secondary'>
        {formatCurrency(lineTotal)}
      </span>

      {/* Remove */}
      {onRemove && (
        <button
          type='button'
          className='inline-flex size-6 shrink-0 items-center justify-center rounded-[4px] text-text-quaternary opacity-0 transition-all duration-75 hover:bg-bg-active hover:text-destructive group-hover/item:opacity-100'
          disabled={removing}
          onClick={() => onRemove(item.id)}
          aria-label='Remove'
        >
          {removing ? (
            <Loader2 className='size-3 animate-spin' />
          ) : (
            <Trash2 className='size-3' />
          )}
        </button>
      )}
    </div>
  )
}
