import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Image as ImageIcon,
  Italic,
  Minus,
  Plus,
  Square,
  Table as TableIcon,
  Trash2,
  Type,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { documentTemplateService } from '@/api/document-template/service'
import type { FieldConfigEntry } from '@/api/field-config/schema'
import type {
  DocumentLayout,
  ElementType,
  LayoutElement,
  TableColumn,
  TableColumnFormat,
} from '@/api/document-template/schema'
import { cn } from '@/lib/utils'

import { CanvasElement } from './canvas-element'
import {
  ELEMENT_DEFAULTS,
  PX_PER_INCH,
  ensureLayout,
  newId,
  pageDims,
  resolveField,
  snapInches,
} from './designer-types'

interface DesignerCanvasProps {
  layout: DocumentLayout
  onChange: (next: DocumentLayout) => void
  pageSize: string
  orientation: 'portrait' | 'landscape'
  pageMargins?: { top?: number; right?: number; bottom?: number; left?: number }
  /**
   * Field schema for the entity this template binds to — drives the field
   * picker in the properties panel. Empty/undefined falls back to a free
   * text input.
   */
  availableFields?: FieldConfigEntry[]
  /**
   * Resolved entity data to preview Field elements against. When set, Field
   * elements render the resolved value instead of the `{field.key}` token.
   */
  entityData?: Record<string, unknown> | null
  /** Template id — required for image upload (file → S3 path scope). */
  templateId?: number
  /** Project id — passed through to the upload endpoint. */
  projectId?: number | null
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
  availableFields,
  entityData,
  templateId,
  projectId,
}: DesignerCanvasProps) {
  const normalized = ensureLayout(layout)
  const dims = pageDims(pageSize, orientation)

  const pages = normalized.pages ?? [{ elements: [] }]
  const [currentPageIndex, setCurrentPageIndex] = useState(0)

  // Clamp when pages shrink underneath us (e.g. after a delete).
  useEffect(() => {
    if (currentPageIndex >= pages.length && pages.length > 0) {
      setCurrentPageIndex(pages.length - 1)
    }
  }, [pages.length, currentPageIndex])

  const elements = pages[currentPageIndex]?.elements ?? []

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const updatePage = useCallback(
    (next: LayoutElement[]) => {
      const nextPages = [...pages]
      nextPages[currentPageIndex] = {
        ...(nextPages[currentPageIndex] ?? { elements: [] }),
        elements: next,
      }
      onChange({ pages: nextPages })
    },
    [pages, currentPageIndex, onChange]
  )

  const addPage = useCallback(() => {
    onChange({ pages: [...pages, { elements: [] }] })
    setCurrentPageIndex(pages.length)
    setSelectedId(null)
  }, [pages, onChange])

  const removePage = useCallback(
    (idx: number) => {
      if (pages.length <= 1) return
      const nextPages = pages.filter((_, i) => i !== idx)
      const nextIdx = Math.max(
        0,
        Math.min(currentPageIndex, nextPages.length - 1)
      )
      onChange({ pages: nextPages })
      setCurrentPageIndex(nextIdx)
      setSelectedId(null)
    },
    [pages, currentPageIndex, onChange]
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

      {/* Canvas + page bar (column) */}
      <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
        {/* Page selector bar */}
        <div className='flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border bg-bg-secondary/30 px-3 py-1.5'>
          <span className='text-[10.5px] font-semibold uppercase tracking-wider text-text-tertiary'>
            Page
          </span>
          {pages.map((_, idx) => {
            const isActive = idx === currentPageIndex
            return (
              <button
                key={idx}
                type='button'
                onClick={() => {
                  setCurrentPageIndex(idx)
                  setSelectedId(null)
                }}
                className={cn(
                  'inline-flex h-6 min-w-[24px] items-center justify-center rounded-[4px] border px-1.5 text-[12px] font-medium transition-colors duration-[80ms]',
                  isActive
                    ? 'border-primary bg-primary/[0.1] text-primary'
                    : 'border-border bg-background text-text-secondary hover:bg-bg-active hover:text-foreground'
                )}
              >
                {idx + 1}
              </button>
            )
          })}
          <button
            type='button'
            onClick={addPage}
            className='inline-flex h-6 items-center gap-1 rounded-[4px] border border-dashed border-border bg-background px-1.5 text-[11.5px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground'
            title='Add page'
          >
            <Plus className='size-3' />
            Add
          </button>
          <div className='flex-1' />
          {pages.length > 1 && (
            <button
              type='button'
              onClick={() => {
                if (
                  confirm(
                    `Delete page ${currentPageIndex + 1}? All elements on it will be lost.`
                  )
                ) {
                  removePage(currentPageIndex)
                }
              }}
              className='inline-flex h-6 items-center gap-1 rounded-[4px] px-1.5 text-[11.5px] font-medium text-text-tertiary transition-colors duration-[80ms] hover:bg-bg-hover hover:text-destructive'
              title={`Delete page ${currentPageIndex + 1}`}
            >
              <Trash2 className='size-3' />
              Delete page
            </button>
          )}
        </div>

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

          {elements.map((el) => {
            const resolved =
              el.type === 'field' && entityData
                ? resolveField(
                    (el.props?.fieldKey as string | undefined) ?? '',
                    entityData
                  )
                : undefined
            return (
              <CanvasElement
                key={el.id}
                element={el}
                isSelected={selectedId === el.id}
                onSelect={() => setSelectedId(el.id)}
                onChange={replaceElement}
                onDelete={() => deleteElement(el.id)}
                pageW={dims.w}
                pageH={dims.h}
                resolvedValue={resolved}
                entityData={entityData}
              />
            )
          })}
        </div>
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
            availableFields={availableFields}
            entityData={entityData}
            templateId={templateId}
            projectId={projectId}
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
  availableFields,
  entityData,
  templateId,
  projectId,
}: {
  element: LayoutElement
  onPatch: (patch: Partial<LayoutElement>) => void
  onDelete: () => void
  pageDims: { w: number; h: number }
  availableFields?: FieldConfigEntry[]
  entityData?: Record<string, unknown> | null
  templateId?: number
  projectId?: number | null
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
        <FieldProps
          element={element}
          patchProps={patchProps}
          availableFields={availableFields}
          entityData={entityData}
        />
      )}
      {element.type === 'image' && (
        <ImageProps
          element={element}
          patchProps={patchProps}
          templateId={templateId}
          projectId={projectId}
        />
      )}
      {element.type === 'line' && (
        <LineProps element={element} patchProps={patchProps} />
      )}
      {element.type === 'rect' && (
        <RectProps element={element} patchProps={patchProps} />
      )}
      {element.type === 'table' && (
        <TableProps
          element={element}
          onPatch={onPatch}
          patchProps={patchProps}
          availableFields={availableFields}
        />
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
  availableFields,
  entityData,
}: {
  element: LayoutElement
  patchProps: (kv: Record<string, unknown>) => void
  availableFields?: FieldConfigEntry[]
  entityData?: Record<string, unknown> | null
}) {
  const p = element.props ?? {}
  const fieldKey = (p.fieldKey as string) ?? ''
  const enabledFields = (availableFields ?? []).filter(
    (f) => f.default || f.enabled
  )
  const listId = `field-picker-${element.id}`
  const matched = enabledFields.find((f) => f.field === fieldKey.toLowerCase())
  const resolved =
    fieldKey && entityData ? resolveField(fieldKey, entityData) : null

  return (
    <Section title='Field binding'>
      <p className='text-[11px] leading-snug text-text-tertiary'>
        Pick from configured fields, or type any EBMS column key
        (e.g. <code>ARINV.INVOICE</code>).
      </p>
      <input
        type='text'
        list={enabledFields.length > 0 ? listId : undefined}
        value={fieldKey}
        onChange={(e) => patchProps({ fieldKey: e.target.value })}
        placeholder='ARINV.INVOICE'
        className='h-8 w-full rounded-[5px] border border-border bg-background px-2 font-mono text-[12px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
        autoComplete='off'
      />
      {enabledFields.length > 0 && (
        <datalist id={listId}>
          {enabledFields.map((f) => (
            <option
              key={f.field}
              value={f.field}
              label={f.alias || f.field}
            />
          ))}
        </datalist>
      )}
      {matched && matched.alias && (
        <span className='text-[11px] text-text-tertiary'>
          {matched.alias}
          {matched.type ? ` · ${matched.type}` : ''}
        </span>
      )}
      {resolved !== null && (
        <div className='flex flex-col gap-1 rounded-[5px] border border-border bg-background px-2 py-1.5'>
          <span className='text-[10px] font-medium uppercase tracking-wider text-text-tertiary'>
            Preview
          </span>
          <span className='break-words font-mono text-[11.5px] text-foreground'>
            {resolved || (
              <span className='italic text-text-tertiary'>(empty)</span>
            )}
          </span>
        </div>
      )}
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
  templateId,
  projectId,
}: {
  element: LayoutElement
  patchProps: (kv: Record<string, unknown>) => void
  templateId?: number
  projectId?: number | null
}) {
  const p = element.props ?? {}
  const src = (p.src as string) ?? ''
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFile = async (file: File) => {
    if (!templateId) {
      setUploadError('Save the template first before uploading')
      return
    }
    setUploadError(null)
    setUploading(true)
    try {
      const result = await documentTemplateService.uploadImage(
        templateId,
        file,
        projectId
      )
      patchProps({ src: result.url })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setUploadError(e.response?.data?.error ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Section title='Image'>
      <input
        type='url'
        value={src}
        onChange={(e) => patchProps({ src: e.target.value })}
        placeholder='https://…/logo.png'
        className='h-8 w-full rounded-[5px] border border-border bg-background px-2 text-[12.5px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
      />
      <div className='flex items-center gap-2'>
        <input
          ref={fileInputRef}
          type='file'
          accept='image/png,image/jpeg,image/gif,image/webp,image/svg+xml'
          className='hidden'
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
            // Reset so the same file can be re-picked.
            if (e.target) e.target.value = ''
          }}
        />
        <button
          type='button'
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || !templateId}
          className='inline-flex h-7 items-center gap-1 rounded-[5px] border border-border bg-bg-secondary px-2 text-[12px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground disabled:pointer-events-none disabled:opacity-50'
          title={
            templateId
              ? 'Upload a new image'
              : 'Save the template first to enable upload'
          }
        >
          <ImageIcon className='size-3.5' />
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
        {src && (
          <button
            type='button'
            onClick={() => patchProps({ src: '' })}
            disabled={uploading}
            className='inline-flex h-7 items-center gap-1 rounded-[5px] px-2 text-[11.5px] font-medium text-text-tertiary transition-colors hover:bg-bg-hover hover:text-destructive disabled:pointer-events-none disabled:opacity-50'
          >
            <X className='size-3' />
            Clear
          </button>
        )}
      </div>
      {uploadError && (
        <span className='text-[11px] text-destructive'>{uploadError}</span>
      )}
      {src && !uploadError && (
        // eslint-disable-next-line jsx-a11y/alt-text
        <img
          src={src}
          className='mt-1 max-h-24 self-start rounded-[4px] border border-border bg-checker object-contain'
          style={{ background: '#fff' }}
          onError={() => setUploadError('Failed to load preview')}
        />
      )}
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

// ── Table properties ────────────────────────────────────────

const FORMAT_OPTIONS: TableColumnFormat[] = [
  'string',
  'number',
  'integer',
  'currency',
  'percent',
]
const ALIGN_OPTIONS: ('left' | 'center' | 'right')[] = ['left', 'center', 'right']

function TableProps({
  element,
  onPatch,
  patchProps,
  availableFields,
}: {
  element: LayoutElement
  onPatch: (patch: Partial<LayoutElement>) => void
  patchProps: (kv: Record<string, unknown>) => void
  availableFields?: FieldConfigEntry[]
}) {
  const p = element.props ?? {}
  const columns = (p.columns as TableColumn[] | undefined) ?? []

  const updateColumns = (next: TableColumn[]) => {
    patchProps({ columns: next })
    void onPatch // keep parameter referenced for the typed signature
  }

  const updateColumn = (index: number, patch: Partial<TableColumn>) => {
    updateColumns(
      columns.map((c, i) => (i === index ? { ...c, ...patch } : c))
    )
  }

  const moveColumn = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= columns.length) return
    const next = [...columns]
    ;[next[index], next[target]] = [next[target], next[index]]
    updateColumns(next)
  }

  const removeColumn = (index: number) => {
    updateColumns(columns.filter((_, i) => i !== index))
  }

  const addColumn = () => {
    updateColumns([
      ...columns,
      { fieldKey: '', label: 'Column', widthPct: 0, align: 'left', format: 'string' },
    ])
  }

  const totalPct = columns.reduce((s, c) => s + (c.widthPct ?? 0), 0)

  return (
    <>
      <Section title='Items source'>
        <input
          type='text'
          value={(p.itemsSource as string) ?? 'items'}
          onChange={(e) => patchProps({ itemsSource: e.target.value })}
          placeholder='items'
          className='h-8 w-full rounded-[5px] border border-border bg-background px-2 font-mono text-[12px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
        />
        <span className='text-[11px] text-text-tertiary'>
          Field key of the entity's list to loop over (default <code>items</code>).
        </span>
      </Section>

      <Section title='Columns'>
        {columns.length === 0 ? (
          <p className='text-[11.5px] italic text-text-tertiary'>
            No columns yet — add one below.
          </p>
        ) : (
          <div className='flex flex-col gap-2'>
            {columns.map((c, i) => (
              <ColumnEditor
                key={i}
                index={i}
                column={c}
                isFirst={i === 0}
                isLast={i === columns.length - 1}
                availableFields={availableFields}
                onChange={(patch) => updateColumn(i, patch)}
                onMove={(dir) => moveColumn(i, dir)}
                onRemove={() => removeColumn(i)}
              />
            ))}
          </div>
        )}
        <div className='flex items-center justify-between gap-2'>
          <button
            type='button'
            onClick={addColumn}
            className='inline-flex h-7 items-center gap-1 rounded-[5px] border border-dashed border-border bg-bg-secondary px-2 text-[12px] font-medium text-text-secondary transition-colors hover:bg-bg-active hover:text-foreground'
          >
            <Type className='size-3' />
            Add column
          </button>
          <span
            className={cn(
              'text-[10.5px]',
              Math.round(totalPct) === 100
                ? 'text-text-tertiary'
                : 'text-amber-600'
            )}
            title='Sum of widthPct across columns'
          >
            Σ width: {totalPct.toFixed(0)}%
          </span>
        </div>
      </Section>

      <Section title='Style'>
        <label className='flex cursor-pointer items-center gap-2'>
          <input
            type='checkbox'
            checked={p.showHeader !== false}
            onChange={(e) => patchProps({ showHeader: e.target.checked })}
            className='size-3.5 accent-primary'
          />
          <span className='text-[12.5px]'>Show header row</span>
        </label>
        <label className='flex cursor-pointer items-center gap-2'>
          <input
            type='checkbox'
            checked={!!p.striped}
            onChange={(e) => patchProps({ striped: e.target.checked })}
            className='size-3.5 accent-primary'
          />
          <span className='text-[12.5px]'>Alternating row shading</span>
        </label>
        <Grid2>
          <NumberInput
            label='Font'
            value={(p.fontSize as number) ?? 10}
            min={6}
            max={32}
            step={0.5}
            suffix='pt'
            onChange={(v) => patchProps({ fontSize: v })}
          />
          <ColorInput
            label='Header bg'
            value={(p.headerBackground as string) ?? '#f4f4f5'}
            onChange={(v) => patchProps({ headerBackground: v })}
          />
        </Grid2>
        <ColorInput
          label='Border'
          value={(p.borderColor as string) ?? '#e4e4e7'}
          onChange={(v) => patchProps({ borderColor: v })}
        />
        {!!p.striped && (
          <ColorInput
            label='Stripe bg'
            value={(p.stripeBackground as string) ?? '#fafafa'}
            onChange={(v) => patchProps({ stripeBackground: v })}
          />
        )}
      </Section>
    </>
  )
}

