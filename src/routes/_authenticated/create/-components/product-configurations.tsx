import { AlertCircle, Check, ChevronDown, ChevronRight, ImageIcon, RotateCcw, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { ConfigPath } from './product-edit-sheet-reducer'
import type { Configuration, ConfigurationItem } from '@/api/product/schema'
import { Spinner } from '@/components/ui/spinner'
import { formatCurrency } from '@/helpers/formatters'
import { cn } from '@/lib/utils'

interface ProductConfigurationsProps {
  configs: Configuration[]
  activeTab: string
  onActiveTabChange: (tab: string) => void
  onSelectItem: (path: ConfigPath, configName: string, itemId: string) => void
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
  /** Predicate to detect when a config is fully done (active item + nested complete). Used for non-wizard auto-open-next. */
  isConfigComplete?: (config: Configuration | undefined) => boolean
  /** Increments on every user-driven selection or reset. Used to suppress auto-open
   *  on initial render and async-fetch transitions. */
  userInteractionTick?: number
}

export const ProductConfigurations = ({
  configs,
  onSelectItem,
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
  onPrev,
  isConfigComplete,
  userInteractionTick = 0
}: ProductConfigurationsProps) => {
  // Non-wizard top-level expand/collapse state. First config opens by default; Reset
  // closes everything; auto-opens the next when current transitions to complete.
  const firstConfigName = configs[0]?.name
  const [openSet, setOpenSet] = useState<Set<string>>(() =>
    firstConfigName ? new Set([firstConfigName]) : new Set()
  )

  const lastFirstNameRef = useRef<string | undefined>(firstConfigName)
  useEffect(() => {
    if (firstConfigName !== lastFirstNameRef.current) {
      lastFirstNameRef.current = firstConfigName
      setOpenSet(firstConfigName ? new Set([firstConfigName]) : new Set())
    }
  }, [firstConfigName])

  // Reset → collapse everything except the first config (matches initial-load layout).
  // Detected by tick-bump combined with empty selection state.
  const lastResetTickRef = useRef(0)
  useEffect(() => {
    if (userInteractionTick === lastResetTickRef.current) return
    lastResetTickRef.current = userInteractionTick
    const allEmpty = configs.every((c) => !c.items.some((i) => i.active))
    if (allEmpty && userInteractionTick > 0) {
      setOpenSet(firstConfigName ? new Set([firstConfigName]) : new Set())
    }
  }, [userInteractionTick, configs, firstConfigName])

  // Auto-open next on incomplete → complete transition. Always seeds the ref so async fetch
  // settles are captured; only expands once `userInteractionTick > 0` so edit-mode mount with
  // saved selections doesn't pop everything open at once.
  const prevDoneRef = useRef<Map<string, boolean>>(new Map())
  useEffect(() => {
    if (wizardMode || !isConfigComplete) return
    const newOpens: string[] = []
    for (let i = 0; i < configs.length; i++) {
      const c = configs[i]
      const wasDone = prevDoneRef.current.get(c.name) ?? false
      const wasTracked = prevDoneRef.current.has(c.name)
      const isDone = isConfigComplete(c)
      prevDoneRef.current.set(c.name, isDone)
      if (
        userInteractionTick > 0 &&
        wasTracked &&
        isDone &&
        !wasDone &&
        configs[i + 1]
      ) {
        newOpens.push(configs[i + 1].name)
      }
    }
    if (newOpens.length === 0) return
    setOpenSet((prev) => {
      const next = new Set(prev)
      for (const name of newOpens) next.add(name)
      return next
    })
  }, [configs, wizardMode, isConfigComplete, userInteractionTick])

  const toggleOpen = (name: string) =>
    setOpenSet((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* Header */}
      <div className='flex shrink-0 items-center justify-between border-b border-border px-4 py-2'>
        <div className='flex items-center gap-2'>
          <span className='text-[13px] font-semibold'>Components</span>
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
          const stepNumber = String(index + 1)

          return wizardMode && !isActive ? (
            <WizardStepHeader
              key={config.name}
              config={config}
              stepLabel={stepNumber}
              onClick={() => onStepChange?.(config.name)}
            />
          ) : (
            <ConfigGroup
              key={config.name}
              config={config}
              path={[]}
              stepLabel={stepNumber}
              controlledOpen={wizardMode ? undefined : openSet.has(config.name)}
              onToggleOpen={wizardMode ? undefined : () => toggleOpen(config.name)}
              onSelectItem={onSelectItem}
              wizardFooter={
                wizardMode ? (
                  <div className='sticky bottom-0 z-10 flex items-center gap-2 border-t border-border bg-background px-4 py-2.5'>
                    <button
                      type='button'
                      disabled={!canGoPrev}
                      onClick={onPrev}
                      className='flex-1 rounded-full border border-border px-3 py-2 text-[13px] font-medium transition-colors duration-75 hover:bg-bg-hover disabled:pointer-events-none disabled:opacity-40'
                    >
                      Previous step
                    </button>
                    <button
                      type='button'
                      disabled={!canGoNext}
                      onClick={onNext}
                      className='flex-1 rounded-full bg-primary px-3 py-2 text-[13px] font-medium text-primary-foreground transition-opacity duration-75 hover:opacity-90 disabled:pointer-events-none disabled:opacity-40'
                    >
                      Next step
                    </button>
                  </div>
                ) : undefined
              }
            />
          )
        })}
      </div>
    </div>
  )
}

