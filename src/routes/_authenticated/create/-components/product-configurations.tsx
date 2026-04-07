import { AlertCircle, Check, ChevronDown, ImageIcon, RotateCcw } from 'lucide-react'
import { useState } from 'react'

import type { Configuration } from '@/api/product/schema'
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
  onSelectConfigItem,
  onResetConfigurations,
  hasUncheckedRequired,
  selectedConfigCount,
  totalConfigCount
}: ProductConfigurationsProps) => {
  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* Header */}
      <div className='flex shrink-0 items-center justify-between border-b border-border px-4 py-2'>
        <div className='flex items-center gap-2'>
          <span className='text-[13px] font-semibold'>Configurations</span>
          <span className='text-[12px] tabular-nums text-text-tertiary'>
            {selectedConfigCount} of {totalConfigCount} selected
          </span>
        </div>
        <div className='flex items-center gap-2'>
          {hasUncheckedRequired && (
            <span className='flex items-center gap-1 rounded-[4px] bg-destructive/10 px-1.5 py-0.5 text-[11px] font-semibold text-destructive'>
              <AlertCircle className='size-2.5' />
              Required
            </span>
          )}
          {selectedConfigCount > 0 && onResetConfigurations && (
            <button
              type='button'
              className='flex items-center gap-1 rounded-[5px] px-2 py-1 text-[12px] font-medium text-text-tertiary transition-colors duration-[80ms] hover:bg-bg-hover hover:text-foreground'
              onClick={onResetConfigurations}
            >
              <RotateCcw className='size-3' />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* All configuration groups — inline, no tabs */}
      <div className='min-h-0 flex-1 overflow-y-auto'>
        {configs.map((config) => (
          <ConfigGroup
            key={config.name}
            config={config}
            onSelect={(itemId) => onSelectConfigItem(config.name, itemId)}
          />
        ))}
      </div>
    </div>
  )
}

// ── Config Group (collapsible section) ───────────────────────

function ConfigGroup({
  config,
  onSelect,
}: {
  config: Configuration
  onSelect: (itemId: string) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const hasSelected = config.items.some((i) => i.active)
  const isRequired = !config.allownone
  const selectedItem = config.items.find((i) => i.active)

  return (
    <div className='border-b border-border'>
      {/* Group header */}
      <button
        type='button'
        className='flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors duration-75 hover:bg-bg-hover/50'
        onClick={() => setCollapsed(!collapsed)}
      >
        <ChevronDown
          className={cn(
            'size-3.5 shrink-0 text-text-tertiary transition-transform duration-150',
            collapsed && '-rotate-90',
          )}
        />
        <span className='text-[13px] font-semibold'>{config.name}</span>
        {isRequired && !hasSelected && (
          <span className='text-[11px] font-medium text-destructive'>Required</span>
        )}
        {hasSelected && (
          <>
            <span className='flex size-3.5 items-center justify-center rounded-full bg-primary text-white'>
              <Check className='size-2' />
            </span>
            <span className='truncate text-[12px] text-text-tertiary'>
              {selectedItem?.descr_1}
            </span>
          </>
        )}
        <div className='flex-1' />
        <span className='text-[12px] tabular-nums text-text-tertiary'>
          {config.items.filter((i) => i.active).length}/{config.items.length}
        </span>
      </button>

      {/* Items */}
      {!collapsed && (
        <div>
          {config.items.map((item) => {
            const isSelected = item.active
            const quanInt = Math.trunc(Number(item.quan))
            const hasQuan =
              item.quan != null &&
              item.quan !== '' &&
              !Number.isNaN(quanInt) &&
              quanInt > 1
            const price = Number(item.price)
            const multiplier = hasQuan ? quanInt : 1
            const totalPrice = price * multiplier
            const photo = item.photos?.[0]

            return (
              <button
                key={item.id}
                type='button'
                className={cn(
                  'flex w-full items-center gap-3 border-t border-border-light px-4 py-2 text-left transition-colors duration-75',
                  isSelected ? 'bg-primary/5' : 'hover:bg-bg-hover/50',
                )}
                onClick={() => onSelect(item.id)}
              >
                {/* Thumbnail */}
                <div
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-[5px] border',
                    isSelected ? 'border-primary' : 'border-border',
                  )}
                >
                  {config.photosLoading ? (
                    <Spinner className='size-3 text-text-tertiary' />
                  ) : photo ? (
                    <img
                      src={photo}
                      alt={item.descr_1 || 'Configuration option'}
                      className='size-full object-contain p-0.5'
                      loading='lazy'
                    />
                  ) : (
                    <ImageIcon className='size-3.5 text-text-tertiary/40' />
                  )}
                </div>

                {/* Info */}
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center gap-1.5'>
                    <span
                      className={cn(
                        'truncate text-[13px] font-medium',
                        isSelected ? 'text-foreground' : 'text-text-secondary',
                      )}
                    >
                      {item.descr_1}
                    </span>
                    {hasQuan && (
                      <span className='shrink-0 rounded-[3px] border border-border bg-bg-secondary px-1 py-px text-[11px] font-medium tabular-nums'>
                        {quanInt}×
                      </span>
                    )}
                  </div>
                </div>

                {/* Price */}
                <span
                  className={cn(
                    'shrink-0 text-[13px] font-medium tabular-nums',
                    isSelected ? 'text-primary' : 'text-text-tertiary',
                  )}
                >
                  +{formatCurrency(totalPrice)}
                </span>

                {/* Checkbox */}
                <div
                  className={cn(
                    'flex size-[18px] shrink-0 items-center justify-center rounded-[4px] border transition-colors',
                    isSelected
                      ? 'border-primary bg-primary text-white'
                      : 'border-border',
                  )}
                >
                  {isSelected && <Check className='size-3' />}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
