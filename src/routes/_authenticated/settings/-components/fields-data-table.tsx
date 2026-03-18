'use no memo'

import { Check, Lock, Pencil, Settings } from 'lucide-react'
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
  onEditableToggle: (entity: string, fieldName: string, editable: boolean) => void
  isPending: boolean
  isAliasPending: boolean
  isEditablePending: boolean
  isSuperAdmin: boolean
}

export const FieldsDataTable = ({
  fields,
  isLoading,
  entity,
  onFieldToggle,
  onAliasSubmit,
  onEditableToggle,
  isPending,
  isAliasPending,
  isEditablePending,
  isSuperAdmin
}: FieldsDataTableProps) => {
  if (isLoading) {
    return (
      <div className='space-y-0'>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className='flex items-center gap-4 border-b border-border-light px-6 py-1.5'>
            <div className='w-[200px] shrink-0'>
              <Skeleton className='h-3.5 w-28' />
            </div>
            <div className='min-w-0 flex-1'>
              <Skeleton className='h-6 w-40 rounded-[5px]' />
            </div>
            <div className='flex w-[60px] shrink-0 justify-end'>
              <Skeleton className='h-5 w-9 rounded-full' />
            </div>
            <div className='flex w-[60px] shrink-0 justify-end'>
              <Skeleton className='h-5 w-9 rounded-full' />
            </div>
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
      <div className='sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-bg-secondary/60 px-6 py-1.5 backdrop-blur-sm'>
        <div className='w-[200px] shrink-0 text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary'>
          Field
        </div>
        <div className='min-w-0 flex-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary'>
          Display Name
        </div>
        <div className='w-[60px] shrink-0 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary'>
          Visible
        </div>
        <div className='w-[60px] shrink-0 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary'>
          Editable
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
          onEditableToggle={onEditableToggle}
          isPending={isPending}
          isAliasPending={isAliasPending}
          isEditablePending={isEditablePending}
          isSuperAdmin={isSuperAdmin}
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
  onEditableToggle,
  isPending,
  isAliasPending,
  isEditablePending,
  isSuperAdmin
}: {
  row: FieldConfigRow
  entity: string
  onFieldToggle: (entity: string, fieldName: string, enabled: boolean) => void
  onAliasSubmit: (entity: string, fieldName: string, alias: string) => void
  onEditableToggle: (entity: string, fieldName: string, editable: boolean) => void
  isPending: boolean
  isAliasPending: boolean
  isEditablePending: boolean
  isSuperAdmin: boolean
}) {
  const [aliasValue, setAliasValue] = useState(row.alias ?? '')
  const isDirty = aliasValue !== (row.alias ?? '')
  const isDefault = row.default

  return (
    <div
      className={cn(
        'flex items-center gap-4 border-b border-border-light px-6 py-1.5 transition-colors duration-75',
        !row.enabled && !isDefault && 'opacity-50'
      )}
    >
      {/* Field name */}
      <div className='flex w-[200px] shrink-0 items-center gap-2'>
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
          className='h-6 min-w-0 max-w-[240px] flex-1 rounded-[5px] border border-border bg-background px-2 text-[12px] outline-none transition-colors duration-[80ms] placeholder:text-text-quaternary focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:opacity-50'
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
            className='inline-flex size-6 shrink-0 items-center justify-center rounded-[5px] border border-border bg-bg-secondary text-text-secondary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground disabled:opacity-50'
            disabled={isAliasPending}
            onClick={() => onAliasSubmit(entity, row.field, aliasValue.trim())}
            aria-label='Save alias'
          >
            <Check className='size-3.5' />
          </button>
        )}
      </div>

      {/* Visible toggle */}
      <div className='flex w-[60px] shrink-0 justify-end'>
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

      {/* Editable toggle */}
      <div className='flex w-[60px] shrink-0 justify-end'>
        {isSuperAdmin ? (
          <Switch
            checked={!!row.editable}
            disabled={isEditablePending}
            aria-label={row.editable ? 'Make read-only' : 'Make editable'}
            onCheckedChange={(checked) => onEditableToggle(entity, row.field, checked)}
          />
        ) : row.editable ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className='inline-flex items-center gap-0.5 rounded-[4px] bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary'>
                <Pencil className='size-2.5' />
                Yes
              </span>
            </TooltipTrigger>
            <TooltipContent>This field can be edited</TooltipContent>
          </Tooltip>
        ) : (
          <span className='text-[11px] text-text-quaternary'>—</span>
        )}
      </div>
    </div>
  )
}
