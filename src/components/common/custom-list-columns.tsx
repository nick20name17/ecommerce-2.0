import { ArrowDown, ArrowUp } from 'lucide-react'

import type { FieldConfigEntry, FieldConfigResponse } from '@/api/field-config/schema'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/**
 * Reusable header + body cells for the per-project custom columns that
 * Settings → Data Control exposes via the `Header` toggle (i.e.
 * `Project.list_columns[entity]`). Plugs into the existing hand-rolled
 * Customers / Orders / Proposals list views without rewriting their
 * column layout — appended to the right of the fixed columns.
 */

export interface CustomColumn {
  field: string
  label: string
  /** Normalized type from the field-config response (string/boolean/...) */
  type?: string
}

export const buildCustomColumns = (
  fieldConfig: FieldConfigResponse | null | undefined,
  entity: string,
  fixedFields: ReadonlySet<string>
): CustomColumn[] => {
  const ordered = fieldConfig?._list_columns?.[entity] ?? []
  const entries = fieldConfig?.[entity] ?? []
  const byField = new Map<string, FieldConfigEntry>()
  for (const e of entries) byField.set(e.field, e)

  return ordered
    .filter((field) => !fixedFields.has(field))
    .map((field) => {
      const entry = byField.get(field)
      const alias = entry?.alias?.trim()
      return {
        field,
        label: alias && alias.length > 0 ? alias : humanize(field),
        type: entry?.type
      }
    })
}

const humanize = (key: string) =>
  key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

/** Returns a comma-separated list of fields, or undefined when empty. */
export const customFieldsParam = (columns: CustomColumn[]): string | undefined => {
  if (columns.length === 0) return undefined
  return columns.map((c) => c.field).join(',')
}

const CELL_TRUNCATE = 40

export const formatCellDisplay = (value: unknown, type?: string): string => {
  if (value == null) return '—'
  if (type === 'boolean') {
    if (typeof value === 'boolean') return value ? 'true' : 'false'
    const s = String(value).toLowerCase()
    if (s === 'true' || s === '1') return 'true'
    if (s === 'false' || s === '0' || s === '') return 'false'
  }
  const str = String(value).trim()
  if (str === '') return '—'
  return str
}

export const CustomColumnsHeader = ({
  columns,
  sortField,
  sortDir,
  onSort,
  className
}: {
  columns: CustomColumn[]
  sortField: string | null
  sortDir: 'asc' | 'desc'
  onSort: (field: string) => void
  className?: string
}) => {
  if (columns.length === 0) return null
  return (
    <>
      {columns.map((col) => {
        const active = sortField === col.field
        return (
          <button
            key={col.field}
            type='button'
            className={cn(
              'group inline-flex w-[140px] shrink-0 items-center gap-1 truncate text-left transition-colors duration-[80ms] hover:text-foreground',
              active && 'text-foreground',
              className
            )}
            onClick={() => onSort(col.field)}
            title={col.label}
          >
            <span className='truncate'>{col.label}</span>
            {active ? (
              sortDir === 'asc' ? (
                <ArrowUp className='size-3 shrink-0' />
              ) : (
                <ArrowDown className='size-3 shrink-0' />
              )
            ) : (
              <ArrowUp className='size-3 shrink-0 opacity-30 transition-opacity group-hover:opacity-60' />
            )}
          </button>
        )
      })}
    </>
  )
}

export const CustomColumnsCells = ({
  row,
  columns
}: {
  row: Record<string, unknown>
  columns: CustomColumn[]
}) => {
  if (columns.length === 0) return null
  return (
    <>
      {columns.map((col) => {
        const raw = row[col.field]
        const display = formatCellDisplay(raw, col.type)
        const isEmpty = display === '—'
        const truncated = display.length > CELL_TRUNCATE
        const shown = truncated ? `${display.slice(0, CELL_TRUNCATE)}…` : display
        return (
          <div
            key={col.field}
            className={cn(
              'w-[140px] shrink-0 truncate text-[13px]',
              isEmpty ? 'text-text-tertiary' : 'text-text-secondary'
            )}
          >
            {truncated ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className='block truncate'>{shown}</span>
                </TooltipTrigger>
                <TooltipContent>{display}</TooltipContent>
              </Tooltip>
            ) : (
              <span className='block truncate'>{shown}</span>
            )}
          </div>
        )
      })}
    </>
  )
}
