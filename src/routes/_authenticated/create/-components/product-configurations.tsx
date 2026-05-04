import { AlertCircle, Check, ChevronDown, ChevronRight, ImageIcon, RotateCcw } from 'lucide-react'
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
  onSelectSubConfigItem?: (parentConfigName: string, parentItemId: string, subConfigName: string, subItemId: string) => void
  onResetConfigurations?: () => void
  hasUncheckedRequired: boolean
  selectedConfigCount: number
  totalConfigCount: number
  wizardMode?: boolean
  activeStep?: string
  onStepChange?: (step: string) => void
  canGoNext?: boolean
  canGoPrev?: boolean
  onNext?: () => void
  onPrev?: () => void
}

export const ProductConfigurations = ({
  configs,
  onSelectConfigItem,
  onSelectSubConfigItem,
  onResetConfigurations,
  hasUncheckedRequired,
  selectedConfigCount,
  totalConfigCount,
  wizardMode,
  activeStep,
  onStepChange,
  canGoNext,
  canGoPrev,
  onNext,
  onPrev
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

      {/* Configuration groups */}
      <div className='min-h-0 flex-1 overflow-y-auto'>
        {configs.map((config, index) => {
          const isActive = wizardMode ? config.name === activeStep : true

          return wizardMode && !isActive ? (
            <WizardStepHeader
              key={config.name}
              config={config}
              stepIndex={index}
              onClick={() => onStepChange?.(config.name)}
            />
          ) : (
            <ConfigGroup
              key={config.name}
              config={config}
              onSelect={(itemId) => onSelectConfigItem(config.name, itemId)}
              onSelectSubConfigItem={onSelectSubConfigItem
                ? (parentItemId, subConfigName, subItemId) =>
                    onSelectSubConfigItem(config.name, parentItemId, subConfigName, subItemId)
                : undefined
              }
              wizardFooter={wizardMode ? (
                <div className='flex items-center gap-2 border-t border-border px-4 py-2.5'>
                  <button
                    type='button'
                    disabled={!canGoPrev}
                    onClick={onPrev}
                    className='flex-1 rounded-[6px] border border-border px-3 py-1.5 text-[13px] font-medium transition-colors duration-75 hover:bg-bg-hover disabled:pointer-events-none disabled:opacity-40'
                  >
                    Previous step
                  </button>
                  <button
                    type='button'
                    disabled={!canGoNext}
                    onClick={onNext}
                    className='flex-1 rounded-[6px] bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground transition-opacity duration-75 hover:opacity-90 disabled:pointer-events-none disabled:opacity-40'
                  >
                    Next step
                  </button>
                </div>
              ) : undefined}
            />
          )
        })}
      </div>
    </div>
  )
}

// ── Wizard Step Header (collapsed, non-active step) ─────────

function WizardStepHeader({
  config,
  stepIndex,
  onClick,
}: {
  config: Configuration
  stepIndex: number
  onClick: () => void
}) {
  const hasSelected = config.items.some((i) => i.active)
  const isRequired = !config.allownone
  const selectedItem = config.items.find((i) => i.active)

  return (
    <button
      type='button'
      className='flex w-full items-center gap-2 border-b border-border px-4 py-2.5 text-left transition-colors duration-75 hover:bg-bg-hover/50'
      onClick={onClick}
    >
      <span className='flex size-5 shrink-0 items-center justify-center rounded-full border border-border text-[10px] font-semibold tabular-nums text-text-tertiary'>
        {stepIndex + 1}
      </span>
      <span className={cn('text-[13px] font-medium', hasSelected ? 'text-foreground' : 'text-text-secondary')}>
        {config.name}
      </span>
      {isRequired && !hasSelected && (
        <span className='text-[11px] font-medium text-destructive'>*</span>
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
      <ChevronRight className='size-3.5 shrink-0 text-text-tertiary' />
    </button>
  )
}

// ── Config Group (collapsible section) ───────────────────────

function ConfigGroup({
  config,
  onSelect,
  onSelectSubConfigItem,
  depth = 0,
  wizardFooter,
}: {
  config: Configuration
  onSelect: (itemId: string) => void
  onSelectSubConfigItem?: (parentItemId: string, subConfigName: string, subItemId: string) => void
  depth?: number
  wizardFooter?: React.ReactNode
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

          {/* Sub-configurations for active CTO items */}
          {config.items
            .filter((item) => item.active && item.subConfigurations?.length)
            .map((item) => (
              <div key={`sub-${item.id}`} className='border-t border-border-light bg-bg-secondary/40 pl-4'>
                {item.subConfigsLoading && (
                  <div className='flex items-center gap-2 px-4 py-2 text-[12px] text-text-tertiary'>
                    <Spinner className='size-3' />
                    Loading sub-configurations…
                  </div>
                )}
                {item.subConfigurations?.map((subConfig) => (
                  <ConfigGroup
                    key={`${item.id}-${subConfig.name}`}
                    config={subConfig}
                    onSelect={(subItemId) =>
                      onSelectSubConfigItem?.(item.id, subConfig.name, subItemId)
                    }
                    depth={depth + 1}
                  />
                ))}
              </div>
            ))}

          {/* Wizard prev/next buttons */}
          {wizardFooter}
        </div>
      )}
    </div>
  )
}
