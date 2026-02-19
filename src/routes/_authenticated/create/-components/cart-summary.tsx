import type { Cart } from '@/api/product/schema'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/helpers/formatters'

interface CartSummaryProps {
  cart: Cart | null
  loading: boolean
  updating: boolean
}

export function CartSummary({ cart, loading, updating }: CartSummaryProps) {
  if (loading) {
    return (
      <div className='bg-muted/50 flex items-center justify-between rounded-lg border p-4'>
        <Skeleton className='h-5 w-20' />
        <Skeleton className='h-6 w-28' />
      </div>
    )
  }

  if (!cart) return null

  const hasDiscount = (cart.old_total || 0) > (cart.total || 0)

  return (
    <div className='bg-muted/50 rounded-lg border p-4'>
      {hasDiscount && (
        <div className='mb-2 flex items-center justify-between'>
          <span className='text-muted-foreground text-sm'>Original Price</span>
          <span className={`text-muted-foreground text-sm line-through ${updating ? 'animate-pulse' : ''}`}>
            {formatCurrency(cart.old_total)}
          </span>
        </div>
      )}
      <div className='flex items-center justify-between'>
        <span className='font-semibold'>Total</span>
        <span className={`text-lg font-bold ${updating ? 'animate-pulse' : ''}`}>
          {formatCurrency(cart.total)}
        </span>
      </div>
    </div>
  )
}
