import { ShoppingCart } from 'lucide-react'

import { CartSummary } from './cart-summary'
import { CartTable } from './cart-table'
import { CreatePageSection } from './create-page-section'
import type { Cart, CartItem } from '@/api/product/schema'

interface CreatePageCartColumnProps {
  cart: Cart | null | undefined
  cartItems: CartItem[]
  cartLoading: boolean
  customerLoading: boolean
  updatingQuantityItemId: number | null
  cartUpdating: boolean
  onEdit: (item: CartItem) => void
  onRemove: (itemId: number) => void
  onQuantityChange: (itemId: number, quantity: number) => void
}

export const CreatePageCartColumn = ({
  cart,
  cartItems,
  cartLoading,
  customerLoading,
  updatingQuantityItemId,
  cartUpdating,
  onEdit,
  onRemove,
  onQuantityChange
}: CreatePageCartColumnProps) => {
  const loading = cartLoading || customerLoading
  return (
    <CreatePageSection
      icon={<ShoppingCart className='size-4' />}
      title='Cart'
      trailing={
        cartItems.length > 0 && !cartLoading ? (
          <span className='bg-accent/10 text-primary rounded-full px-2.5 py-0.5 text-[13px] font-medium'>
            {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
          </span>
        ) : null
      }
      noPadding
    >
      <CartTable
        items={cartItems}
        loading={loading}
        updatingQuantityItemId={updatingQuantityItemId}
        onEdit={onEdit}
        onRemove={onRemove}
        onQuantityChange={onQuantityChange}
      />
      {(cart || loading) && (
        <div className='border-t p-4'>
          <CartSummary
            cart={cart ?? null}
            loading={loading}
            updating={cartUpdating}
          />
        </div>
      )}
    </CreatePageSection>
  )
}
