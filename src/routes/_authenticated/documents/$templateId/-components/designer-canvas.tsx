import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Image as ImageIcon,
  Italic,
  Minus,
  Square,
  Table as TableIcon,
  Type,
  X,
} from 'lucide-react'
import { useCallback, useState } from 'react'

import type {
  DocumentLayout,
  ElementType,
  LayoutElement,
} from '@/api/document-template/schema'
import { cn } from '@/lib/utils'

import { CanvasElement } from './canvas-element'
import {
  ELEMENT_DEFAULTS,
  PX_PER_INCH,
  ensureLayout,
  newId,
  pageDims,
  snapInches,
} from './designer-types'

interface DesignerCanvasProps {
  layout: DocumentLayout
  onChange: (next: DocumentLayout) => void
  pageSize: string
  orientation: 'portrait' | 'landscape'
  pageMargins?: { top?: number; right?: number; bottom?: number; left?: number }
}

// ── Palette tools ───────────────────────────────────────────

const TOOLS: { type: ElementType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { type: 'text', label: 'Text', icon: Type },
  { type: 'field', label: 'Field', icon: Square },
  { type: 'image', label: 'Image', icon: ImageIcon },
  { type: 'table', label: 'Table', icon: TableIcon },
  { type: 'line', label: 'Line', icon: Minus },
  { type: 'rect', label: 'Rectangle', icon: Square },
]

// ── Component ───────────────────────────────────────────────

