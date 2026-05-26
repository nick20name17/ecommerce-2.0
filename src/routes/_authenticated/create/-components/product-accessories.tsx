import { useMutation } from '@tanstack/react-query'
import { Check, ImageIcon, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { CART_QUERY_KEYS } from '@/api/cart/query'
import { cartService } from '@/api/cart/service'
import type { ProductAccessory } from '@/api/product/schema'
import { NumberInput } from '@/components/ui/number-input'
import { Spinner } from '@/components/ui/spinner'
import { formatCurrency } from '@/helpers/formatters'

interface ProductAccessoriesProps {
  accessories: ProductAccessory[]
  loading: boolean
  customerId: string
  projectId?: number | null
}

export const ProductAccessories = ({
  accessories,
  loading,
  customerId,
  projectId
}: ProductAccessoriesProps) => {
  if (loading) {
    return (
      <div className='border-border flex items-center justify-center border-t px-4 py-6'>
        <Spinner className='text-text-tertiary size-4' />
      </div>
    )
  }
  if (!accessories.length) return null

  return (
    <div className='border-border border-t'>
      <div className='flex items-center gap-2 px-4 py-2.5'>
        <span className='text-[13px] font-semibold'>Accessories</span>
        <span className='text-text-tertiary text-[11px] font-medium'>(not required)</span>
        <span className='text-text-tertiary text-[12px] tabular-nums'>{accessories.length}</span>
      </div>
      <div className='border-border-light border-t p-2.5'>
        <div className='grid grid-cols-1 gap-1.5 sm:grid-cols-2'>
          {accessories.map((acc) => (
            <AccessoryRow
              key={acc.id}
              accessory={acc}
              customerId={customerId}
              projectId={projectId}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

const AccessoryRow = ({
  accessory,
  customerId,
  projectId
}: {
  accessory: ProductAccessory
  customerId: string
  projectId?: number | null
}) => {
  const defaultQty = Math.max(1, Math.trunc(Number(accessory.quan) || 1))
  const [qty, setQty] = useState<number>(defaultQty)
  const [justAdded, setJustAdded] = useState(false)

  const price = Number(accessory.price) || 0
  const oldPrice = Number(accessory.old_price) || 0
  const showOldPrice = oldPrice > price
  const photo = accessory.photos?.[0]
  const hasOwnConfigs = accessory.configurations_count > 0

  const addMutation = useMutation({
    mutationFn: () =>
      cartService.addItem(
        {
          product_autoid: accessory.autoid,
          quantity: qty,
          unit: accessory.unit_meas || accessory.def_unit || ''
        },
        customerId,
        projectId
      ),
    meta: {
      successMessage: `${accessory.descr_1} added to cart`,
      errorMessage: 'Failed to add accessory',
      invalidatesQuery: CART_QUERY_KEYS.detail(customerId, projectId)
    },
    onSuccess: () => {
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 1500)
    },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : 'Failed to add accessory'
      toast.error(msg)
    }
  })

  return (
    <div className='border-border bg-background hover:border-primary/40 flex items-center gap-3 rounded-[8px] border p-2 transition-colors'>
      <div className='border-border bg-bg-secondary/50 flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[6px] border'>
        {photo ? (
          <img
            src={photo}
            alt={accessory.descr_1}
            className='size-full object-contain p-1'
            loading='lazy'
          />
        ) : (
          <ImageIcon className='text-text-tertiary/40 size-4' />
        )}
      </div>
      <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
        <span className='truncate text-[13px] font-medium'>{accessory.descr_1}</span>
        <span className='text-text-tertiary text-[11px] tabular-nums'>
          {price > 0 ? `+${formatCurrency(price)}` : 'Included'}
          {showOldPrice && (
            <span className='text-text-tertiary/60 ml-1 line-through'>
              {formatCurrency(oldPrice)}
            </span>
          )}
        </span>
      </div>
      <div className='flex shrink-0 items-center gap-1.5'>
        <NumberInput
          value={qty}
          onChange={setQty}
          min={1}
          max={accessory.ignore_count ? undefined : accessory.max_count || undefined}
          className='w-[88px]'
        />
        <button
          type='button'
          disabled={addMutation.isPending || hasOwnConfigs}
          onClick={() => addMutation.mutate()}
          title={
            hasOwnConfigs
              ? 'This accessory has its own configurator — add from product page'
              : undefined
          }
          className='bg-primary text-primary-foreground inline-flex h-8 items-center gap-1 rounded-[6px] px-2.5 text-[12px] font-semibold transition-opacity duration-75 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40'
        >
          {addMutation.isPending ? (
            <Spinner className='size-3' />
          ) : justAdded ? (
            <Check className='size-3.5' />
          ) : (
            <Plus className='size-3.5' />
          )}
          Add
        </button>
      </div>
    </div>
  )
}
