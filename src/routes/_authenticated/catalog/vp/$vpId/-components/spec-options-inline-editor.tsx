import { defaultPreset } from '@dnd-kit/dom'
import { OptimisticSortingPlugin, SortableKeyboardPlugin } from '@dnd-kit/dom/sortable'
import { DragDropProvider } from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { GripVertical, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

import { getSpecOptionsQuery, VP_QUERY_KEYS } from '@/api/variable-product/query'
import type { SpecDisplayType, SpecOption } from '@/api/variable-product/schema'
import { variableProductService } from '@/api/variable-product/service'
import { Button } from '@/components/ui/button'
import { ColorPicker } from '@/components/ui/color-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const SORTABLE_PLUGINS = [
  ...defaultPreset.plugins,
  OptimisticSortingPlugin,
  SortableKeyboardPlugin,
]

const arrayMove = <T,>(array: T[], from: number, to: number): T[] => {
  const next = array.slice()
  next.splice(to, 0, next.splice(from, 1)[0]!)
  return next
}

interface Props {
  specId: string
  displayType: SpecDisplayType
  projectId: number | null
  vpId: string
}

export const SpecOptionsInlineEditor = ({
  specId,
  displayType,
  projectId,
  vpId,
}: Props) => {
  const queryClient = useQueryClient()
  const params = { project_id: projectId ?? undefined }

  const { data: rawData, isLoading } = useQuery(getSpecOptionsQuery(specId, params))
  const serverOptions: SpecOption[] = Array.isArray(rawData)
    ? rawData
    : ((rawData as unknown as { results?: SpecOption[] })?.results ?? [])

  const [orderedOptions, setOrderedOptions] = useState<SpecOption[]>(serverOptions)
  useEffect(() => {
    setOrderedOptions(serverOptions)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawData])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: VP_QUERY_KEYS.specOptions(specId) })
    queryClient.invalidateQueries({ queryKey: VP_QUERY_KEYS.detail(vpId) })
  }

  const [newValue, setNewValue] = useState('')
  const createMutation = useMutation({
    mutationFn: () =>
      variableProductService.createSpecOption(
        specId,
        { value: newValue.trim(), sort_order: orderedOptions.length },
        params
      ),
    meta: { successMessage: 'Option added' },
    onSuccess: () => {
      invalidate()
      setNewValue('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (optionId: string) =>
      variableProductService.deleteSpecOption(specId, optionId, params),
    meta: { successMessage: 'Option deleted' },
    onSuccess: invalidate,
  })

  const reorderMutation = useMutation({
    mutationFn: ({ id, sort_order }: { id: string; sort_order: number }) =>
      variableProductService.updateSpecOption(specId, id, { sort_order }, params),
  })

  const handleDragEnd = (event: unknown) => {
    const e = event as {
      canceled?: boolean
      operation?: {
        source: { id: string | number } | null
        target: { id: string | number } | null
      }
    }
    if (e.canceled) return
    const op = e.operation
    if (!op?.source) return

    const { source, target } = op
    const sortableSource = source as { initialIndex?: number; index?: number }
    const useSortableIndices =
      typeof sortableSource.initialIndex === 'number' &&
      typeof sortableSource.index === 'number'

    const fromIndex = useSortableIndices
      ? sortableSource.initialIndex
      : orderedOptions.findIndex((o) => o.id === String(source?.id))
    const toIndex = useSortableIndices
      ? sortableSource.index
      : target != null
        ? orderedOptions.findIndex((o) => o.id === String(target.id))
        : -1

    if (
      typeof fromIndex !== 'number' ||
      typeof toIndex !== 'number' ||
      fromIndex === -1 ||
      toIndex === -1 ||
      fromIndex === toIndex
    )
      return

    const next = arrayMove(orderedOptions, fromIndex, toIndex)
    setOrderedOptions(next)

    Promise.all(
      next.map((opt, i) =>
        opt.sort_order === i
          ? Promise.resolve()
          : reorderMutation.mutateAsync({ id: opt.id, sort_order: i })
      )
    )
      .then(() => invalidate())
      .catch(() => {})
  }

  return (
    <div className='flex flex-col gap-2'>
      <Label className='text-[12px]'>
        Options
        {displayType === 'swatch' && (
          <span className='ml-1 text-[11px] font-normal text-text-tertiary'>
            · click swatch to set color · drag to reorder
          </span>
        )}
        {displayType !== 'swatch' && (
          <span className='ml-1 text-[11px] font-normal text-text-tertiary'>
            · drag to reorder
          </span>
        )}
      </Label>

      <div className='flex flex-col overflow-hidden rounded-lg border border-border'>
        <div
          className='max-h-[40vh] overflow-y-auto overscroll-contain'
          onWheel={(e) => e.stopPropagation()}
        >
          {isLoading ? (
            <div className='flex flex-col gap-1 p-2'>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className='h-9 w-full rounded-md' />
              ))}
            </div>
          ) : orderedOptions.length === 0 ? (
            <div className='px-3 py-4 text-center text-[12px] text-text-tertiary'>
              No options yet. Add one below.
            </div>
          ) : (
            <DragDropProvider plugins={SORTABLE_PLUGINS} onDragEnd={handleDragEnd}>
              <div className='flex flex-col divide-y divide-border-light'>
                {orderedOptions.map((opt, index) => (
                  <SortableOptionRow
                    key={opt.id}
                    index={index}
                    specId={specId}
                    option={opt}
                    displayType={displayType}
                    projectId={projectId}
                    vpId={vpId}
                    onDelete={() => deleteMutation.mutate(opt.id)}
                    isDeleting={
                      deleteMutation.isPending && deleteMutation.variables === opt.id
                    }
                  />
                ))}
              </div>
            </DragDropProvider>
          )}
        </div>

        {/* Add row — sticky at bottom of the list card */}
        <form
          className='flex items-center gap-2 border-t border-border-light bg-bg-secondary/40 px-2 py-1.5'
          onSubmit={(e) => {
            e.preventDefault()
            if (newValue.trim()) createMutation.mutate()
          }}
        >
          <Plus className='size-3.5 shrink-0 text-text-tertiary' />
          <Input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder='Add option (e.g. Red, Large)'
            className='h-7 border-0 bg-transparent px-1 text-[13px] shadow-none focus-visible:ring-0'
          />
          <Button
            type='submit'
            size='sm'
            variant='ghost'
            disabled={!newValue.trim() || createMutation.isPending}
            isPending={createMutation.isPending}
          >
            Add
          </Button>
        </form>
      </div>
    </div>
  )
}

