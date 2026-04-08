import { Package } from 'lucide-react'

import type { OrderItem, ShippingRate, ShippingRatesResponse } from '@/api/order/schema'
import { cn } from '@/lib/utils'

export function RatesResultStep({
  data,
  itemMap,
  selectedRate,
  onSelectRate,
}: {
  data: ShippingRatesResponse
  itemMap: Map<string, OrderItem>
  selectedRate: ShippingRate | null
  onSelectRate: (rate: ShippingRate) => void
}) {
  return (
    <div>
      <div className='px-5 py-3'>
        <div className='mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary'>
          Select a Rate
        </div>
        <div className='space-y-1.5'>
          {data.rates.length === 0 ? (
            <div className='py-4 text-center text-[13px] text-text-tertiary'>
              No shipping rates available
            </div>
          ) : (
            data.rates
              .slice()
              .sort((a, b) => a.cost - b.cost)
              .map((rate) => (
                <RateCard
                  key={`${rate.carrier_id}-${rate.service_id}`}
                  rate={rate}
                  selected={selectedRate?.rate_id === rate.rate_id}
                  onSelect={() => onSelectRate(rate)}
                />
              ))
          )}
        </div>
      </div>

      {data.packages.length > 0 && (
        <div className='border-t border-border px-5 py-3'>
          <div className='mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary'>
            Packages ({data.packages.length})
          </div>
          <div className='space-y-2'>
            {data.packages.map((pkg, i) => (
              <div key={i} className='rounded-[6px] border border-border-light bg-bg-secondary/50 px-3 py-2'>
                <div className='flex items-center gap-2'>
                  <Package className='size-3.5 text-text-tertiary' />
                  <span className='text-[13px] font-medium text-foreground'>Package {i + 1}</span>
                  <span className='text-[12px] text-text-tertiary'>
                    {pkg.length} x {pkg.width} x {pkg.height} cm · {pkg.weight} kg
                  </span>
                </div>
                {pkg.items.length > 0 && (
                  <div className='mt-1.5 flex flex-wrap gap-1'>
                    {pkg.items.map((autoid) => {
                      const item = itemMap.get(autoid)
                      return (
                        <span
                          key={autoid}
                          className='rounded bg-bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-text-secondary'
                        >
                          {item?.inven || autoid.slice(0, 8)}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function RateCard({ rate, selected, onSelect }: { rate: ShippingRate; selected: boolean; onSelect: () => void }) {
  const isFree = rate.cost === 0
  return (
    <button
      type='button'
      className={cn(
        'flex w-full items-center gap-3 rounded-[6px] border px-3 py-2.5 text-left transition-colors duration-75',
        selected
          ? 'border-primary bg-primary/[0.06]'
          : 'border-border hover:border-primary/40 hover:bg-primary/[0.04]',
      )}
      onClick={onSelect}
    >
      <div
        className={cn(
          'flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-75',
          selected
            ? 'border-primary bg-primary'
            : 'border-border-heavy',
        )}
      >
        {selected && <div className='size-1.5 rounded-full bg-white' />}
      </div>
      <div className='min-w-0 flex-1'>
        <div className='text-[13px] font-medium text-foreground'>{rate.type}</div>
        <div className='text-[12px] text-text-tertiary'>{rate.service_id}</div>
      </div>
      <span
        className={cn(
          'shrink-0 text-[14px] font-semibold tabular-nums',
          isFree ? 'text-emerald-600' : 'text-foreground',
        )}
      >
        {isFree ? 'Free' : `$${rate.cost.toFixed(2)}`}
      </span>
    </button>
  )
}
