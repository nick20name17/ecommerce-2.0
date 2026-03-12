'use no memo'

import { Check, Lock, Settings } from 'lucide-react'
import { useState } from 'react'

import type { FieldConfigRow } from '@/api/field-config/schema'
import { PageEmpty } from '@/components/common/page-empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export interface FieldsDataTableProps {
  fields: FieldConfigRow[]
  isLoading: boolean
  entity: string
  projectId: number
  onFieldToggle: (entity: string, fieldName: string, enabled: boolean) => void
  onAliasSubmit: (entity: string, fieldName: string, alias: string) => void
  isPending: boolean
  isAliasPending: boolean
}

export const FieldsDataTable = ({
  fields,
  isLoading,
  entity,
  onFieldToggle,
  onAliasSubmit,
  isPending,
  isAliasPending
}: FieldsDataTableProps) => {
  if (isLoading) {
    return (
      <div className='space-y-0'>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className='flex items-center gap-4 border-b border-border-light px-1 py-2.5'>
            <Skeleton className='h-4 w-40' />
            <Skeleton className='h-7 w-48' />
            <Skeleton className='h-5 w-10 rounded-full' />
          </div>
        ))}
      </div>
    )
  }

  if (fields.length === 0) {
    return (
      <PageEmpty icon={Settings} title='No fields configured' description='No fields are configured for this entity.' compact />
    )
  }

  return (
    <div>
      {/* Table header */}
      <div className='flex items-center gap-4 border-b border-border pb-2'>
        <div className='w-[220px] shrink-0 text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary'>
          Field
        </div>
        <div className='min-w-0 flex-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary'>
          Display Alias
        </div>
        <div className='w-[80px] shrink-0 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary'>
          Visible
        </div>
      </div>

      {/* Rows */}
      {fields.map((row) => (
        <FieldRow
          key={row.field}
          row={row}
          entity={entity}
          onFieldToggle={onFieldToggle}
          onAliasSubmit={onAliasSubmit}
          isPending={isPending}
          isAliasPending={isAliasPending}
        />
      ))}
    </div>
  )
}

// ── Single field row ────────────────────────────────────────

function FieldRow({
  row,
  entity,
  onFieldToggle,
  onAliasSubmit,
  isPending,
  isAliasPending
}: {
  row: FieldConfigRow
  entity: string
  onFieldToggle: (entity: string, fieldName: string, enabled: boolean) => void
  onAliasSubmit: (entity: string, fieldName: string, alias: string) => void
  isPending: boolean
  isAliasPending: boolean
}) {
  const [aliasValue, setAliasValue] = useState(row.alias ?? '')
  const isDirty = aliasValue !== (row.alias ?? '')
  const isDefault = row.default

  return (
    <div
      className={cn(
        'flex items-center gap-4 border-b border-border-light py-2 transition-colors duration-75',
        !row.enabled && !isDefault && 'opacity-50'
      )}
    >
      {/* Field name */}
      <div className='flex w-[220px] shrink-0 items-center gap-2'>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className='block truncate text-[13px] font-medium text-foreground'>
              {row.field}
            </span>
          </TooltipTrigger>
          <TooltipContent>{row.field}</TooltipContent>
        </Tooltip>
        {isDefault && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className='inline-flex items-center gap-0.5 rounded-[4px] border border-border bg-bg-secondary px-1 py-px text-[10px] font-medium text-text-tertiary'>
                <Lock className='size-2.5' />
                Default
              </span>
            </TooltipTrigger>
            <TooltipContent>Default field — always visible</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Alias input */}
      <div className='flex min-w-0 flex-1 items-center gap-1.5'>
        <input
          value={aliasValue}
          onChange={(e) => setAliasValue(e.target.value)}
          placeholder='Display name…'
          disabled={isAliasPending}
          className='h-7 min-w-0 flex-1 rounded-[6px] border border-border bg-background px-2.5 text-[13px] outline-none transition-colors duration-[80ms] placeholder:text-text-quaternary focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:opacity-50'
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (isDirty) onAliasSubmit(entity, row.field, aliasValue.trim())
            }
          }}
        />
        {isDirty && (
          <button
            type='button'
            className='inline-flex size-7 shrink-0 items-center justify-center rounded-[5px] border border-border bg-bg-secondary text-text-secondary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground disabled:opacity-50'
            disabled={isAliasPending}
            onClick={() => onAliasSubmit(entity, row.field, aliasValue.trim())}
            aria-label='Save alias'
          >
            <Check className='size-3.5' />
          </button>
        )}
      </div>

      {/* Toggle */}
      <div className='flex w-[80px] shrink-0 justify-end'>
        {isDefault ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className='inline-flex'>
                <Switch checked disabled aria-label='Default field, always enabled' />
              </span>
            </TooltipTrigger>
            <TooltipContent>Default field — always visible</TooltipContent>
          </Tooltip>
        ) : (
          <Switch
            checked={row.enabled}
            disabled={isPending}
            aria-label={row.enabled ? 'Disable field' : 'Enable field'}
            onCheckedChange={(checked) => onFieldToggle(entity, row.field, checked)}
          />
        )}
      </div>
    </div>
  )
}