function ColumnEditor({
  index,
  column,
  isFirst,
  isLast,
  availableFields,
  onChange,
  onMove,
  onRemove,
}: {
  index: number
  column: TableColumn
  isFirst: boolean
  isLast: boolean
  availableFields?: FieldConfigEntry[]
  onChange: (patch: Partial<TableColumn>) => void
  onMove: (dir: -1 | 1) => void
  onRemove: () => void
}) {
  // Columns address fields on a row item — use the order_item / proposal_item
  // schema when available. Fall back to the entity-level fields.
  const enabledFields = (availableFields ?? []).filter(
    (f) => f.default || f.enabled
  )
  const listId = `col-field-${index}`

  return (
    <div className='flex flex-col gap-1.5 rounded-[6px] border border-border bg-background p-2'>
      <div className='flex items-center gap-1.5'>
        <span className='text-[10px] font-semibold uppercase tracking-wider text-text-tertiary'>
          Col {index + 1}
        </span>
        <div className='flex-1' />
        <button
          type='button'
          disabled={isFirst}
          onClick={() => onMove(-1)}
          className='inline-flex size-5 items-center justify-center rounded-[4px] text-text-tertiary hover:bg-bg-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-30'
          title='Move up'
        >
          ↑
        </button>
        <button
          type='button'
          disabled={isLast}
          onClick={() => onMove(1)}
          className='inline-flex size-5 items-center justify-center rounded-[4px] text-text-tertiary hover:bg-bg-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-30'
          title='Move down'
        >
          ↓
        </button>
        <button
          type='button'
          onClick={onRemove}
          className='inline-flex size-5 items-center justify-center rounded-[4px] text-text-tertiary hover:bg-bg-hover hover:text-destructive'
          title='Remove column'
        >
          <X className='size-3' />
        </button>
      </div>

      <input
        type='text'
        value={column.label ?? ''}
        onChange={(e) => onChange({ label: e.target.value })}
        placeholder='Label'
        className='h-7 w-full rounded-[4px] border border-border bg-background px-1.5 text-[12px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20'
      />
      <input
        type='text'
        list={enabledFields.length > 0 ? listId : undefined}
        value={column.fieldKey ?? ''}
        onChange={(e) => onChange({ fieldKey: e.target.value })}
        placeholder='descr / quan / unit_price'
        className='h-7 w-full rounded-[4px] border border-border bg-background px-1.5 font-mono text-[11.5px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20'
        autoComplete='off'
      />
      {enabledFields.length > 0 && (
        <datalist id={listId}>
          {enabledFields.map((f) => (
            <option key={f.field} value={f.field} label={f.alias || f.field} />
          ))}
        </datalist>
      )}

      <div className='grid grid-cols-[1fr_auto_auto] gap-1.5'>
        <input
          type='number'
          value={column.widthPct ?? 0}
          min={0}
          max={100}
          step={1}
          onChange={(e) =>
            onChange({ widthPct: Math.max(0, Number(e.target.value) || 0) })
          }
          placeholder='width %'
          className='h-7 w-full rounded-[4px] border border-border bg-background px-1.5 text-[11.5px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20'
          title='Column width as percent of table width'
        />
        <select
          value={column.align ?? 'left'}
          onChange={(e) =>
            onChange({ align: e.target.value as TableColumn['align'] })
          }
          className='h-7 rounded-[4px] border border-border bg-background px-1.5 text-[11.5px] outline-none focus:border-primary'
        >
          {ALIGN_OPTIONS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          value={column.format ?? 'string'}
          onChange={(e) =>
            onChange({ format: e.target.value as TableColumnFormat })
          }
          className='h-7 rounded-[4px] border border-border bg-background px-1.5 text-[11.5px] outline-none focus:border-primary'
          title='How to format the resolved value'
        >
          {FORMAT_OPTIONS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>
    </div>
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