export function DesignerCanvas({
  layout,
  onChange,
  pageSize,
  orientation,
  pageMargins,
}: DesignerCanvasProps) {
  const normalized = ensureLayout(layout)
  const dims = pageDims(pageSize, orientation)

  // Single-page MVP: only the first page is rendered. Multi-page lands later.
  const elements = normalized.pages?.[0]?.elements ?? []

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const updatePage = useCallback(
    (next: LayoutElement[]) => {
      const nextPages = [...(normalized.pages ?? [])]
      nextPages[0] = { ...(nextPages[0] ?? { elements: [] }), elements: next }
      onChange({ pages: nextPages })
    },
    [normalized.pages, onChange]
  )

  const updateElement = useCallback(
    (id: string, patch: Partial<LayoutElement>) => {
      updatePage(
        elements.map((el) => (el.id === id ? { ...el, ...patch } : el))
      )
    },
    [elements, updatePage]
  )

  const replaceElement = useCallback(
    (next: LayoutElement) => {
      updatePage(elements.map((el) => (el.id === next.id ? next : el)))
    },
    [elements, updatePage]
  )

  const deleteElement = useCallback(
    (id: string) => {
      updatePage(elements.filter((el) => el.id !== id))
      if (selectedId === id) setSelectedId(null)
    },
    [elements, updatePage, selectedId]
  )

  const addElement = useCallback(
    (type: ElementType, dropX: number, dropY: number) => {
      const defaults = ELEMENT_DEFAULTS[type]
      const id = newId()
      const xClamped = snapInches(
        Math.max(0, Math.min(dims.w - defaults.w, dropX - defaults.w / 2))
      )
      const yClamped = snapInches(
        Math.max(0, Math.min(dims.h - defaults.h, dropY - defaults.h / 2))
      )
      const newElement: LayoutElement = {
        id,
        type,
        x: xClamped,
        y: yClamped,
        w: defaults.w,
        h: defaults.h,
        props: { ...defaults.props },
      }
      updatePage([...elements, newElement])
      setSelectedId(id)
    },
    [dims, elements, updatePage]
  )

  // --- canvas drop target -------------------------------------------------

  const handleCanvasDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/x-doc-element')) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }
  }

  const handleCanvasDrop = (e: React.DragEvent) => {
    const type = e.dataTransfer.getData('application/x-doc-element') as ElementType
    if (!type) return
    e.preventDefault()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = (e.clientX - rect.left) / PX_PER_INCH
    const y = (e.clientY - rect.top) / PX_PER_INCH
    addElement(type, x, y)
  }

  // --- render --------------------------------------------------------------

  const selected = elements.find((el) => el.id === selectedId) ?? null
  const marginTop = (pageMargins?.top ?? 0) * PX_PER_INCH
  const marginRight = (pageMargins?.right ?? 0) * PX_PER_INCH
  const marginBottom = (pageMargins?.bottom ?? 0) * PX_PER_INCH
  const marginLeft = (pageMargins?.left ?? 0) * PX_PER_INCH

  return (
    <div className='flex min-h-0 flex-1 overflow-hidden bg-bg-secondary/20'>
      {/* Palette */}
      <aside className='hidden w-[64px] shrink-0 flex-col gap-1 overflow-y-auto border-r border-border bg-bg-secondary/40 py-2 md:flex'>
        {TOOLS.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.type}
              type='button'
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'copy'
                e.dataTransfer.setData('application/x-doc-element', t.type)
              }}
              className='mx-2 flex flex-col items-center gap-1 rounded-[6px] border border-transparent px-1.5 py-2 text-[10px] font-medium text-text-secondary transition-colors duration-[80ms] hover:border-border hover:bg-bg-active hover:text-foreground active:opacity-70'
              title={`Drag onto canvas: ${t.label}`}
            >
              <Icon className='size-4' />
              <span>{t.label}</span>
            </button>
          )
        })}
      </aside>

      {/* Canvas scroll area */}
      <div
        className='flex min-h-0 flex-1 items-start justify-center overflow-auto p-6'
        onClick={() => setSelectedId(null)}
      >
        <div
          className='relative shrink-0 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04]'
          style={{
            width: dims.w * PX_PER_INCH,
            height: dims.h * PX_PER_INCH,
          }}
          onDragOver={handleCanvasDragOver}
          onDrop={handleCanvasDrop}
          onClick={(e) => {
            e.stopPropagation()
            setSelectedId(null)
          }}
        >
          {/* Margin guide lines (visual only) */}
          {(marginTop || marginRight || marginBottom || marginLeft) && (
            <div
              style={{
                position: 'absolute',
                top: marginTop,
                left: marginLeft,
                right: marginRight,
                bottom: marginBottom,
                border: '1px dashed rgba(99,102,241,0.35)',
                pointerEvents: 'none',
              }}
            />
          )}

          {elements.length === 0 && (
            <div className='pointer-events-none absolute inset-0 flex items-center justify-center text-center'>
              <span className='text-[12px] text-text-tertiary'>
                Drag elements from the left to start building
              </span>
            </div>
          )}

          {elements.map((el) => (
            <CanvasElement
              key={el.id}
              element={el}
              isSelected={selectedId === el.id}
              onSelect={() => setSelectedId(el.id)}
              onChange={replaceElement}
              onDelete={() => deleteElement(el.id)}
              pageW={dims.w}
              pageH={dims.h}
            />
          ))}
        </div>
      </div>

      {/* Properties panel */}
      <aside className='hidden w-[260px] shrink-0 flex-col overflow-y-auto border-l border-border bg-bg-secondary/40 md:flex'>
        {selected ? (
          <PropertiesPanel
            element={selected}
            onPatch={(patch) => updateElement(selected.id, patch)}
            onDelete={() => deleteElement(selected.id)}
            pageDims={dims}
          />
        ) : (
          <div className='px-4 py-6 text-[12px] leading-snug text-text-tertiary'>
            Select an element to edit its properties, or drag a tool from the
            palette to add a new one.
          </div>
        )}
      </aside>
    </div>
  )
}

// ── Properties panel ────────────────────────────────────────

