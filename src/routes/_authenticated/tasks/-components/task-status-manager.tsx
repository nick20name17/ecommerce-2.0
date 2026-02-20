import { defaultPreset } from '@dnd-kit/dom'
import { OptimisticSortingPlugin, SortableKeyboardPlugin } from '@dnd-kit/dom/sortable'
import { DragDropProvider } from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { GripVertical, Pencil, Plus, Settings, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { TASK_QUERY_KEYS } from '@/api/task/query'
import type { TaskStatus } from '@/api/task/schema'
import { taskService } from '@/api/task/service'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ColorPicker } from '@/components/ui/color-picker'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const SORTABLE_PLUGINS = [...defaultPreset.plugins, OptimisticSortingPlugin, SortableKeyboardPlugin]

const defaultStatusColorHex = '#6B7280'

function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const next = array.slice()
  next.splice(to, 0, next.splice(from, 1)[0]!)
  return next
}

interface TaskStatusManagerProps {
  projectId: number | null | undefined
  statuses: TaskStatus[]
}

export function TaskStatusManager({ projectId, statuses }: TaskStatusManagerProps) {
  const [orderedStatuses, setOrderedStatuses] = useState(() =>
    [...statuses].sort((a, b) => a.order - b.order)
  )

  const queryClient = useQueryClient()

  const reorderMutation = useMutation({
    mutationFn: ({ id, order }: { id: number; order: number }) =>
      taskService.updateStatus(id, { order })
  })
  const handleDragEnd = (event: unknown) => {
    const e = event as {
      canceled?: boolean
      operation?: { source: { id: string | number } | null; target: { id: string | number } | null }
    }
    if (e.canceled) return
    const op = e.operation
    if (!op?.source) return

    const { source, target } = op
    const sortableSource = source as { initialIndex?: number; index?: number }
    const useSortableIndices =
      typeof sortableSource.initialIndex === 'number' && typeof sortableSource.index === 'number'

    const fromIndex = useSortableIndices
      ? sortableSource.initialIndex
      : orderedStatuses.findIndex((s) => s.id === Number(source?.id))
    const toIndex = useSortableIndices
      ? sortableSource.index
      : target != null
        ? orderedStatuses.findIndex((s) => s.id === Number(target.id))
        : -1

    if (
      typeof fromIndex !== 'number' ||
      typeof toIndex !== 'number' ||
      fromIndex === -1 ||
      toIndex === -1 ||
      fromIndex === toIndex
    )
      return

    const next = arrayMove(orderedStatuses, fromIndex, toIndex)

    setOrderedStatuses(next)

    Promise.all(
      next
        .filter((s) => !s.is_default && s.id != null)
        .map((status, i) =>
          reorderMutation.mutateAsync({ id: status.id as number, order: i })
        )
    )
      .then(() => {
        queryClient.invalidateQueries({
          queryKey: TASK_QUERY_KEYS.statuses(projectId ?? null)
        })
        toast.success('Status order saved')
      })
      .catch(() => {})
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          size='icon'
        >
          <Settings />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className='w-80'
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <p className='text-muted-foreground mb-2 text-xs'>
          Drag rows to reorder. Default status is fixed and cannot be edited or deleted.
        </p>
        <DragDropProvider
          plugins={SORTABLE_PLUGINS}
          onDragEnd={handleDragEnd}
        >
          <StatusList
            projectId={projectId ?? null}
            statuses={orderedStatuses}
            onStatusesChange={setOrderedStatuses}
          />
        </DragDropProvider>
      </PopoverContent>
    </Popover>
  )
}

