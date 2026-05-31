import { useCallback, useEffect, useRef } from 'react'

import type { LayoutElement } from '@/api/document-template/schema'
import { cn } from '@/lib/utils'

import { PX_PER_INCH, snapInches } from './designer-types'

interface CanvasElementProps {
  element: LayoutElement
  isSelected: boolean
  onSelect: () => void
  onChange: (next: LayoutElement) => void
  onDelete: () => void
  /** Page width / height in inches — used to clamp positions. */
  pageW: number
  pageH: number
}

type DragMode =
  | { kind: 'move'; startX: number; startY: number; origX: number; origY: number }
  | {
      kind: 'resize'
      handle: ResizeHandle
      startX: number
      startY: number
      orig: { x: number; y: number; w: number; h: number }
    }

type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

const MIN_W = 0.25 // inches
const MIN_H = 0.125

/**
 * A single, draggable + resizable element on the designer canvas.
 *
 * Position/size are in inches; converted to pixels via PX_PER_INCH for layout.
 * All movement is snapped to a 1/8" grid by default.
 */
export function CanvasElement({
  element,
  isSelected,
  onSelect,
  onChange,
  onDelete,
  pageW,
  pageH,
}: CanvasElementProps) {
  const ref = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragMode | null>(null)
  const latestRef = useRef(element)
  latestRef.current = element

  // --- pointer handlers ----------------------------------------------------

  const beginMove = useCallback(
    (e: React.PointerEvent) => {
      // Don't start a move from a resize handle click
      if ((e.target as HTMLElement).dataset.handle) return
      onSelect()
      e.stopPropagation()
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      dragRef.current = {
        kind: 'move',
        startX: e.clientX,
        startY: e.clientY,
        origX: latestRef.current.x,
        origY: latestRef.current.y,
      }
    },
    [onSelect]
  )

  const beginResize = useCallback(
    (handle: ResizeHandle) => (e: React.PointerEvent) => {
      e.stopPropagation()
      onSelect()
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      const el = latestRef.current
      dragRef.current = {
        kind: 'resize',
        handle,
        startX: e.clientX,
        startY: e.clientY,
        orig: { x: el.x, y: el.y, w: el.w, h: el.h },
      }
    },
    [onSelect]
  )

  const handleMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return

      const dxIn = (e.clientX - drag.startX) / PX_PER_INCH
      const dyIn = (e.clientY - drag.startY) / PX_PER_INCH
      const el = latestRef.current

      if (drag.kind === 'move') {
        const nextX = snapInches(
          Math.max(0, Math.min(pageW - el.w, drag.origX + dxIn))
        )
        const nextY = snapInches(
          Math.max(0, Math.min(pageH - el.h, drag.origY + dyIn))
        )
        if (nextX !== el.x || nextY !== el.y) {
          onChange({ ...el, x: nextX, y: nextY })
        }
        return
      }

      // resize
      let { x, y, w, h } = drag.orig
      const h_ = drag.handle
      if (h_.includes('e')) w = drag.orig.w + dxIn
      if (h_.includes('s')) h = drag.orig.h + dyIn
      if (h_.includes('w')) {
        w = drag.orig.w - dxIn
        x = drag.orig.x + dxIn
      }
      if (h_.includes('n')) {
        h = drag.orig.h - dyIn
        y = drag.orig.y + dyIn
      }

      w = Math.max(MIN_W, w)
      h = Math.max(MIN_H, h)
      // keep inside the page
      if (x < 0) {
        w += x
        x = 0
      }
      if (y < 0) {
        h += y
        y = 0
      }
      if (x + w > pageW) w = pageW - x
      if (y + h > pageH) h = pageH - y

      const next = {
        x: snapInches(x),
        y: snapInches(y),
        w: snapInches(w),
        h: snapInches(h),
      }
      if (
        next.x !== el.x ||
        next.y !== el.y ||
        next.w !== el.w ||
        next.h !== el.h
      ) {
        onChange({ ...el, ...next })
      }
    },
    [onChange, pageW, pageH]
  )

  const endDrag = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return
    dragRef.current = null
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      // pointer might already be released
    }
  }, [])

  // Delete with keyboard when selected
  useEffect(() => {
    if (!isSelected) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const target = e.target as HTMLElement | null
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable)
        ) {
          return
        }
        e.preventDefault()
        onDelete()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isSelected, onDelete])

  // --- render --------------------------------------------------------------

  const style: React.CSSProperties = {
    position: 'absolute',
    left: element.x * PX_PER_INCH,
    top: element.y * PX_PER_INCH,
    width: element.w * PX_PER_INCH,
    height: element.h * PX_PER_INCH,
  }

  return (
    <div
      ref={ref}
      style={style}
      onPointerDown={beginMove}
      onPointerMove={handleMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      className={cn(
        'cursor-move select-none transition-shadow duration-[80ms]',
        isSelected
          ? 'outline outline-2 outline-primary'
          : 'outline outline-1 outline-transparent hover:outline-primary/40'
      )}
    >
      <ElementBody element={element} />
      {isSelected && <ResizeHandles onBegin={beginResize} />}
    </div>
  )
}