function PropertiesPanel({
  element,
  onPatch,
  onDelete,
  pageDims,
}: {
  element: LayoutElement
  onPatch: (patch: Partial<LayoutElement>) => void
  onDelete: () => void
  pageDims: { w: number; h: number }
}) {
  const patchProps = (kv: Record<string, unknown>) =>
    onPatch({ props: { ...(element.props ?? {}), ...kv } })

  return (
    <div className='flex flex-col'>
      {/* Header */}
      <div className='flex items-center justify-between gap-2 border-b border-border px-3 py-2'>
        <span className='text-[11px] font-semibold uppercase tracking-wider text-text-tertiary'>
          {element.type} element
        </span>
        <button
          type='button'
          onClick={onDelete}
          className='inline-flex size-6 items-center justify-center rounded-[5px] text-text-tertiary transition-colors hover:bg-bg-hover hover:text-destructive'
          title='Delete (Del)'
        >
          <X className='size-3.5' />
        </button>
      </div>

      {/* Position & size */}
      <Section title='Position & size'>
        <Grid2>
          <NumberInput
            label='X'
            value={element.x}
            min={0}
            max={pageDims.w - element.w}
            step={0.125}
            suffix='in'
            onChange={(v) => onPatch({ x: snapInches(v) })}
          />
          <NumberInput
            label='Y'
            value={element.y}
            min={0}
            max={pageDims.h - element.h}
            step={0.125}
            suffix='in'
            onChange={(v) => onPatch({ y: snapInches(v) })}
          />
          <NumberInput
            label='W'
            value={element.w}
            min={0.25}
            max={pageDims.w - element.x}
            step={0.125}
            suffix='in'
            onChange={(v) => onPatch({ w: snapInches(v) })}
          />
          <NumberInput
            label='H'
            value={element.h}
            min={0.125}
            max={pageDims.h - element.y}
            step={0.125}
            suffix='in'
            onChange={(v) => onPatch({ h: snapInches(v) })}
          />
        </Grid2>
      </Section>

      {/* Type-specific props */}
      {element.type === 'text' && (
        <TextProps element={element} patchProps={patchProps} />
      )}
      {element.type === 'field' && (
        <FieldProps element={element} patchProps={patchProps} />
      )}
      {element.type === 'image' && (
        <ImageProps element={element} patchProps={patchProps} />
      )}
      {element.type === 'line' && (
        <LineProps element={element} patchProps={patchProps} />
      )}
      {element.type === 'rect' && (
        <RectProps element={element} patchProps={patchProps} />
      )}
    </div>
  )
}

// ── Type-specific property panels ───────────────────────────

function TextProps({
  element,
  patchProps,
}: {
  element: LayoutElement
  patchProps: (kv: Record<string, unknown>) => void
}) {
  const p = element.props ?? {}
  return (
    <Section title='Text'>
      <textarea
        value={(p.text as string) ?? ''}
        onChange={(e) => patchProps({ text: e.target.value })}
        rows={3}
        className='w-full resize-y rounded-[5px] border border-border bg-background px-2 py-1 text-[12.5px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
      />
      <Grid2>
        <NumberInput
          label='Size'
          value={(p.fontSize as number) ?? 12}
          min={6}
          max={120}
          step={1}
          suffix='pt'
          onChange={(v) => patchProps({ fontSize: v })}
        />
        <ColorInput
          label='Color'
          value={(p.color as string) ?? '#111111'}
          onChange={(v) => patchProps({ color: v })}
        />
      </Grid2>
      <ToggleRow
        options={[
          { value: 'left', icon: AlignLeft, label: 'Left' },
          { value: 'center', icon: AlignCenter, label: 'Center' },
          { value: 'right', icon: AlignRight, label: 'Right' },
        ]}
        value={(p.textAlign as string) ?? 'left'}
        onChange={(v) => patchProps({ textAlign: v })}
      />
      <ToggleRow
        options={[
          { value: 'normal', icon: Type, label: 'Regular' },
          { value: 'bold', icon: Bold, label: 'Bold' },
        ]}
        value={(p.fontWeight as string) ?? 'normal'}
        onChange={(v) => patchProps({ fontWeight: v })}
      />
      <ToggleRow
        options={[
          { value: 'normal', icon: Type, label: 'Upright' },
          { value: 'italic', icon: Italic, label: 'Italic' },
        ]}
        value={(p.fontStyle as string) ?? 'normal'}
        onChange={(v) => patchProps({ fontStyle: v })}
      />
    </Section>
  )
}

function FieldProps({
  element,
  patchProps,
}: {
  element: LayoutElement
  patchProps: (kv: Record<string, unknown>) => void
}) {
  const p = element.props ?? {}
  return (
    <Section title='Field binding'>
      <p className='text-[11px] leading-snug text-text-tertiary'>
        Bound field placeholder — typed binding lands once the field schema
        endpoint is wired. For now, use any EBMS column key
        (e.g. <code>ARINV.INVOICE</code>).
      </p>
      <input
        type='text'
        value={(p.fieldKey as string) ?? ''}
        onChange={(e) => patchProps({ fieldKey: e.target.value })}
        placeholder='ARINV.INVOICE'
        className='h-8 w-full rounded-[5px] border border-border bg-background px-2 font-mono text-[12px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
      />
      <Grid2>
        <NumberInput
          label='Size'
          value={(p.fontSize as number) ?? 12}
          min={6}
          max={120}
          step={1}
          suffix='pt'
          onChange={(v) => patchProps({ fontSize: v })}
        />
        <ColorInput
          label='Color'
          value={(p.color as string) ?? '#111111'}
          onChange={(v) => patchProps({ color: v })}
        />
      </Grid2>
    </Section>
  )
}