function StatusList({
  projectId,
  statuses,
  onStatusesChange
}: {
  projectId: number | null
  statuses: TaskStatus[]
  onStatusesChange: (statuses: TaskStatus[]) => void
}) {
  const mutationMeta = { meta: { invalidatesQuery: TASK_QUERY_KEYS.statuses(projectId) } }

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; color: string }) =>
      taskService.createStatus({
        ...payload,
        project: projectId ?? undefined,
        order: statuses.length
      }),
    ...mutationMeta
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name, color }: { id: number; name: string; color: string }) =>
      taskService.updateStatus(id, { name, color }),
    ...{ meta: { ...mutationMeta.meta, successMessage: 'Status updated' } }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => taskService.deleteStatus(id),
    onSuccess: (_, id) => onStatusesChange(statuses.filter((s) => s.id !== id)),
    ...mutationMeta
  })

  return (
    <div className='flex flex-col gap-1'>
      {statuses.map((status, index) => (
        <SortableStatusRow
          key={status.id}
          status={status}
          index={index}
          isDefault={status.is_default}
          canEdit={!status.is_default}
          canDelete={!status.is_default && statuses.length > 1}
          onEdit={(name, color) => updateMutation.mutate({ id: status.id, name, color })}
          onDelete={() => deleteMutation.mutate(status.id)}
        />
      ))}
      <AddStatusRow
        onAdd={(name, color) => createMutation.mutate({ name, color })}
        disabled={createMutation.isPending}
      />
    </div>
  )
}

function SortableStatusRow({
  status,
  index,
  onEdit,
  onDelete,
  isDefault,
  canEdit,
  canDelete
}: {
  status: TaskStatus
  index: number
  onEdit: (name: string, color: string) => void
  onDelete: () => void
  isDefault: boolean
  canEdit: boolean
  canDelete: boolean
}) {
  const { handleRef, ref, isDragging } = useSortable({
    id: status.id,
    index,
    disabled: isDefault
  })

  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-2 rounded-md border px-3 py-2',
        isDefault && 'bg-muted/30',
        !isDefault && 'bg-background',
        isDragging && 'opacity-60 shadow-md'
      )}
    >
      {isDefault ? (
        <div className='w-4 shrink-0' aria-hidden />
      ) : (
        <button
          ref={handleRef}
          className='text-muted-foreground cursor-grab touch-none'
        >
          <GripVertical className='h-4 w-4' />
        </button>
      )}

      <div
        className='h-3 w-3 shrink-0 rounded-full'
        style={{ backgroundColor: status.color ?? 'var(--status-default)' }}
      />
      <span className='flex-1 text-sm'>{status.name}</span>

      {isDefault ? (
        <Badge
          variant='secondary'
          className='text-xs font-normal'
        >
          Default
        </Badge>
      ) : (
        <>
          {canEdit && (
            <StatusEditDialog
              status={status}
              onSave={onEdit}
            />
          )}
          {canDelete && (
            <Button
              variant='ghost'
              size='icon'
              className='h-6 w-6'
              onClick={onDelete}
            >
              <Trash2 className='h-3 w-3' />
            </Button>
          )}
        </>
      )}
    </div>
  )
}

function StatusEditDialog({
  status,
  onSave
}: {
  status: TaskStatus
  onSave: (name: string, color: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(status.name)
  const [color, setColor] = useState(status.color ?? defaultStatusColorHex)

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setName(status.name)
      setColor(status.color ?? defaultStatusColorHex)
    }
    setOpen(next)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onSave(trimmed, color)
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>
        <Button
          variant='ghost'
          size='icon-sm'
        >
          <Pencil />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit status</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className='flex gap-2'
        >
          <ColorPicker
            value={color}
            onChange={setColor}
          />
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Status name'
            className='flex-1'
          />
        </form>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddStatusRow({
  onAdd,
  disabled
}: {
  onAdd: (name: string, color: string) => void
  disabled: boolean
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(defaultStatusColorHex)

  const handleAdd = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed, color)
    setName('')
    setColor(defaultStatusColorHex)
  }

  return (
    <div className='flex items-center gap-2 rounded-md border border-dashed px-3 py-1'>
      <ColorPicker
        value={color}
        onChange={setColor}
      />
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        placeholder='Add status...'
        className='h-8 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0'
      />
      <Button
        variant='ghost'
        size='icon'
        className='h-6 w-6'
        onClick={handleAdd}
        disabled={disabled}
      >
        <Plus className='h-3 w-3' />
      </Button>
    </div>
  )
}
