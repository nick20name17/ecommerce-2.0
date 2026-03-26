import { Check, Loader2, X } from 'lucide-react'
import { useRef, useState } from 'react'

import { cn } from '@/lib/utils'

// ── Panel Section ────────────────────────────────────────────

export function PanelSection({
  title,
  children,
  last,
}: {
  title: string
  children: React.ReactNode
  last?: boolean
}) {
  return (
    <div className={cn(!last && 'border-b border-border')}>
      <div className='bg-bg-secondary/60 px-4 py-2'>
        <span className='text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary'>
          {title}
        </span>
      </div>
      <div className='bg-background text-[13px]'>{children}</div>
    </div>
  )
}

// ── Panel Row (read-only) ────────────────────────────────────

export function PanelRow({
  label,
  children,
  last,
}: {
  label: string
  children: React.ReactNode
  last?: boolean
}) {
  return (
    <div className={cn('flex items-center justify-between gap-4 px-4 py-2.5', !last && 'border-b border-border-light')}>
      <span className='shrink-0 text-[12px] font-medium text-text-tertiary'>{label}</span>
      <div className='min-w-0 truncate text-right text-[13px] font-medium text-foreground'>{children}</div>
    </div>
  )
}

// ── Panel Block (full-width content like address/notes) ──────

export function PanelBlock({
  children,
  last,
}: {
  children: React.ReactNode
  last?: boolean
}) {
  return (
    <div className={cn('px-4 py-2.5', !last && 'border-b border-border-light')}>
      {children}
    </div>
  )
}

// ── Boolean value detection ──────────────────────────────────

const BOOLEAN_VALUES = new Set(['true', 'false', 'yes', 'no', '0', '1'])

function isBooleanLike(value: string | null | undefined): boolean {
  if (!value) return false
  return BOOLEAN_VALUES.has(value.toLowerCase().trim())
}

function getBooleanDisplay(value: string): string {
  const v = value.toLowerCase().trim()
  if (v === 'true' || v === 'yes' || v === '1') return 'true'
  return 'false'
}

function toggleBooleanValue(value: string): string {
  const v = value.toLowerCase().trim()
  // Preserve the original format
  if (v === 'true') return 'false'
  if (v === 'false') return 'true'
  if (v === 'yes') return 'no'
  if (v === 'no') return 'yes'
  if (v === '1') return '0'
  if (v === '0') return '1'
  return value
}

// ── Property Field (editable, horizontal row) ────────────────