// ── Wizard Step Header (collapsed, non-active step) ─────────

const WizardStepHeader = ({
  config,
  stepLabel,
  onClick
}: {
  config: Configuration
  stepLabel: string
  onClick: () => void
}) => {
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
        {stepLabel}
      </span>
      <span
        className={cn(
          'text-[13px] font-medium',
          hasSelected ? 'text-foreground' : 'text-text-secondary'
        )}
      >
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
          <span className='truncate text-[12px] text-text-tertiary'>{selectedItem?.descr_1}</span>
        </>
      )}
      <div className='flex-1' />
      <ChevronRight className='size-3.5 shrink-0 text-text-tertiary' />
    </button>
  )
}

// ── Config Group (collapsible section with Vue-style card grid) ──────────

const ConfigGroup = ({
  config,
  path,
  stepLabel,
  onSelectItem,
  depth = 0,
  controlledOpen,
  onToggleOpen,
  wizardFooter
}: {
  config: Configuration
  path: ConfigPath
  stepLabel: string
  onSelectItem: (path: ConfigPath, configName: string, itemId: string) => void
  depth?: number
  /** When provided, the open/close state is controlled by parent. Otherwise the group
   *  manages its own state and starts open. */
  controlledOpen?: boolean
  onToggleOpen?: () => void
  wizardFooter?: React.ReactNode
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const isControlled = controlledOpen !== undefined
  const collapsed = isControlled ? !controlledOpen : internalCollapsed
  const handleToggle = () => {
    if (isControlled) onToggleOpen?.()
    else setInternalCollapsed((c) => !c)
  }
  const hasSelected = config.items.some((i) => i.active)
  const isRequired = !config.allownone
  const selectedItem = config.items.find((i) => i.active)
  const isNested = depth > 0

  return (
    <div
      className={cn(
        depth === 0 && 'border-b border-border',
        isNested && 'rounded-[8px] border border-primary/15 bg-background'
      )}
    >
      {/* Group header */}
      <button
        type='button'
        className={cn(
          'flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors duration-75 hover:bg-bg-hover/50'
        )}
        onClick={handleToggle}
      >
        {/* Bullet (filled when selection exists, hollow when empty) */}
        <span
          className={cn(
            'flex size-3.5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
            hasSelected ? 'border-primary bg-primary' : 'border-text-tertiary/50'
          )}
        >
          {hasSelected && <span className='size-1 rounded-full bg-white' />}
        </span>

        {/* Step label */}
        <span
          className={cn(
            'flex shrink-0 items-center justify-center rounded-full border font-semibold tabular-nums',
            isNested
              ? 'h-4 min-w-[28px] border-primary/30 bg-primary/10 px-1 text-[9px] text-primary'
              : 'size-5 border-border text-[10px] text-text-tertiary',
            hasSelected && !isNested && 'border-primary/50 bg-primary/10 text-primary'
          )}
        >
          {stepLabel}
        </span>

        <span
          className={cn(
            'font-semibold',
            isNested ? 'text-[12px] text-text-secondary' : 'text-[13px]'
          )}
        >
          {config.name}
        </span>
        {isRequired && (
          <span
            className={cn(
              'text-[12px] font-medium',
              hasSelected ? 'text-text-tertiary' : 'text-destructive'
            )}
          >
            *
          </span>
        )}
        <div className='flex-1' />

        <ChevronDown
          className={cn(
            'size-3.5 shrink-0 text-text-tertiary transition-transform duration-150',
            collapsed && '-rotate-90'
          )}
        />
      </button>

      {/* Body */}
      {!collapsed && (
        <div>
          {/* If something is selected, show "selected preview" with X to clear */}
          {hasSelected && selectedItem && (
            <SelectedPreview
              item={selectedItem}
              photosLoading={config.photosLoading}
              onClear={() => onSelectItem(path, config.name, selectedItem.id)}
            />
          )}

          {/* Sub-configurations render between the preview and the (now hidden) card grid.
              Render only once data is present — silent fetch for non-CTO items avoids a
              "Loading…" flash on every click. */}
          {hasSelected && selectedItem && !!selectedItem.subConfigurations?.length && (
            <div className='flex flex-col gap-2 border-t border-border-light bg-primary/[0.02] px-4 py-3'>
              {selectedItem.subConfigurations.map((subConfig, subIndex) => (
                <ConfigGroup
                  key={`${selectedItem.id}-${subConfig.name}`}
                  config={subConfig}
                  path={[...path, { configName: config.name, itemId: selectedItem.id }]}
                  stepLabel={`${stepLabel}.${subIndex + 1}`}
                  onSelectItem={onSelectItem}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}

          {/* Card grid: shown when nothing is selected */}
          {!hasSelected && (
            <CardGrid
              items={config.items}
              photosLoading={config.photosLoading}
              onSelect={(itemId) => onSelectItem(path, config.name, itemId)}
            />
          )}

          {/* Wizard prev/next buttons */}
          {wizardFooter}
        </div>
      )}
    </div>
  )
}

// ── Selected Preview Row ────────────────────────────────────

const SelectedPreview = ({
  item,
  photosLoading,
  onClear
}: {
  item: ConfigurationItem
  photosLoading?: boolean
  onClear: () => void
}) => {
  const photo = item.photos?.[0]
  const quanInt = Math.trunc(Number(item.quan))
  const hasQuan = item.quan != null && item.quan !== '' && !Number.isNaN(quanInt) && quanInt > 1
  const price = Number(item.price)
  const totalPrice = price * (hasQuan ? quanInt : 1)

  return (
    <div className='flex items-center gap-3 border-t border-border-light bg-primary/[0.04] px-4 py-2'>
      <div className='flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[6px] border border-primary/30 bg-background'>
        {photosLoading ? (
          <Spinner className='size-3 text-text-tertiary' />
        ) : photo ? (
          <img
            src={photo}
            alt={item.descr_1 || 'Selected option'}
            className='size-full object-contain p-0.5'
            loading='lazy'
          />
        ) : (
          <ImageIcon className='size-4 text-text-tertiary/40' />
        )}
      </div>
      <div className='flex min-w-0 flex-1 flex-col'>
        <span className='truncate text-[13px] font-medium'>{item.descr_1}</span>
        {(price !== 0 || hasQuan) && (
          <span className='text-[11px] tabular-nums text-text-tertiary'>
            +{formatCurrency(totalPrice)}
            {hasQuan && <span className='ml-1'>· {quanInt}× included</span>}
          </span>
        )}
      </div>
      <button
        type='button'
        onClick={(e) => {
          e.stopPropagation()
          onClear()
        }}
        className='inline-flex size-7 shrink-0 items-center justify-center rounded-full text-text-tertiary transition-colors duration-[80ms] hover:bg-bg-hover hover:text-foreground'
        aria-label='Clear selection'
      >
        <X className='size-4' />
      </button>
    </div>
  )
}

// ── Card Grid ───────────────────────────────────────────────

const CardGrid = ({
  items,
  photosLoading,
  onSelect
}: {
  items: ConfigurationItem[]
  photosLoading?: boolean
  onSelect: (itemId: string) => void
}) => (
  <div className='border-t border-border-light p-2.5'>
    <div className='grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
      {items.map((item) => (
        <ConfigCard
          key={item.id}
          item={item}
          photosLoading={photosLoading}
          onClick={() => onSelect(item.id)}
        />
      ))}
    </div>
  </div>
)

// ── Single Card ─────────────────────────────────────────────

const ConfigCard = ({
  item,
  photosLoading,
  onClick
}: {
  item: ConfigurationItem
  photosLoading?: boolean
  onClick: () => void
}) => {
  const photo = item.photos?.[0]
  const quanInt = Math.trunc(Number(item.quan))
  const hasQuan = item.quan != null && item.quan !== '' && !Number.isNaN(quanInt) && quanInt > 1
  const price = Number(item.price)
  const totalPrice = price * (hasQuan ? quanInt : 1)
  const showPrice = price !== 0 || hasQuan

  return (
    <button
      type='button'
      className='group flex flex-col overflow-hidden rounded-[8px] border border-border bg-background text-left transition-all duration-100 hover:border-primary/50 hover:shadow-sm'
      onClick={onClick}
    >
      {/* Photo */}
      <div className='relative flex aspect-square w-full items-center justify-center overflow-hidden bg-bg-secondary/50'>
        {photosLoading ? (
          <Spinner className='size-3.5 text-text-tertiary' />
        ) : photo ? (
          <img
            src={photo}
            alt={item.descr_1 || 'Configuration option'}
            className='size-full object-contain p-1 transition-transform duration-200 group-hover:scale-105'
            loading='lazy'
          />
        ) : (
          <ImageIcon className='size-5 text-text-tertiary/40' />
        )}

        {hasQuan && (
          <span className='absolute bottom-0.5 right-0.5 rounded-[3px] bg-foreground/85 px-1 py-px text-[9px] font-semibold tabular-nums text-white shadow'>
            {quanInt}×
          </span>
        )}
      </div>

      {/* Info */}
      <div className='flex min-h-[36px] flex-col justify-center gap-0.5 px-1.5 py-1'>
        <span className='line-clamp-2 text-[11px] font-medium leading-tight text-foreground'>
          {item.descr_1}
        </span>
        {showPrice && (
          <span className='text-[10px] tabular-nums text-text-tertiary'>
            +{formatCurrency(totalPrice)}
          </span>
        )}
      </div>
    </button>
  )
}