function ImageProps({
  element,
  patchProps,
}: {
  element: LayoutElement
  patchProps: (kv: Record<string, unknown>) => void
}) {
  const p = element.props ?? {}
  return (
    <Section title='Image'>
      <input
        type='url'
        value={(p.src as string) ?? ''}
        onChange={(e) => patchProps({ src: e.target.value })}
        placeholder='https://…/logo.png'
        className='h-8 w-full rounded-[5px] border border-border bg-background px-2 text-[12.5px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
      />
    </Section>
  )
}

function LineProps({
  element,
  patchProps,
}: {
  element: LayoutElement
  patchProps: (kv: Record<string, unknown>) => void
}) {
  const p = element.props ?? {}
  return (
    <Section title='Line'>
      <Grid2>
        <NumberInput
          label='Thickness'
          value={(p.thickness as number) ?? 1}
          min={0.5}
          max={20}
          step={0.5}
          suffix='px'
          onChange={(v) => patchProps({ thickness: v })}
        />
        <ColorInput
          label='Color'
          value={(p.color as string) ?? '#cccccc'}
          onChange={(v) => patchProps({ color: v })}
        />
      </Grid2>
    </Section>
  )
}

function RectProps({
  element,
  patchProps,
}: {
  element: LayoutElement
  patchProps: (kv: Record<string, unknown>) => void
}) {
  const p = element.props ?? {}
  return (
    <Section title='Rectangle'>
      <ColorInput
        label='Fill'
        value={(p.fill as string) ?? '#f4f4f5'}
        onChange={(v) => patchProps({ fill: v })}
      />
      <Grid2>
        <NumberInput
          label='Border'
          value={(p.borderWidth as number) ?? 0}
          min={0}
          max={10}
          step={0.5}
          suffix='px'
          onChange={(v) => patchProps({ borderWidth: v })}
        />
        <ColorInput
          label='Border color'
          value={(p.borderColor as string) ?? '#e4e4e7'}
          onChange={(v) => patchProps({ borderColor: v })}
        />
      </Grid2>
    </Section>
  )
}

// ── Tiny UI primitives ──────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className='flex flex-col gap-2 border-b border-border px-3 py-3 last:border-b-0'>
      <h3 className='text-[11px] font-semibold uppercase tracking-wider text-text-tertiary'>
        {title}
      </h3>
      {children}
    </section>
  )
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className='grid grid-cols-2 gap-2'>{children}</div>
}

function NumberInput({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  suffix?: string
  onChange: (next: number) => void
}) {
  return (
    <label className='flex flex-col gap-1'>
      <span className='flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-text-tertiary'>
        {label}
        {suffix ? <span className='font-normal normal-case'>· {suffix}</span> : null}
      </span>
      <input
        type='number'
        value={Number.isFinite(value) ? value : 0}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const v = Number(e.target.value)
          if (Number.isFinite(v)) onChange(v)
        }}
        className='h-7 w-full rounded-[5px] border border-border bg-background px-1.5 text-[12px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
      />
    </label>
  )
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (next: string) => void
}) {
  return (
    <label className='flex flex-col gap-1'>
      <span className='text-[10px] font-medium uppercase tracking-wider text-text-tertiary'>
        {label}
      </span>
      <div className='flex items-center gap-1.5'>
        <input
          type='color'
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className='size-7 shrink-0 cursor-pointer rounded-[5px] border border-border bg-background'
        />
        <input
          type='text'
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className='h-7 w-full min-w-0 rounded-[5px] border border-border bg-background px-1.5 font-mono text-[11px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
        />
      </div>
    </label>
  )
}

function ToggleRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; icon: React.FC<{ className?: string }>; label: string }[]
  value: T
  onChange: (next: T) => void
}) {
  return (
    <div className='flex overflow-hidden rounded-[5px] border border-border bg-bg-secondary'>
      {options.map((o) => {
        const Icon = o.icon
        const isActive = value === o.value
        return (
          <button
            key={o.value}
            type='button'
            title={o.label}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex h-7 flex-1 items-center justify-center transition-colors duration-[80ms]',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-text-tertiary hover:bg-bg-active hover:text-foreground'
            )}
          >
            <Icon className='size-3.5' />
          </button>
        )
      })}
    </div>
  )
}
