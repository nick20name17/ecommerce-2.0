import { Image, Package, Pencil, Settings2, Trash2 } from 'lucide-react'

import { PageEmpty } from '@/components/common/page-empty'
import type { CartItem } from '@/api/product/schema'
import { NumberInput } from '@/components/ui/number-input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCurrency } from '@/helpers/formatters'
import { cn } from '@/lib/utils'

interface CartTableProps {
  items: CartItem[]
  loading: boolean
  updatingQuantityItemId?: number | null
  onEdit: (item: CartItem) => void
  onRemove: (itemId: number) => void
  onQuantityChange: (itemId: number, quantity: number) => void
}

export const CartTable = ({
  items,
  loading,
  updatingQuantityItemId,
  onEdit,
  onRemove,
  onQuantityChange
}: CartTableProps) => {
  if (loading) {
    return (
      <div className='space-y-0'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className='flex items-center gap-3 border-b border-border-light px-5 py-2.5'>
            <Skeleton className='size-9 shrink-0 rounded-[5px]' />
            <div className='min-w-0 flex-1'>
              <Skeleton className='mb-1 h-3.5 w-20' />
              <Skeleton className='h-3 w-32' />
            </div>
            <Skeleton className='h-3.5 w-14' />
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <PageEmpty icon={Package} title='No products added yet' description='Use the catalog to add products.' compact />
    )
  }

  return (
    <div>
      {items.map((item) => {
        const isUpdating = updatingQuantityItemId === item.id
        const activeConfigs = item.configurations?.filter((c) => c.active) ?? []
        const hasConfigs = activeConfigs.length > 0

        return (
          <div
            key={item.id}
            className='group/item border-b border-border-light px-5 py-2.5 transition-colors duration-75 hover:bg-bg-hover/50'
          >
            <div className='flex items-start gap-3'>
              {/* Thumbnail */}
              <div className='flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-[5px] bg-bg-secondary'>
                {item.photo ? (
                  <img src={item.photo} alt={item.name} className='size-full object-cover' />
                ) : (
                  <Image className='size-3.5 text-text-quaternary' />
                )}
              </div>

              {/* Info */}
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-2'>
                  <span className='text-[13px] font-semibold text-foreground'>{item.product_id}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className='min-w-0 truncate text-[13px] text-text-tertiary'>{item.name}</span>
                    </TooltipTrigger>
                    <TooltipContent className='max-w-[260px]'>{item.name}</TooltipContent>
                  </Tooltip>
                </div>
                <div className='mt-1 flex items-center gap-2'>
                  <NumberInput
                    value={item.quantity}
                    min={1}
                    max={item.ignore_count ? undefined : item.max_count}
                    size='sm'
                    showMaxMessage
                    disabled={isUpdating}
                    onChange={(qty) => onQuantityChange(item.id, qty)}
                  />
                  <span className='text-[12px] text-text-quaternary'>×</span>
                  <span className='text-[12px] tabular-nums text-text-tertiary'>{formatCurrency(item.price)}</span>
                </div>

                {/* Selected configurations */}
                {hasConfigs && (
                  <div className='mt-1.5 flex flex-wrap items-center gap-1'>
                    <Settings2 className='size-3 shrink-0 text-text-tertiary' />
                    {activeConfigs.map((c) => (
                      <span
                        key={c.id}
                        className='inline-flex items-center rounded-[4px] border border-border bg-bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-text-secondary'
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Amount + actions */}
              <div className='flex flex-col items-end gap-1'>
                <span className={cn('text-[13px] font-semibold tabular-nums text-foreground', isUpdating && 'animate-pulse')}>
                  {formatCurrency((item.price || 0) * (item.quantity || 0))}
                </span>
                <div className='flex items-center gap-0.5 opacity-0 transition-opacity duration-75 group-hover/item:opacity-100'>
                  <button
                    type='button'
                    className='inline-flex size-6 items-center justify-center rounded-[5px] text-text-tertiary transition-colors duration-75 hover:bg-bg-active hover:text-foreground'
                    onClick={() => onEdit(item)}
                  >
                    <Pencil className='size-3' />
                  </button>
                  <button
                    type='button'
                    className='inline-flex size-6 items-center justify-center rounded-[5px] text-text-tertiary transition-colors duration-75 hover:bg-bg-active hover:text-destructive'
                    onClick={() => onRemove(item.id)}
                  >
                    <Trash2 className='size-3' />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
