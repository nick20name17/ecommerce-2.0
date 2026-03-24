import { useQuery } from '@tanstack/react-query'
import { Bookmark, Check, Globe, Lock } from 'lucide-react'

import { getFilterPresetsByEntityQuery } from '@/api/filter-preset/query'
import type { FilterPresetEntityType } from '@/api/filter-preset/schema'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface PresetPickerProps {
  entityType: FilterPresetEntityType
  value: number | null
  onChange: (presetId: number | null) => void
}

export function PresetPicker({ entityType, value, onChange }: PresetPickerProps) {
  const { data: presets } = useQuery(getFilterPresetsByEntityQuery(entityType))

  if (!presets || presets.length === 0) return null

  const activePreset = presets.find((p) => p.id === value)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type='button'
          className={cn(
            'inline-flex h-7 items-center gap-1 rounded-[5px] border px-2 text-[13px] font-medium',
            'transition-colors duration-[80ms] hover:bg-bg-hover',
            value != null
              ? 'border-primary/30 bg-primary/5 text-foreground'
              : 'border-border bg-background text-text-secondary'
          )}
        >
          <Bookmark className='size-3' />
          {activePreset ? activePreset.name : 'Presets'}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className='w-[220px] overflow-hidden rounded-[8px] border-border gap-0 p-1'
        align='start'
        style={{ boxShadow: 'var(--dropdown-shadow)' }}
      >
        {/* Clear option */}
        {value != null && (
          <button
            type='button'
            className={cn(
              'flex w-full items-center gap-2 rounded-[5px] px-2 py-[5px] text-left text-[13px] font-medium',
              'transition-colors duration-[80ms] hover:bg-bg-hover text-text-tertiary'
            )}
            onClick={() => onChange(null)}
          >
            Clear preset
          </button>
        )}

        {presets.map((preset) => {
          const isSelected = value === preset.id
          return (
            <button
              key={preset.id}
              type='button'
              className={cn(
                'flex w-full items-center gap-2 rounded-[5px] px-2 py-[5px] text-left text-[13px] font-medium',
                'transition-colors duration-[80ms] hover:bg-bg-hover'
              )}
              onClick={() => onChange(isSelected ? null : preset.id)}
            >
              <div
                className={cn(
                  'flex size-3.5 items-center justify-center rounded-full border transition-colors duration-[80ms]',
                  isSelected ? 'border-primary bg-primary' : 'border-border'
                )}
              >
                {isSelected && (
                  <Check className='size-2 text-primary-foreground' />
                )}
              </div>
              <span className='min-w-0 flex-1 truncate'>{preset.name}</span>
              {preset.shared ? (
                <Globe className='size-3 shrink-0 text-text-quaternary' />
              ) : (
                <Lock className='size-3 shrink-0 text-text-quaternary' />
              )}
            </button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}
