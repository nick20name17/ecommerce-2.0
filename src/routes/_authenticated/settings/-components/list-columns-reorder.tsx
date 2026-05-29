import { OptimisticSortingPlugin, SortableKeyboardPlugin } from '@dnd-kit/dom/sortable'
import { DragDropProvider } from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import { GripVertical, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { FieldConfigEntry } from '@/api/field-config/schema'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const SORTABLE_PLUGINS = [SortableKeyboardPlugin, OptimisticSortingPlugin]

interface ListColumnsReorderProps {
  /** Ordered list of field names currently selected as list columns. */
  orderedFields: string[]
  /**
   * Full entity field entries — used to render the display name (alias)
   * for each ordered field. Falls back to the field name when no alias.
   */
  entries: FieldConfigEntry[]
  onReorder: (next: string[]) => void
  onRemove: (field: string) => void
  disabled?: boolean
}

const arrayMove = <T,>(arr: T[], from: number, to: number) => {
  const next = arr.slice()
  next.splice(to, 0, next.splice(from, 1)[0]!)
  return next
}

export const ListColumnsReorder = ({
  orderedFields,
  entries,
  onReorder,
  onRemove,
  disabled
}: ListColumnsReorderProps) => {
  // Mirror props locally so drag interactions feel instant; sync on prop change.
  const [local, setLocal] = useState(orderedFields)
  useEffect(() => setLocal(orderedFields), [orderedFields])

  const aliasByField = new Map<string, string | null>()
  for (const e of entries) aliasByField.set(e.field, e.alias)

  const handleDragEnd = (event: unknown) => {
    const e = event as {
      canceled?: boolean
      operation?: {
        source: { id: string | number; initialIndex?: number; index?: number } | null
        target: { id: string | number } | null
      }
    }
    if (e.canceled || !e.operation?.source) return
    const src = e.operation.source
    const tgt = e.operation.target
    const from =
      typeof src.initialIndex === 'number'
        ? src.initialIndex
        : local.indexOf(String(src.id))
    const to =
      typeof src.index === 'number'
        ? src.index
        : tgt != null
          ? local.indexOf(String(tgt.id))
          : -1
    if (from === -1 || to === -1 || from === to) return
    const next = arrayMove(local, from, to)
    setLocal(next)
    onReorder(next)
  }

  if (local.length === 0) {
    return (
      <p className='px-6 py-3 text-[12px] text-text-tertiary'>
        No list columns selected. Toggle <span className='font-semibold'>Header</span> on a field above to add it here.
      </p>
    )
  }

  return (
    <DragDropProvider plugins={SORTABLE_PLUGINS} onDragEnd={handleDragEnd}>
      <div className='flex flex-col gap-1 px-6 py-3'>
        {local.map((field, index) => (
          <SortableColumnRow
            key={field}
            field={field}
            alias={aliasByField.get(field) ?? null}
            index={index}
            disabled={disabled}
            onRemove={() => onRemove(field)}
          />
        ))}
      </div>
    </DragDropProvider>
  )
}

function SortableColumnRow({
  field,
  alias,
  index,
  disabled,
  onRemove
}: {
  field: string
  alias: string | null
  index: number
  disabled?: boolean
  onRemove: () => void
}) {
  const { handleRef, ref, isDragging } = useSortable({
    id: field,
    index,
    disabled
  })

  const label = alias && alias.length > 0 ? alias : field

  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5',
        isDragging && 'opacity-60 shadow-md',
        disabled && 'opacity-50'
      )}
    >
      <button
        ref={handleRef}
        className='cursor-grab touch-none text-text-tertiary'
        aria-label='Drag to reorder'
        disabled={disabled}
      >
        <GripVertical className='h-4 w-4' />
      </button>
      <span className='flex-1 truncate text-[13px]'>{label}</span>
      {label !== field && (
        <span className='text-[11px] text-text-quaternary'>{field}</span>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type='button'
            className='inline-flex size-6 items-center justify-center rounded-[5px] text-text-tertiary transition-colors hover:bg-bg-active hover:text-foreground disabled:opacity-50'
            onClick={onRemove}
            disabled={disabled}
            aria-label='Remove from list columns'
          >
            <X className='h-3.5 w-3.5' />
          </button>
        </TooltipTrigger>
        <TooltipContent>Remove from list columns</TooltipContent>
      </Tooltip>
    </div>
  )
}
