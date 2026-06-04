import { Box, GripVertical, Package, Trash2 } from 'lucide-react'

import type { OrderItem } from '@/api/order/schema'
import { cn } from '@/lib/utils'

import type { LocalPackage } from './shipping-rates-dialog'

export function PackageCard({
  pkg,
  index,
  itemMap,
  isDragOver,
  onRemove,
  onUpdateDimension,
  onUnassignItem,
  onDragOver,
  onDragLeave,
  onDrop
}: {
  pkg: LocalPackage
  index: number
  itemMap: Map<string, OrderItem>
  isDragOver: boolean
  onRemove: () => void
  onUpdateDimension: (field: 'weight' | 'length' | 'width' | 'height', value: number) => void
  onUnassignItem: (autoid: string) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
}) {
  const hasItems = pkg.items.length > 0

  return (
    <div
      className={cn(
        'group/pkg overflow-hidden rounded-lg border transition-all',
        isDragOver ? 'border-primary bg-primary/[0.04] ring-1 ring-primary/20' : 'border-border'
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Header — shipping-label style */}
      <div className='flex items-center gap-2.5 bg-foreground/[0.03] px-3 py-2'>
        <div className='flex size-7 items-center justify-center rounded-md bg-foreground/[0.07]'>
          <Box className='size-4 text-text-secondary' />
        </div>
        <div className='min-w-0 flex-1'>
          <div className='text-[13px] leading-tight font-semibold text-foreground'>
            Package {index + 1}
          </div>
          <div className='text-text-quaternary text-[11px] leading-tight'>
            {hasItems
              ? `${pkg.items.length} item${pkg.items.length !== 1 ? 's' : ''} assigned`
              : 'No items yet'}
          </div>
        </div>
        <button
          type='button'
          className='text-text-quaternary inline-flex size-6 items-center justify-center rounded-[5px] opacity-0 transition-all group-hover/pkg:opacity-100 hover:bg-destructive/10 hover:text-destructive'
          onClick={onRemove}
        >
          <Trash2 className='size-3' />
        </button>
      </div>

      {/* Dimensions — 2×2 grid with inline units */}
      <div className='grid grid-cols-3 gap-x-1.5 gap-y-1.5 px-3 py-2.5'>
        {(
          [
            ['length', 'L', 'cm'],
            ['width', 'W', 'cm'],
            ['height', 'H', 'cm']
          ] as const
        ).map(([field, label, unit]) => {
          const isInvalid = pkg[field] < 0.01
          return (
            <div key={field} className='relative'>
              <div
                className={cn(
                  'flex h-8 items-center overflow-hidden rounded-[5px] border transition-colors focus-within:ring-1',
                  isInvalid
                    ? 'border-destructive/40 focus-within:border-destructive focus-within:ring-destructive/30'
                    : 'border-border focus-within:border-ring focus-within:ring-ring/50'
                )}
              >
                <span
                  className={cn(
                    'flex h-full w-6 shrink-0 items-center justify-center border-r bg-foreground/[0.03] text-[11px] font-semibold',
                    isInvalid
                      ? 'border-destructive/20 text-destructive/70'
                      : 'border-border text-text-tertiary'
                  )}
                >
                  {label}
                </span>
                <input
                  type='number'
                  min={0.01}
                  step={0.01}
                  value={pkg[field] || ''}
                  onChange={e => onUpdateDimension(field, Number(e.target.value) || 0)}
                  aria-label={label}
                  className='h-full min-w-0 flex-1 bg-background px-1.5 text-[12px] text-foreground tabular-nums outline-none'
                  placeholder='0'
                />
                <span className='text-text-quaternary pr-1.5 text-[10px]'>{unit}</span>
              </div>
            </div>
          )
        })}
        <div className='col-span-3'>
          <div
            className={cn(
              'flex h-8 items-center overflow-hidden rounded-[5px] border transition-colors focus-within:ring-1',
              'border-border focus-within:border-ring focus-within:ring-ring/50'
            )}
          >
            <span className='flex h-full shrink-0 items-center justify-center border-r border-border bg-foreground/[0.03] px-2 text-[11px] font-medium text-text-tertiary'>
              Weight
            </span>
            <input
              type='number'
              min={0}
              step={0.01}
              value={pkg.weight || ''}
              onChange={e =>
                onUpdateDimension('weight', Math.round((Number(e.target.value) || 0) * 100) / 100)
              }
              aria-label='Weight'
              className='h-full min-w-0 flex-1 bg-background px-2 text-[12px] text-foreground tabular-nums outline-none'
              placeholder='0'
            />
            <span className='text-text-quaternary pr-2 text-[10px]'>kg</span>
          </div>
        </div>
      </div>

      {hasItems && (
        <div className='space-y-0.5 border-t border-border/60 p-2'>
          {pkg.items.map(autoid => {
            const item = itemMap.get(autoid)
            if (!item) return null
            return (
              <div
                key={autoid}
                className='group/item flex items-center gap-1.5 rounded-[5px] px-1.5 py-1 transition-colors hover:bg-foreground/[0.03]'
              >
                <Package className='text-text-quaternary size-3 shrink-0' />
                <span className='shrink-0 text-[12px] font-medium text-foreground tabular-nums'>
                  {item.inven}
                </span>
                <span className='min-w-0 flex-1 truncate text-[11px] text-text-tertiary'>
                  {item.descr}
                </span>
                <button
                  type='button'
                  className='text-text-quaternary flex size-5 shrink-0 items-center justify-center rounded-sm opacity-0 transition-all group-hover/item:opacity-100 hover:bg-destructive/10 hover:text-destructive'
                  onClick={() => onUnassignItem(autoid)}
                >
                  <Trash2 className='size-2.5' />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {!hasItems && (
        <div
          className={cn(
            'mx-2 mb-2 flex flex-col items-center gap-1 rounded-md border border-dashed py-3 transition-colors',
            isDragOver
              ? 'border-primary bg-primary/[0.04] text-primary'
              : 'border-border-heavy/30 text-text-quaternary'
          )}
        >
          <GripVertical className='size-3.5 opacity-40' />
          <span className='text-[11px]'>{isDragOver ? 'Drop to add' : 'Drag items here'}</span>
        </div>
      )}
    </div>
  )
}
