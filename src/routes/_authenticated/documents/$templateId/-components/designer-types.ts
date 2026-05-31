/**
 * Shared types and constants for the document designer.
 *
 * The canonical layout shape (kept in sync with the backend) lives in
 * `@/api/document-template/schema`. These helpers are designer-only.
 */

import type { DocumentLayout, LayoutElement } from '@/api/document-template/schema'

/** Pixels per inch in the on-screen canvas. */
export const PX_PER_INCH = 80

/** Page sizes in inches. */
export const PAGE_DIMENSIONS: Record<string, { w: number; h: number }> = {
  letter: { w: 8.5, h: 11 },
  a4: { w: 8.27, h: 11.69 },
  label_4x6: { w: 4, h: 6 },
}

export function pageDims(pageSize: string, orientation: 'portrait' | 'landscape') {
  const d = PAGE_DIMENSIONS[pageSize] ?? PAGE_DIMENSIONS.letter
  return orientation === 'landscape' ? { w: d.h, h: d.w } : d
}

/** Element-type defaults applied when a new element is dropped on the canvas. */
export const ELEMENT_DEFAULTS: Record<
  LayoutElement['type'],
  { w: number; h: number; props: Record<string, unknown> }
> = {
  text: {
    w: 3,
    h: 0.4,
    props: {
      text: 'Text',
      fontSize: 12,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      color: '#111111',
    },
  },
  field: {
    w: 3,
    h: 0.4,
    props: {
      fieldKey: '',
      fontSize: 12,
      fontWeight: 'normal',
      textAlign: 'left',
      color: '#111111',
    },
  },
  image: {
    w: 2,
    h: 1,
    props: { src: '' },
  },
  table: {
    w: 7,
    h: 3,
    props: {
      columns: [
        { fieldKey: 'quan', label: 'Qty', widthPct: 12, align: 'right', format: 'number' },
        { fieldKey: 'descr', label: 'Description', widthPct: 55, align: 'left' },
        { fieldKey: 'unit_price', label: 'Unit Price', widthPct: 16, align: 'right', format: 'currency' },
        { fieldKey: 'amount', label: 'Amount', widthPct: 17, align: 'right', format: 'currency' },
      ],
      itemsSource: 'items',
      showHeader: true,
      headerBackground: '#f4f4f5',
      fontSize: 10,
      striped: false,
      stripeBackground: '#fafafa',
      borderColor: '#e4e4e7',
    },
  },
  line: {
    w: 4,
    h: 0,
    props: { thickness: 1, color: '#cccccc' },
  },
  rect: {
    w: 2,
    h: 1,
    props: { fill: '#f4f4f5', borderColor: '#e4e4e7', borderWidth: 0 },
  },
}

/** Ensure layout has at least one page; return a normalized copy. */
export function ensureLayout(layout: DocumentLayout | undefined): DocumentLayout {
  const pages = layout?.pages && layout.pages.length > 0 ? layout.pages : [{ elements: [] }]
  return { pages }
}

/** Snap a value to the nearest grid step (in inches). */
export function snapInches(value: number, step = 0.125): number {
  if (step <= 0) return value
  return Math.round(value / step) * step
}

/** Browser-safe id generator. */
export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `el_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Resolve a dotted field key against an entity dict.
 *
 * Mirrors the backend's `_resolve_field`:
 * - Drops an `ARINV.` / `ARCUST.` / `ARQT.` etc. prefix (uppercase head)
 * - Splits the remainder on dots; integer parts index into arrays
 * - Looks up case-insensitively (EBMS columns are uppercase upstream but
 *   serializers lowercase them)
 *
 * Returns an empty string for misses.
 */
export function resolveField(
  fieldKey: string | undefined | null,
  entity: unknown
): string {
  const raw = resolveFieldRaw(fieldKey, entity)
  if (raw == null) return ''
  if (typeof raw === 'object') return JSON.stringify(raw)
  return String(raw)
}

/** Same lookup as `resolveField` but returns the raw value (list / dict / scalar). */
export function resolveFieldRaw(
  fieldKey: string | undefined | null,
  entity: unknown
): unknown {
  if (!fieldKey) return null
  let key = fieldKey.trim()
  if (!key) return null

  const dot = key.indexOf('.')
  if (dot >= 0) {
    const head = key.slice(0, dot)
    // Drop EBMS table prefixes like ARINV / ARCUST / ARQT
    if (/^[A-Z][A-Z0-9_]*$/.test(head)) {
      key = key.slice(dot + 1)
    }
  }

  const parts = key.split('.')
  let cur: unknown = entity
  for (const p of parts) {
    if (cur == null) return null
    if (Array.isArray(cur)) {
      const idx = Number(p)
      if (!Number.isInteger(idx) || idx < 0 || idx >= cur.length) return null
      cur = cur[idx]
      continue
    }
    if (typeof cur === 'object') {
      const rec = cur as Record<string, unknown>
      cur = p in rec ? rec[p] : rec[p.toLowerCase()]
      continue
    }
    return null
  }
  return cur ?? null
}

/** Format a resolved cell value for display — mirrors the backend's _format_cell_value. */
export function formatCellValue(value: string, fmt?: string | null): string {
  if (!value) return value
  if (!fmt || fmt === 'string') return value
  const n = Number(value)
  if (!Number.isFinite(n)) return value
  switch (fmt) {
    case 'currency':
      return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    case 'number':
      return Number.isInteger(n)
        ? n.toLocaleString()
        : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    case 'integer':
      return Math.trunc(n).toLocaleString()
    case 'percent':
      return `${(n * 100).toFixed(1)}%`
    default:
      return value
  }
}
