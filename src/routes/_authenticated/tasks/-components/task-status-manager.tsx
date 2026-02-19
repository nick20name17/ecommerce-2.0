import { defaultPreset } from '@dnd-kit/dom'
import { OptimisticSortingPlugin, SortableKeyboardPlugin } from '@dnd-kit/dom/sortable'
import { DragDropProvider } from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, GripVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { TASK_QUERY_KEYS } from '@/api/task/query'
import type { TaskStatus } from '@/api/task/schema'
import { taskService } from '@/api/task/service'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

function arrayMove<T>(array: T[], from: number, to: number): T[] {
  if (from === to) return array
  const next = array.slice()
  next.splice(to, 0, next.splice(from, 1)[0]!)
  return next
}

const SORTABLE_PLUGINS = [...defaultPreset.plugins, OptimisticSortingPlugin, SortableKeyboardPlugin]

interface TaskStatusManagerProps {
  projectId: number | null
  statuses: TaskStatus[]
  value: number | null
  onValueChange: (statusId: number | null) => void
}

export function TaskStatusManager({
  projectId,
  statuses,
  value,
  onValueChange
}: TaskStatusManagerProps) {
  const [expanded, setExpanded] = useState(false)
  const sorted = [...statuses].sort((a, b) => a.order - b.order)
  const [orderedStatuses, setOrderedStatuses] = useState<TaskStatus[]>(sorted)
  const orderedStatusesRef = useRef(orderedStatuses)

  useEffect(() => {
    orderedStatusesRef.current = orderedStatuses
  }, [orderedStatuses])

  const queryClient = useQueryClient()
  const reorderMutation = useMutation({
    mutationFn: ({ id, order }: { id: number; order: number }) =>
      taskService.updateStatus(id, { order })
  })

  const handleDragEnd = (event: unknown, manager: unknown) => {
    const e = event as {
      operation?: { source: { id: unknown }; target: { id: unknown } }
    }
    const m = manager as {
      dragOperation?: { source: { id: unknown }; target: { id: unknown } }
    }
    const op = e?.operation ?? m?.dragOperation
    if (!op?.source || !op?.target) return
    const sourceId = op.source.id
    const targetId = op.target.id
    if (sourceId === targetId) return
    const current = orderedStatusesRef.current
    const fromIndex = current.findIndex((s) => s.id === sourceId)
    const toIndex = current.findIndex((s) => s.id === targetId)
    if (fromIndex === -1 || toIndex === -1) return
    const next = arrayMove(current, fromIndex, toIndex)
    setOrderedStatuses(next)
    const start = Math.min(fromIndex, toIndex)
    const end = Math.max(fromIndex, toIndex)
    Promise.all(
      Array.from({ length: end - start + 1 }, (_, i) => {
        const status = next[start + i]!
        return reorderMutation.mutateAsync({ id: status.id, order: start + i })
      })
    )
      .then(() => {
        queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.statuses(projectId) })
        toast.success('Status order saved')
      })
      .catch(() => {})
  }

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between gap-2'>
        <div className='flex flex-1 items-center gap-2'>
          <span className='text-sm font-medium'>Status</span>
          <Select
            value={value != null ? String(value) : 'all'}
            onValueChange={(v) => onValueChange(v === 'all' ? null : parseInt(v, 10))}
          >
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='All statuses' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All statuses</SelectItem>
              {orderedStatuses.map((s) => (
                <SelectItem
                  key={s.id}
                  value={String(s.id)}
                >
                  <span className='flex items-center gap-2'>
                    <span
                      className='size-2 shrink-0 rounded-full'
                      style={{ backgroundColor: s.color || '#94a3b8' }}
                    />
                    {s.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Popover
          open={expanded}
          onOpenChange={setExpanded}
        >
          <PopoverTrigger asChild>
            <Button
              variant='ghost'
              size='sm'
              className='text-muted-foreground'
            >
              {expanded ? (
                <>
                  Hide
                  <ChevronUp className='ml-1 size-4' />
                </>
              ) : (
                <>
                  Manage
                  <ChevronDown className='ml-1 size-4' />
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className='flex max-h-[min(70dvh,400px)] flex-col p-0'
            align='start'
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className='border-b px-3 py-2'>
              <p className='text-muted-foreground text-xs'>
                Drag rows to reorder. Default status is fixed.
              </p>
            </div>
            <div className='min-h-0 overflow-y-auto p-2'>
              <DragDropProvider
                plugins={SORTABLE_PLUGINS}
                onDragEnd={handleDragEnd as (e: unknown, m: unknown) => void}
              >
                <StatusList
                  projectId={projectId}
                  statuses={orderedStatuses}
                />
              </DragDropProvider>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

function StatusList({ projectId, statuses }: { projectId: number | null; statuses: TaskStatus[] }) {
  const createMutation = useMutation({
    mutationFn: (payload: { name: string; color: string }) =>
      taskService.createStatus({
        ...payload,
        project: projectId ?? undefined,
        order: statuses.length
      }),
    meta: { invalidatesQuery: TASK_QUERY_KEYS.statuses(projectId) }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name, color }: { id: number; name: string; color: string }) =>
      taskService.updateStatus(id, { name, color }),
    meta: {
      invalidatesQuery: TASK_QUERY_KEYS.statuses(projectId),
      successMessage: 'Status updated'
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => taskService.deleteStatus(id),
    meta: { invalidatesQuery: TASK_QUERY_KEYS.statuses(projectId) }
  })

  return (
    <div className='space-y-2'>
      {statuses.map((status, index) => (
        <SortableStatusRow
          key={status.id}
          status={status}
          index={index}
          onEdit={(name, color) => updateMutation.mutate({ id: status.id, name, color })}
          onDelete={() => deleteMutation.mutate(status.id)}
          isDefault={status.is_default}
          canEdit={!status.is_default}
          canDelete={!status.is_default && statuses.length > 1}
        />
      ))}
      <AddStatusRow
        onAdd={(name, color) => {
          createMutation.mutate({ name, color })
        }}
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
  const { handleRef, ref, sourceRef, targetRef, isDragging } = useSortable({
    id: status.id,
    index,
    disabled: isDefault
  })

  return (
    <div
      ref={(el) => {
        ref(el)
        sourceRef(el)
        targetRef(el)
      }}
      className={cn(
        'bg-background flex items-center gap-2 rounded-md border px-3 py-2',
        isDragging && 'opacity-60 shadow-md',
        isDefault && 'cursor-default'
      )}
    >
      {isDefault ? (
        <span
          className='w-5 shrink-0'
          aria-hidden
        />
      ) : (
        <button
          type='button'
          ref={handleRef}
          className='text-muted-foreground hover:text-foreground w-5 shrink-0 cursor-grab touch-none rounded p-0.5 active:cursor-grabbing'
          aria-label='Drag to reorder'
        >
          <GripVertical className='size-4' />
        </button>
      )}
      <span
        className='size-4 shrink-0 rounded'
        style={{ backgroundColor: status.color || '#94a3b8' }}
      />
      <span className='min-w-0 flex-1 truncate text-sm font-medium'>{status.name}</span>
      {isDefault && (
        <span className='bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs font-medium'>
          Default
        </span>
      )}
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
          className='text-destructive h-8 w-8 shrink-0'
          onClick={onDelete}
        >
          <Trash2 className='size-4' />
        </Button>
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
  const [color, setColor] = useState(status.color || '#94a3b8')

  const handleOpen = (next: boolean) => {
    if (next) {
      setName(status.name)
      setColor(status.color || '#94a3b8')
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
      onOpenChange={handleOpen}
    >
      <DialogTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='h-8 w-8 shrink-0'
        >
          <Pencil className='size-4' />
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle>Edit status</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className='flex flex-col gap-4 py-2'>
            <div className='flex items-center gap-2'>
              <ColorPicker
                value={color}
                onChange={setColor}
                size='icon'
                className='h-8 w-8 shrink-0'
              />
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Status name'
                className='flex-1'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={!name.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </form>
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
  const [color, setColor] = useState('#94a3b8')

  const handleAdd = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed, color)
    setName('')
    setColor('#94a3b8')
  }

  return (
    <div className='flex items-center gap-2 rounded-md border border-dashed px-3 py-2'>
      <ColorPicker
        value={color}
        onChange={setColor}
        size='icon'
        className='h-8 w-8 shrink-0'
      />
      <Input
        placeholder='New status name...'
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        className='h-8 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0'
      />
      <Button
        type='button'
        size='icon'
        variant='outline'
        className='h-8 w-8 shrink-0'
        onClick={handleAdd}
        disabled={!name.trim() || disabled}
      >
        <Plus className='size-4' />
      </Button>
    </div>
  )
}
