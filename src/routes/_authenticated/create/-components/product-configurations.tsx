import { AlertCircle, Check, ImageIcon, Sparkles } from 'lucide-react'

import type { Configuration } from '@/api/product/schema'
import { Spinner } from '@/components/ui/spinner'
import { formatCurrency } from '@/helpers/formatters'
import { cn } from '@/lib/utils'

interface ProductConfigurationsProps {
  configs: Configuration[]
  activeTab: string
  onActiveTabChange: (tab: string) => void
  onSelectConfigItem: (configName: string, itemId: string) => void
  hasUncheckedRequired: boolean
  selectedConfigCount: number
  totalConfigCount: number
}

export function ProductConfigurations({
  configs,
  activeTab,
  onActiveTabChange,
  onSelectConfigItem,
  hasUncheckedRequired,
  selectedConfigCount,
  totalConfigCount
}: ProductConfigurationsProps) {
  return (
    <div className='space-y-4 rounded-xl border bg-muted/20 p-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Sparkles className='size-4 text-primary' />
          <h3 className='text-sm font-semibold'>Configurations</h3>
          <span className='text-xs text-muted-foreground'>
            ({selectedConfigCount}/{totalConfigCount})
          </span>
        </div>
        {hasUncheckedRequired && (
          <span className='flex items-center gap-1.5 rounded-md bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive'>
            <AlertCircle className='size-3' />
            Required
          </span>
        )}
      </div>

      <div className='flex flex-wrap gap-1 rounded-lg bg-muted p-1'>
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
                <span className={cn('flex size-4 items-center justify-center rounded-full bg-primary text-white')}>
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
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-primary/50'
                )}
                onClick={() => onSelectConfigItem(c.name, item.id)}
              >
                {isSelected && (
                  <div className='absolute top-1.5 right-1.5 z-10 flex size-5 items-center justify-center rounded-full bg-primary text-white'>
                    <Check className='size-3' />
                  </div>
                )}

                <div className='relative aspect-square bg-muted/30'>
                  {c.photosLoading ? (
                    <div className='flex size-full items-center justify-center'>
                      <Spinner className='size-5 text-muted-foreground' />
                    </div>
                  ) : item.photos?.length ? (
                    <img
                      src={item.photos[0]}
                      alt={item.descr_1}
                      className='size-full object-contain p-2 transition-transform group-hover:scale-105'
                    />
                  ) : (
                    <div className='flex size-full items-center justify-center'>
                      <ImageIcon className='size-8 text-muted-foreground/40' />
                    </div>
                  )}
                </div>

                <div className='flex flex-1 flex-col gap-0.5 p-2'>
                  <span className='line-clamp-2 text-left text-[11px] leading-tight text-muted-foreground wrap-break-word'>
                    {item.descr_1}
                  </span>
                  <span className={cn('mt-auto text-left text-xs font-semibold', isSelected && 'text-primary')}>
                    +{formatCurrency(item.price)}
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