interface OptionRowProps {
  index: number
  specId: string
  option: SpecOption
  displayType: SpecDisplayType
  projectId: number | null
  vpId: string
  onDelete: () => void
  isDeleting: boolean
}

const SortableOptionRow = ({
  index,
  specId,
  option,
  displayType,
  projectId,
  vpId,
  onDelete,
  isDeleting,
}: OptionRowProps) => {
  const queryClient = useQueryClient()
  const params = { project_id: projectId ?? undefined }

  const { handleRef, ref, isDragging } = useSortable({
    id: option.id,
    index,
  })

  const [value, setValue] = useState(option.value)
  const [color, setColor] = useState(option.color_hex || '')

  useEffect(() => {
    setValue(option.value)
    setColor(option.color_hex || '')
  }, [option.id, option.value, option.color_hex])

  const patch = async (payload: Partial<SpecOption>) => {
    await variableProductService.updateSpecOption(specId, option.id, payload, params)
    queryClient.invalidateQueries({ queryKey: VP_QUERY_KEYS.specOptions(specId) })
    queryClient.invalidateQueries({ queryKey: VP_QUERY_KEYS.detail(vpId) })
  }

  const debouncedPatchColor = useDebouncedCallback((next: string) => {
    if (next !== (option.color_hex || '')) patch({ color_hex: next })
  }, 400)

  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5',
        isDragging && 'bg-bg-hover opacity-60 shadow-sm'
      )}
    >
      <button
        ref={handleRef}
        type='button'
        className='shrink-0 cursor-grab touch-none text-text-quaternary hover:text-text-secondary'
        aria-label='Drag to reorder'
      >
        <GripVertical className='size-3.5' />
      </button>

      {displayType === 'swatch' ? (
        <ColorPicker
          value={color}
          onChange={(next) => {
            setColor(next)
            debouncedPatchColor(next)
          }}
          size='icon-sm'
          className='size-7 rounded-full border-border'
        />
      ) : (
        <div className='size-7 shrink-0 rounded-md bg-bg-secondary text-center text-[11px] leading-7 text-text-tertiary'>
          {value.slice(0, 2).toUpperCase()}
        </div>
      )}

      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          if (value.trim() && value !== option.value) patch({ value: value.trim() })
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        }}
        className='h-7 flex-1 border-0 bg-transparent px-1 text-[13px] shadow-none focus-visible:ring-0'
        placeholder='Value'
      />

      {displayType === 'swatch' && color && (
        <span className='font-mono text-[10px] uppercase text-text-quaternary'>
          {color}
        </span>
      )}

      <Button
        type='button'
        variant='ghost'
        size='icon-xs'
        className='hover:text-destructive'
        onClick={onDelete}
        disabled={isDeleting}
      >
        <Trash2 className='size-3' />
      </Button>
    </div>
  )
}