// ── Element body renderers ──────────────────────────────────

function ElementBody({ element }: { element: LayoutElement }) {
  switch (element.type) {
    case 'text':
      return <TextBody element={element} />
    case 'field':
      return <FieldBody element={element} />
    case 'image':
      return <ImageBody element={element} />
    case 'line':
      return <LineBody element={element} />
    case 'rect':
      return <RectBody element={element} />
    case 'table':
      return <PlaceholderBody label='Table' />
    default:
      return <PlaceholderBody label={element.type} />
  }
}

function TextBody({ element }: { element: LayoutElement }) {
  const p = element.props ?? {}
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        fontSize: ((p.fontSize as number) ?? 12) + 'pt',
        fontWeight: (p.fontWeight as string) ?? 'normal',
        fontStyle: (p.fontStyle as string) ?? 'normal',
        textAlign: (p.textAlign as React.CSSProperties['textAlign']) ?? 'left',
        color: (p.color as string) ?? '#111',
        padding: '2px 4px',
        overflow: 'hidden',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        boxSizing: 'border-box',
        lineHeight: 1.25,
      }}
    >
      {(p.text as string) || 'Text'}
    </div>
  )
}

function FieldBody({ element }: { element: LayoutElement }) {
  const p = element.props ?? {}
  const fieldKey = (p.fieldKey as string) || 'field.key'
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        fontSize: ((p.fontSize as number) ?? 12) + 'pt',
        fontWeight: (p.fontWeight as string) ?? 'normal',
        textAlign: (p.textAlign as React.CSSProperties['textAlign']) ?? 'left',
        color: (p.color as string) ?? '#111',
        padding: '2px 4px',
        overflow: 'hidden',
        boxSizing: 'border-box',
        background:
          'repeating-linear-gradient(45deg, rgba(99,102,241,0.06) 0 6px, transparent 6px 12px)',
        border: '1px dashed rgba(99,102,241,0.4)',
        borderRadius: 3,
      }}
    >
      <code style={{ fontFamily: 'inherit' }}>{`{${fieldKey}}`}</code>
    </div>
  )
}

function ImageBody({ element }: { element: LayoutElement }) {
  const src = (element.props?.src as string) || ''
  if (src) {
    // eslint-disable-next-line jsx-a11y/alt-text
    return (
      <img
        src={src}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    )
  }
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.04)',
        color: 'rgba(0,0,0,0.5)',
        fontSize: 11,
        border: '1px dashed rgba(0,0,0,0.2)',
        boxSizing: 'border-box',
      }}
    >
      Image
    </div>
  )
}

function LineBody({ element }: { element: LayoutElement }) {
  const thickness = (element.props?.thickness as number) ?? 1
  const color = (element.props?.color as string) ?? '#ccc'
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div style={{ width: '100%', height: thickness, background: color }} />
    </div>
  )
}

function RectBody({ element }: { element: LayoutElement }) {
  const p = element.props ?? {}
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: (p.fill as string) ?? '#f4f4f5',
        border: `${(p.borderWidth as number) ?? 0}px solid ${
          (p.borderColor as string) ?? '#e4e4e7'
        }`,
        boxSizing: 'border-box',
      }}
    />
  )
}

function PlaceholderBody({ label }: { label: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(99,102,241,0.08)',
        color: '#6366f1',
        fontSize: 11,
        textTransform: 'capitalize',
      }}
    >
      {label}
    </div>
  )
}

// ── Resize handles ──────────────────────────────────────────

const HANDLES: { key: ResizeHandle; style: React.CSSProperties; cursor: string }[] = [
  { key: 'nw', style: { top: -4, left: -4 }, cursor: 'nwse-resize' },
  { key: 'n', style: { top: -4, left: '50%', transform: 'translateX(-50%)' }, cursor: 'ns-resize' },
  { key: 'ne', style: { top: -4, right: -4 }, cursor: 'nesw-resize' },
  { key: 'e', style: { top: '50%', right: -4, transform: 'translateY(-50%)' }, cursor: 'ew-resize' },
  { key: 'se', style: { bottom: -4, right: -4 }, cursor: 'nwse-resize' },
  { key: 's', style: { bottom: -4, left: '50%', transform: 'translateX(-50%)' }, cursor: 'ns-resize' },
  { key: 'sw', style: { bottom: -4, left: -4 }, cursor: 'nesw-resize' },
  { key: 'w', style: { top: '50%', left: -4, transform: 'translateY(-50%)' }, cursor: 'ew-resize' },
]

function ResizeHandles({
  onBegin,
}: {
  onBegin: (h: ResizeHandle) => (e: React.PointerEvent) => void
}) {
  return (
    <>
      {HANDLES.map((h) => (
        <div
          key={h.key}
          data-handle={h.key}
          onPointerDown={onBegin(h.key)}
          style={{
            position: 'absolute',
            width: 8,
            height: 8,
            background: '#fff',
            border: '2px solid var(--primary, #6366f1)',
            borderRadius: 2,
            cursor: h.cursor,
            zIndex: 10,
            ...h.style,
          }}
        />
      ))}
    </>
  )
}
