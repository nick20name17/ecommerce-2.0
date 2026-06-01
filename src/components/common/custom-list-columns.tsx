import { ArrowDown, ArrowUp, Check } from 'lucide-react'

import type { FieldConfigEntry, FieldConfigResponse } from '@/api/field-config/schema'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDate } from '@/helpers/formatters'
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

const parseBoolean = (value: unknown): boolean | null => {
  if (value == null) return null
  if (typeof value === 'boolean') return value
  const s = String(value).trim().toLowerCase()
  if (s === '') return null
  if (s === 'true' || s === '1') return true
  if (s === 'false' || s === '0') return false
  return null
}

const isEmpty = (value: unknown): boolean => {
  if (value == null) return true
  return String(value).trim() === ''
}

const formatNumeric = (value: unknown): string => {
  if (value == null || value === '') return '—'
  const n = typeof value === 'number' ? value : parseFloat(String(value))
  if (Number.isNaN(n)) return String(value)
  // Two decimals for floats, none for integers.
  const isInt = Number.isInteger(n)
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: isInt ? 0 : 2,
    maximumFractionDigits: isInt ? 0 : 2
  }).format(n)
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
        return (
          <div
            key={col.field}
            className='w-[140px] shrink-0 truncate text-[13px]'
          >
            <CellValue value={raw} type={col.type} />
          </div>
        )
      })}
    </>
  )
}

const EmDash = () => <span className='text-text-tertiary'>—</span>

function CellValue({ value, type }: { value: unknown; type?: string }) {
  if (type === 'boolean') {
    const bool = parseBoolean(value)
    if (bool === true) {
      return (
        <span
          className='inline-flex h-[18px] items-center gap-1 rounded-[4px] bg-emerald-500/10 px-1.5 text-[11px] font-medium text-emerald-600'
          title='true'
        >
          <Check className='size-3' />
          Yes
        </span>
      )
    }
    if (bool === false) {
      // Treat false as a non-event for boolean flags — most rows are
      // "not X", showing every one as "false" is noisy.
      return <EmDash />
    }
    return <EmDash />
  }

  if (isEmpty(value)) return <EmDash />

  if (type === 'date') {
    const formatted = formatDate(value as string)
    return (
      <span className='block truncate text-text-secondary tabular-nums'>{formatted}</span>
    )
  }

  if (type === 'integer' || type === 'number') {
    const formatted = formatNumeric(value)
    return (
      <span className='block truncate text-right text-text-secondary tabular-nums'>
        {formatted}
      </span>
    )
  }

  const display = String(value).trim()
  const truncated = display.length > CELL_TRUNCATE
  const shown = truncated ? `${display.slice(0, CELL_TRUNCATE)}…` : display
  if (truncated) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className='block truncate text-text-secondary'>{shown}</span>
        </TooltipTrigger>
        <TooltipContent>{display}</TooltipContent>
      </Tooltip>
    )
  }
  return <span className='block truncate text-text-secondary'>{shown}</span>
}
