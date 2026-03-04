import { useQuery } from '@tanstack/react-query'
import { Image, Loader2, ShoppingBag, Trash2 } from 'lucide-react'

import { getCartQuery } from '@/api/cart/query'
import type { CartItem } from '@/api/product/schema'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCurrency } from '@/helpers/formatters'
import { cn } from '@/lib/utils'

const MAX_VISIBLE_ITEMS = 6

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
    <div className={cn('bg-muted/20 flex flex-col border-l', className)}>
      <div className='bg-muted/40 shrink-0 border-b px-4 py-3'>
        <div className='flex items-center gap-2'>
          <div className='bg-primary/15 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg'>
            <ShoppingBag className='size-4' />
          </div>
          <div className='min-w-0'>
            <h3 className='text-sm font-semibold'>Cart</h3>
            <p className='text-muted-foreground text-xs'>
              {isLoading ? '…' : `${items.length} item${items.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className='flex-1 space-y-2 p-4'>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton
              key={i}
              className='h-14 w-full rounded-lg'
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className='flex flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-center'>
          <div className='bg-muted flex size-12 items-center justify-center rounded-full'>
            <ShoppingBag className='text-muted-foreground size-5' />
          </div>
          <p className='text-sm font-medium'>Empty cart</p>
          <p className='text-muted-foreground text-xs'>Add products from the catalog</p>
        </div>
      ) : (
        <ScrollArea className='min-h-0 flex-1'>
          <ul className='space-y-1 p-3'>
            {displayItems.map((item) => (
              <MiniCartItemRow
                key={item.id}
                item={item}
                onRemove={onRemove}
                removing={removingItemId === item.id}
              />
            ))}
            {hasMore && (
              <li className='text-muted-foreground px-2 py-1.5 text-center text-xs'>
                +{items.length - MAX_VISIBLE_ITEMS} more
              </li>
            )}
          </ul>
        </ScrollArea>
      )}

      {!isLoading && items.length > 0 && (
        <div className='bg-muted/30 shrink-0 border-t p-4'>
          <div className='space-y-1.5 text-sm'>
            {hasDiscount && (
              <div className='text-muted-foreground flex justify-between'>
                <span>Subtotal</span>
                <span>{formatCurrency(oldTotal)}</span>
              </div>
            )}
            <div className='flex items-center justify-between font-semibold'>
              <span>Total</span>
              <span className='tabular-nums'>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const MiniCartItemRow = ({
  item,
  onRemove,
  removing
}: {
  item: CartItem
  onRemove?: (itemId: number) => void
  removing?: boolean
}) => {
  const lineTotal = (item.price ?? 0) * (item.quantity ?? 0)
  return (
    <li className='bg-background/60 hover:border-border hover:bg-background/80 flex items-center gap-2 rounded-lg border border-transparent px-2.5 py-2 transition-colors'>
      <div className='bg-muted flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md'>
        {item.photo ? (
          <img
            src={item.photo}
            alt={item.name}
            className='size-full object-cover'
          />
        ) : (
          <Image className='text-muted-foreground size-4' />
        )}
      </div>
      <div className='min-w-0 flex-1'>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className='block truncate font-mono text-xs font-medium'>{item.product_id}</span>
          </TooltipTrigger>
          <TooltipContent>{item.name}</TooltipContent>
        </Tooltip>
        <p className='text-muted-foreground truncate text-xs'>
          {item.quantity} × {formatCurrency(item.price ?? 0)}
        </p>
      </div>
      <span className='shrink-0 text-right text-xs font-semibold tabular-nums'>
        {formatCurrency(lineTotal)}
      </span>
      {onRemove && (
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='text-muted-foreground hover:text-destructive size-7 shrink-0'
          disabled={removing}
          onClick={() => onRemove(item.id)}
          aria-label='Remove'
        >
          {removing ? (
            <Loader2 className='size-3.5 animate-spin' />
          ) : (
            <Trash2 className='size-3.5' />
          )}
        </Button>
      )}
    </li>
  )
}
