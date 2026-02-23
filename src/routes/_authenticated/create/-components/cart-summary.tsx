import type { Cart } from '@/api/product/schema'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/helpers/formatters'
import { cn } from '@/lib/utils'

interface CartSummaryProps {
  cart: Cart | null
  loading: boolean
  updating: boolean
}

export function CartSummary({ cart, loading, updating }: CartSummaryProps) {
  if (loading) {
    return (
      <div className='space-y-2'>
        <div className='flex items-center justify-between'>
          <Skeleton className='h-4 w-16' />
          <Skeleton className='h-4 w-20' />
        </div>
        <div className='flex items-center justify-between'>
          <Skeleton className='h-5 w-12' />
          <Skeleton className='h-6 w-24' />
        </div>
      </div>
    )
  }

  if (!cart) return null

  const oldTotal = Number(cart.old_total) || 0
  const total = Number(cart.total) || 0
  const discountAmount = oldTotal - total
  const hasDiscount = discountAmount > 0.01
  const itemCount = cart.items?.length ?? 0

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between text-sm text-muted-foreground'>
        <span>Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
        <span className={cn(updating && 'animate-pulse')}>
          {hasDiscount ? formatCurrency(oldTotal) : formatCurrency(total)}
        </span>
      </div>
      {hasDiscount && (
        <div className='flex items-center justify-between text-sm'>
          <span className='text-green-600'>Discount</span>
          <span className={cn('text-green-600', updating && 'animate-pulse')}>
            -{formatCurrency(discountAmount)}
          </span>
        </div>
      )}
      <div className='border-t pt-2'>
        <div className='flex items-center justify-between'>
          <span className='font-semibold'>Total</span>
          <span className={cn('text-xl font-bold tabular-nums', updating && 'animate-pulse')}>
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </div>
  )
}
