import { Check } from 'lucide-react'

import { NumberInput } from '@/components/ui/number-input'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/helpers/formatters'
import { cn } from '@/lib/utils'

interface ProductInfoSectionProps {
  displayName: string
  configLoading: boolean
  hasConfigs: boolean
  hasMultipleUnits: boolean
  priceDisplay: number
  oldPriceDisplay: number
  hasDiscount: boolean
  quantity: number
  onQuantityChange: (value: number) => void
  ignoreCount: boolean
  maxCount: number
  selectedUnit: string
  onSelectedUnitChange: (unit: string) => void
  units:
    | Array<{ autoid: string; unit: string; multiplier: string; price: string; old_price: string }>
    | undefined
  specs: Array<{ descr: string; info: string }>
}

export const ProductInfoSection = ({
  displayName,
  configLoading,
  hasConfigs,
  hasMultipleUnits,
  priceDisplay,
  oldPriceDisplay,
  hasDiscount,
  quantity,
  onQuantityChange,
  ignoreCount,
  maxCount,
  selectedUnit,
  onSelectedUnitChange,
  units,
  specs
}: ProductInfoSectionProps) => {
  return (
    <div className='flex flex-col gap-4'>
      {/* Product name */}
      <h3 className='text-[15px] font-semibold leading-tight tracking-[-0.01em]'>
        {displayName}
      </h3>

      {/* Price */}
      {configLoading ? (
        <div className='space-y-1.5'>
          <Skeleton className='h-6 w-24' />
          <Skeleton className='h-3 w-16' />
        </div>
      ) : (
        (hasConfigs || !hasMultipleUnits) && (
          <div className='flex items-baseline gap-2'>
            <span
              className={cn(
                'text-[22px] font-bold tabular-nums tracking-tight',
                hasDiscount && 'text-green-600 dark:text-green-500'
              )}
            >
              {formatCurrency(priceDisplay)}
            </span>
            {hasDiscount && Math.round((1 - priceDisplay / oldPriceDisplay) * 100) > 0 && (
              <>
                <span className='text-[13px] tabular-nums text-text-tertiary line-through'>
                  {formatCurrency(oldPriceDisplay)}
                </span>
                <span className='rounded-[4px] bg-green-100 px-1.5 py-0.5 text-[11px] font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-400'>
                  -{Math.round((1 - priceDisplay / oldPriceDisplay) * 100)}%
                </span>
              </>
            )}
          </div>
        )
      )}

      {/* Quantity */}
      {!configLoading && (
        <div>
          <span className='mb-1.5 block text-[12px] font-medium uppercase tracking-[0.04em] text-text-tertiary'>
            Quantity
          </span>
          <div className='w-fit'>
            <NumberInput
              value={quantity}
              onChange={onQuantityChange}
              min={0}
              max={ignoreCount ? undefined : maxCount}
              disabled={!ignoreCount && maxCount < 0}
              showMaxMessage={!ignoreCount}
            />
          </div>
        </div>
      )}

      {/* Units */}
      {!configLoading && hasMultipleUnits && units && (
        <div>
          <span className='mb-1.5 block text-[12px] font-medium uppercase tracking-[0.04em] text-text-tertiary'>
            Unit of Measure
          </span>
          <div className='flex flex-wrap gap-1.5'>
            {units.map((u) => {
              const isSelected = selectedUnit === u.unit
              return (
                <button
                  key={u.autoid}
                  type='button'
                  className={cn(
                    'flex items-center gap-1.5 rounded-[6px] border px-2.5 py-1.5 text-[13px] transition-colors duration-[80ms]',
                    isSelected
                      ? 'border-primary bg-primary/10 font-semibold text-primary'
                      : 'border-border hover:border-primary/40'
                  )}
                  onClick={() => onSelectedUnitChange(u.unit)}
                >
                  <span className='font-medium'>{u.unit}</span>
                  <span className={cn('text-[12px] tabular-nums', isSelected ? 'text-primary/80' : 'text-text-tertiary')}>
                    {formatCurrency(u.price)}
                  </span>
                  {u.multiplier !== '1.0000' && (
                    <span className='rounded-[3px] bg-bg-secondary px-1 py-0.5 text-[11px] font-medium tabular-nums'>
                      ×{parseFloat(u.multiplier)}
                    </span>
                  )}
                  {isSelected && <Check className='size-3' />}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Specifications */}
      {!configLoading && specs.length > 0 && (
        <div>
          <span className='mb-1.5 block text-[12px] font-medium uppercase tracking-[0.04em] text-text-tertiary'>
            Specifications
          </span>
          <div className='divide-y divide-border-light rounded-[6px] border border-border'>
            {specs.map((spec) => (
              <div
                key={spec.descr}
                className='flex gap-3 px-3 py-2 text-[13px]'
              >
                <span className='w-2/5 shrink-0 font-medium text-foreground'>{spec.descr}</span>
                <span className='text-text-tertiary'>{spec.info}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
