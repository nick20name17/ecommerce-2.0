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
  units: Array<{ autoid: string; unit: string; multiplier: string; price: string; old_price: string }> | undefined
  specs: Array<{ descr: string; info: string }>
}

export function ProductInfoSection({
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
}: ProductInfoSectionProps) {
  return (
    <>
      <div className='flex min-w-0 flex-col gap-5'>
        <h1 className='text-xl font-bold leading-tight tracking-tight wrap-break-word lg:text-2xl'>
          {displayName}
        </h1>

        {configLoading ? (
          <div className='space-y-2'>
            <Skeleton className='h-8 w-32' />
            <Skeleton className='h-4 w-20' />
          </div>
        ) : (
          (hasConfigs || !hasMultipleUnits) && (
            <div className='flex flex-wrap items-baseline gap-2'>
              <span
                className={cn(
                  'text-2xl font-bold tracking-tight lg:text-3xl',
                  hasDiscount && 'text-green-600 dark:text-green-500'
                )}
              >
                {formatCurrency(priceDisplay)}
              </span>
              {hasDiscount && Math.round((1 - priceDisplay / oldPriceDisplay) * 100) > 0 && (
                <>
                  <span className='text-base text-muted-foreground line-through'>
                    {formatCurrency(oldPriceDisplay)}
                  </span>
                  <span className='rounded-md bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-400'>
                    -{Math.round((1 - priceDisplay / oldPriceDisplay) * 100)}%
                  </span>
                </>
              )}
            </div>
          )
        )}

        {!configLoading && (
          <div className='space-y-2'>
            <span className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
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
      </div>

      {!configLoading && (
        <>
          {hasMultipleUnits && units && (
            <div className='space-y-2'>
              <span className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                Unit of Measure
              </span>
              <div className='flex flex-wrap gap-2'>
                {units.map((u) => {
                  const isSelected = selectedUnit === u.unit
                  return (
                    <button
                      key={u.autoid}
                      type='button'
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm ring-1 transition-all',
                        isSelected
                          ? 'bg-primary text-primary-foreground ring-primary'
                          : 'bg-card ring-border hover:ring-primary/50'
                      )}
                      onClick={() => onSelectedUnitChange(u.unit)}
                    >
                      <span className='font-semibold'>{u.unit}</span>
                      <span className={cn('text-xs', isSelected ? 'opacity-80' : 'text-muted-foreground')}>
                        {formatCurrency(u.price)}
                      </span>
                      {u.multiplier !== '1.0000' && (
                        <span className={cn('rounded px-1 py-0.5 text-[10px] font-medium', isSelected ? 'bg-white/20' : 'bg-muted')}>
                          ×{parseFloat(u.multiplier)}
                        </span>
                      )}
                      {isSelected && <Check className='size-3.5' />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {specs.length > 0 && (
            <div className='space-y-2'>
              <span className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                Specifications
              </span>
              <div className='divide-y rounded-lg border bg-muted/20'>
                {specs.map((spec) => (
                  <div key={spec.descr} className='flex gap-3 px-3 py-2.5 text-sm'>
                    <span className='w-2/5 shrink-0 font-medium wrap-break-word'>{spec.descr}</span>
                    <span className='text-muted-foreground wrap-break-word'>{spec.info}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}
