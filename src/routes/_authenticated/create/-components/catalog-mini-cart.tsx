import { useQuery } from '@tanstack/react-query'
import { Image, ShoppingBag } from 'lucide-react'

import { getCartQuery } from '@/api/cart/query'
import type { CartItem } from '@/api/product/schema'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCurrency } from '@/helpers/formatters'
import { cn } from '@/lib/utils'

const MAX_VISIBLE_ITEMS = 6

interface CatalogMiniCartProps {
  customerId: string
  projectId?: number | null
  className?: string
}

export function CatalogMiniCart({
  customerId,
  projectId,
  className,
}: CatalogMiniCartProps) {
  const { data: cart, isLoading } = useQuery({
    ...getCartQuery(customerId, projectId),
  })

  const items = cart?.items ?? []
  const displayItems = items.slice(0, MAX_VISIBLE_ITEMS)
  const hasMore = items.length > MAX_VISIBLE_ITEMS
  const total = Number(cart?.total) ?? 0
  const oldTotal = Number(cart?.old_total) ?? 0
  const hasDiscount = oldTotal - total > 0.01

  return (
    <div
      className={cn(
        'flex flex-col border-l bg-muted/20',
        className
      )}
    >
      <div className='shrink-0 border-b bg-muted/40 px-4 py-3'>
        <div className='flex items-center gap-2'>
          <div className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary'>
            <ShoppingBag className='size-4' />
          </div>
          <div className='min-w-0'>
            <h3 className='text-sm font-semibold'>Cart</h3>
            <p className='text-xs text-muted-foreground'>
              {isLoading ? '…' : `${items.length} item${items.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className='flex-1 space-y-2 p-4'>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className='h-14 w-full rounded-lg' />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className='flex flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-center'>
          <div className='flex size-12 items-center justify-center rounded-full bg-muted'>
            <ShoppingBag className='size-5 text-muted-foreground' />
          </div>
          <p className='text-sm font-medium'>Empty cart</p>
          <p className='text-xs text-muted-foreground'>
            Add products from the catalog
          </p>
        </div>
      ) : (
        <ScrollArea className='min-h-0 flex-1'>
          <ul className='space-y-1 p-3'>
            {displayItems.map((item) => (
              <MiniCartItemRow key={item.id} item={item} />
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
        <div className='shrink-0 border-t bg-muted/30 p-4'>
          <div className='space-y-1.5 text-sm'>
            {hasDiscount && (
              <div className='flex justify-between text-muted-foreground'>
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

function MiniCartItemRow({ item }: { item: CartItem }) {
  const lineTotal = (item.price ?? 0) * (item.quantity ?? 0)
  return (
    <li className='flex items-center gap-3 rounded-lg border border-transparent bg-background/60 px-2.5 py-2 transition-colors hover:border-border hover:bg-background/80'>
      <div className='flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted'>
        {item.photo ? (
          <img
            src={item.photo}
            alt={item.name}
            className='size-full object-cover'
          />
        ) : (
          <Image className='size-4 text-muted-foreground' />
        )}
      </div>
      <div className='min-w-0 flex-1'>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className='block truncate font-mono text-xs font-medium'>
              {item.product_id}
            </span>
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
    </li>
  )
}
