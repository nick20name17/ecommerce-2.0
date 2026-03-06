import { AlertCircle, Check, ImageIcon, RotateCcw, Sparkles } from 'lucide-react'

import type { Configuration } from '@/api/product/schema'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { formatCurrency } from '@/helpers/formatters'
import { cn } from '@/lib/utils'

interface ProductConfigurationsProps {
  configs: Configuration[]
  activeTab: string
  onActiveTabChange: (tab: string) => void
  onSelectConfigItem: (configName: string, itemId: string) => void
  onResetConfigurations?: () => void
  hasUncheckedRequired: boolean
  selectedConfigCount: number
  totalConfigCount: number
}

export const ProductConfigurations = ({
  configs,
  activeTab,
  onActiveTabChange,
  onSelectConfigItem,
  onResetConfigurations,
  hasUncheckedRequired,
  selectedConfigCount,
  totalConfigCount
}: ProductConfigurationsProps) => {
  return (
    <div className='bg-muted/20 space-y-4 rounded-xl border p-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Sparkles className='text-primary size-4' />
          <h3 className='text-sm font-semibold'>Configurations</h3>
          <span className='text-muted-foreground text-xs'>
            ({selectedConfigCount}/{totalConfigCount})
          </span>
        </div>
        <div className='flex items-center gap-2'>
          {selectedConfigCount > 0 && onResetConfigurations && (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='text-muted-foreground h-8 gap-1.5 text-xs'
              onClick={onResetConfigurations}
            >
              <RotateCcw className='size-3.5' />
              Reset
            </Button>
          )}
          {hasUncheckedRequired && (
            <span className='bg-destructive/10 text-destructive flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium'>
              <AlertCircle className='size-3' />
              Required
            </span>
          )}
        </div>
      </div>

      <div className='bg-muted flex flex-wrap gap-1 rounded-lg p-1'>
        {configs.map((c) => {
          const hasSelected = c.items.some((i) => i.active)
          const isRequired = !c.allownone
          const isActive = activeTab === c.name
          return (
            <button
              key={c.name}
              type='button'
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                isActive
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => onActiveTabChange(c.name)}
            >
              {hasSelected && (
                <span
                  className={cn(
                    'bg-primary flex size-4 items-center justify-center rounded-full text-white'
                  )}
                >
                  <Check className='size-2.5' />
                </span>
              )}
              <span>{c.name}</span>
              {isRequired && !hasSelected && <span className='text-destructive'>*</span>}
            </button>
          )
        })}
      </div>

      {configs.map((c) => (
        <div
          key={c.name}
          className={cn(
            'grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
            activeTab !== c.name && 'hidden'
          )}
        >
          {c.items.map((item) => {
            const isSelected = item.active
            return (
              <button
                key={item.id}
                type='button'
                className={cn(
                  'group relative flex flex-col overflow-hidden rounded-lg border transition-all',
                  isSelected
                    ? 'border-primary bg-primary/5 ring-primary ring-1'
                    : 'border-border hover:border-primary/50'
                )}
                onClick={() => onSelectConfigItem(c.name, item.id)}
              >
                {(() => {
                  const quanInt = Math.trunc(Number(item.quan))
                  return item.quan != null && item.quan !== '' && !Number.isNaN(quanInt) ? (
                    <div className='bg-background/95 text-foreground absolute top-1.5 left-1.5 z-10 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium shadow-sm'>
                      {quanInt}x
                    </div>
                  ) : null
                })()}
                {isSelected && (
                  <div className='bg-primary absolute top-1.5 right-1.5 z-10 flex size-5 items-center justify-center rounded-full text-white'>
                    <Check className='size-3' />
                  </div>
                )}

                <div className='bg-muted/30 relative aspect-square'>
                  {c.photosLoading ? (
                    <div className='flex size-full items-center justify-center'>
                      <Spinner className='text-muted-foreground size-5' />
                    </div>
                  ) : item.photos?.length ? (
                    <img
                      src={item.photos[0]}
                      alt={item.descr_1}
                      className='size-full object-contain p-2 transition-transform group-hover:scale-105'
                    />
                  ) : (
                    <div className='flex size-full items-center justify-center'>
                      <ImageIcon className='text-muted-foreground/40 size-8' />
                    </div>
                  )}
                </div>

                <div className='flex flex-1 flex-col gap-0.5 p-2'>
                  <span className='text-muted-foreground line-clamp-2 text-left text-[11px] leading-tight wrap-break-word'>
                    {item.descr_1}
                  </span>
                  <span
                    className={cn(
                      'mt-auto text-left text-xs font-semibold',
                      isSelected && 'text-primary'
                    )}
                  >
                    +{formatCurrency(
                      (() => {
                        const price = Number(item.price)
                        const qty = Math.trunc(Number(item.quan))
                        const multiplier = !Number.isNaN(qty) && qty > 0 ? qty : 1
                        return price * multiplier
                      })()
                    )}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