export function PropertyField({
  label,
  value,
  field,
  onSave,
  multiline,
  editable = true,
  saving = false,
}: {
  label: string
  value: string | null | undefined
  field: string
  onSave: (field: string, value: string) => void
  multiline?: boolean
  editable?: boolean
  saving?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const displayValue = value ?? ''
  const isBool = isBooleanLike(displayValue)

  const startEditing = () => {
    if (!editable) return
    // For boolean fields, toggle directly instead of opening editor
    if (isBool) {
      const newValue = toggleBooleanValue(displayValue)
      onSave(field, newValue)
      return
    }
    setDraft(displayValue)
    setEditing(true)
  }

  const commit = () => {
    setEditing(false)
    onSave(field, draft.trim())
  }

  const cancel = () => {
    setEditing(false)
  }

  const isDirty = draft.trim() !== displayValue

  const actionButtons = (
    <div className='flex shrink-0 items-center gap-0.5'>
      <button
        type='button'
        className={cn(
          'inline-flex size-5 items-center justify-center rounded transition-colors duration-75',
          isDirty
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'text-text-tertiary hover:bg-bg-hover',
        )}
        onMouseDown={(e) => {
          e.preventDefault()
          commit()
        }}
      >
        <Check className='size-3' />
      </button>
      <button
        type='button'
        className='inline-flex size-5 items-center justify-center rounded text-text-tertiary transition-colors duration-75 hover:bg-bg-hover hover:text-foreground'
        onMouseDown={(e) => {
          e.preventDefault()
          cancel()
        }}
      >
        <X className='size-3' />
      </button>
    </div>
  )

  // Editing — multiline (full-width block)
  if (editing && multiline) {
    return (
      <div ref={containerRef} className='border-b border-border-light px-4 py-2.5'>
        <div className='mb-1 flex items-center justify-between'>
          <span className='text-[12px] font-medium text-text-tertiary'>{label}</span>
          {actionButtons}
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') cancel()
          }}
          autoFocus
          rows={3}
          className='w-full resize-none rounded border border-border bg-background px-2 py-1 text-[13px] text-foreground shadow-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20'
        />
      </div>
    )
  }

  // Editing — single-line (inline row)
  if (editing) {
    return (
      <div ref={containerRef} className='flex items-center gap-2 border-b border-border-light px-4 py-2'>
        <span className='shrink-0 text-[12px] font-medium text-text-tertiary'>{label}</span>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') cancel()
          }}
          autoFocus
          className='min-w-0 flex-1 rounded border border-border bg-background px-2 py-0.5 text-right text-[13px] text-foreground shadow-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20'
        />
        {actionButtons}
      </div>
    )
  }

  // Read mode — boolean toggle
  if (isBool && editable) {
    const isTrue = getBooleanDisplay(displayValue) === 'true'
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-4 border-b border-border-light px-4 py-2.5 transition-colors duration-75',
          saving ? 'pointer-events-none opacity-70' : 'cursor-pointer hover:bg-bg-hover/50',
        )}
        onClick={startEditing}
      >
        <span className='shrink-0 text-[12px] font-medium text-text-tertiary'>{label}</span>
        <div className='flex items-center gap-1.5'>
          {saving && <Loader2 className='size-3 animate-spin text-text-tertiary' />}
          <span className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none',
            isTrue
              ? 'border border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
              : 'border border-border bg-bg-secondary text-text-tertiary',
          )}>
            {displayValue}
          </span>
        </div>
      </div>
    )
  }

  // Read mode — multiline (full-width block)
  if (multiline) {
    return (
      <div
        className={cn(
          'border-b border-border-light px-4 py-2.5 transition-colors duration-75',
          saving ? 'pointer-events-none opacity-70' : editable && 'cursor-pointer hover:bg-bg-hover/50',
        )}
        onClick={startEditing}
      >
        <div className='mb-0.5 flex items-center gap-1.5'>
          <span className='text-[12px] font-medium text-text-tertiary'>{label}</span>
          {saving && <Loader2 className='size-3 animate-spin text-text-tertiary' />}
        </div>
        <span
          className={cn(
            'block whitespace-pre-line text-[13px]',
            displayValue ? 'font-medium text-foreground' : 'text-text-quaternary',
          )}
        >
          {displayValue || '—'}
        </span>
      </div>
    )
  }

  // Read mode — horizontal row
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 border-b border-border-light px-4 py-2.5 transition-colors duration-75',
        saving ? 'pointer-events-none opacity-70' : editable && 'cursor-pointer hover:bg-bg-hover/50',
      )}
      onClick={startEditing}
    >
      <span className='shrink-0 text-[12px] font-medium text-text-tertiary'>{label}</span>
      <div className='flex items-center gap-1.5'>
        {saving && <Loader2 className='size-3 animate-spin text-text-tertiary' />}
        <span
          className={cn(
            'truncate text-[13px]',
            displayValue ? 'font-medium text-foreground' : 'text-text-quaternary',
          )}
        >
          {displayValue || '—'}
        </span>
      </div>
    </div>
  )
}

// ── Summary Cell ─────────────────────────────────────────────

export function SummaryCell({
  label,
  value,
  bold,
  accent,
}: {
  label: string
  value: string
  bold?: boolean
  accent?: 'warning' | 'success'
}) {
  return (
    <div className='flex items-center gap-1'>
      <span className='text-[12px] text-text-tertiary'>{label}:</span>
      <span
        className={cn(
          'text-[12px] tabular-nums',
          bold ? 'font-semibold text-foreground' : 'font-medium text-text-secondary',
          accent === 'warning' && 'font-semibold text-amber-600 dark:text-amber-400',
          accent === 'success' && 'font-semibold text-emerald-600 dark:text-emerald-400',
        )}
      >
        {value}
      </span>
    </div>
  )
}
