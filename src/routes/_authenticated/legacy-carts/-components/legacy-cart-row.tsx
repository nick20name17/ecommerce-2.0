import { ChevronDown, ImageOff } from 'lucide-react'
import { useState } from 'react'

import type { LegacyCart } from '@/api/legacy-cart/schema'
import { formatCurrency, formatDateTimeMedium } from '@/helpers/formatters'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { cn } from '@/lib/utils'

interface LegacyCartRowProps {
  cart: LegacyCart
  isMobile: boolean
}

export function LegacyCartRow({ cart, isMobile }: LegacyCartRowProps) {
  const bp = useBreakpoint()
  const isTablet = bp === 'tablet'
  const [open, setOpen] = useState(false)

  const itemsCount = cart.items.length
  const updatedAt = cart.updated_at ? formatDateTimeMedium(cart.updated_at) : '—'

  return (
    <div className='border-b border-border-light'>
      {/* Summary row */}
      <button
        type='button'
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex w-full cursor-pointer items-center text-left text-foreground transition-colors duration-100 hover:bg-bg-hover',
          isMobile
            ? 'gap-2 px-3.5 py-2'
            : isTablet
              ? 'gap-4 px-5 py-2'
              : 'gap-6 px-6 py-2',
        )}
        aria-expanded={open}
      >
        {isMobile ? (
          <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
            <div className='flex items-center gap-2'>
              <span className='text-[13px] font-medium tabular-nums text-foreground'>
                {cart.ebms_id || '—'}
              </span>
              <span className='text-[12px] tabular-nums text-text-tertiary'>
                #{cart.user_id}
              </span>
              <span className='inline-flex items-center rounded-[4px] bg-bg-secondary px-1.5 py-0.5 text-[12px] font-medium text-text-secondary'>
                {cart.in_level || '—'}
              </span>
              <span className='ml-auto text-[13px] font-semibold tabular-nums text-foreground'>
                {formatCurrency(cart.cart_total)}
              </span>
            </div>
            <span className='truncate text-[12.5px] text-text-secondary'>
              {cart.email || '—'}
            </span>
            <span className='text-[12px] text-text-tertiary'>{updatedAt}</span>
          </div>
        ) : (
          <>
            <div className='w-[70px] shrink-0 text-[13px] tabular-nums text-text-tertiary'>
              #{cart.user_id}
            </div>
            <div className='w-[100px] shrink-0 truncate text-[13px] font-medium tabular-nums'>
              {cart.ebms_id || '—'}
            </div>
            <div className='w-[80px] shrink-0'>
              {cart.in_level ? (
                <span className='inline-flex items-center rounded-[4px] bg-bg-secondary px-1.5 py-0.5 text-[13px] font-medium text-text-secondary'>
                  {cart.in_level}
                </span>
              ) : (
                <span className='text-[13px] text-text-tertiary'>—</span>
              )}
            </div>
            <div className='min-w-0 flex-1 truncate text-[13px] text-text-secondary'>
              {cart.email || <span className='text-text-tertiary'>—</span>}
            </div>
            <div className='w-[180px] shrink-0 text-[13px] tabular-nums text-text-secondary'>
              {updatedAt}
            </div>
            <div className='w-[110px] shrink-0 text-right text-[13px] font-semibold tabular-nums text-foreground'>
              {formatCurrency(cart.cart_total)}
            </div>
          </>
        )}
        <div className='flex w-[28px] shrink-0 items-center justify-center'>
          <ChevronDown
            className={cn(
              'size-4 text-text-tertiary transition-transform duration-150',
              open && 'rotate-180',
            )}
          />
        </div>
      </button>

      {/* Expanded items */}
      {open && (
        <div
          className={cn(
            'border-t border-border-light bg-bg-secondary/40',
            isMobile ? 'px-3.5 py-2' : isTablet ? 'px-5 py-2' : 'px-6 py-2',
          )}
        >
          {itemsCount === 0 ? (
            <div className='py-3 text-center text-[13px] text-text-tertiary'>
              No items in this cart.
            </div>
          ) : (
            <ul className='flex flex-col divide-y divide-border-light'>
              {cart.items.map((item, idx) => (
                <li
                  key={`${item.id}-${idx}`}
                  className='flex items-center gap-3 py-1.5'
                >
                  <div className='flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-[5px] bg-background'>
                    {item.photo ? (
                      <img
                        src={item.photo}
                        alt={item.name}
                        className='size-full object-cover'
                        loading='lazy'
                      />
                    ) : (
                      <ImageOff className='size-4 text-text-tertiary' />
                    )}
                  </div>
                  <div className='flex min-w-0 flex-1 flex-col'>
                    <span className='truncate text-[13px] font-medium text-foreground'>
                      {item.name}
                    </span>
                    <span className='text-[12px] text-text-tertiary'>
                      {item.id}
                      {item.unit ? ` · ${item.unit}` : ''}
                    </span>
                  </div>
                  <div className='shrink-0 text-[13px] tabular-nums text-text-secondary'>
                    {item.quantity.current} ×{' '}
                    <span className='text-text-tertiary'>
                      {formatCurrency(item.price)}
                    </span>
                  </div>
                  <div className='w-[100px] shrink-0 text-right text-[13px] font-semibold tabular-nums text-foreground'>
                    {formatCurrency(item.amount)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
