import { defaultPreset } from '@dnd-kit/dom'
import { OptimisticSortingPlugin, SortableKeyboardPlugin } from '@dnd-kit/dom/sortable'
import { DragDropProvider } from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { TASK_QUERY_KEYS, getTaskStatusesQuery } from '@/api/task/query'
import type { TaskStatus } from '@/api/task/schema'
import { taskService } from '@/api/task/service'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ColorPicker } from '@/components/ui/color-picker'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

// ── Constants & helpers ─────────────────────────────────────

const SORTABLE_PLUGINS = [...defaultPreset.plugins, OptimisticSortingPlugin, SortableKeyboardPlugin]

const arrayMove = <T,>(array: T[], from: number, to: number): T[] => {
  const next = array.slice()
  next.splice(to, 0, next.splice(from, 1)[0]!)
  return next
}

const defaultStatusColorHex = '#6B7280'

// ── Sortable status row ──────────────────────────────────────

const SortableStatusRow = ({
  status,
  index,
  projectId,
  onDelete,
}: {
  status: TaskStatus
  index: number
  projectId: number
  onDelete: () => void
}) => {
  const { ref, isDragging } = useSortable({
    id: status.id,
    index,
  })

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(status.name)
  const [editColor, setEditColor] = useState(status.color ?? defaultStatusColorHex)

  const updateMutation = useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) =>
      taskService.updateStatus(status.id, { name, color }),
    meta: {
      successMessage: 'Status updated',
      invalidatesQuery: TASK_QUERY_KEYS.statuses(projectId),
    },
    onSuccess: () => setEditing(false),
  })

  const handleSave = () => {
    const trimmed = editName.trim()
    if (!trimmed) return
    updateMutation.mutate({ name: trimmed, color: editColor })
  }

  const statusColor = status.color ?? defaultStatusColorHex

  if (editing) {
    return (
      <div
        ref={ref}
        className='flex items-center gap-3 border-b border-border-light bg-bg-hover/20 px-4 py-2.5'
      >
        <ColorPicker
          value={editColor}
          onChange={setEditColor}
          className='!size-4 !min-h-0 !min-w-0 !rounded-full !border-0 !p-0 !shadow-none ring-2 ring-border'
        />
        <input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') setEditing(false)
          }}
          className='h-7 min-w-0 flex-1 rounded-[6px] border border-border bg-background px-2.5 text-[13px] font-medium outline-none transition-[border-color,box-shadow] focus:border-primary focus:ring-2 focus:ring-primary/20'
          autoFocus
        />
        <div className='flex shrink-0 items-center gap-1.5'>
          <button
            type='button'
            className='inline-flex h-7 items-center rounded-[6px] px-2.5 text-[12px] font-medium text-text-tertiary transition-colors duration-[80ms] hover:bg-bg-hover hover:text-foreground'
            onClick={() => setEditing(false)}
          >
            Cancel
          </button>
          <button
            type='button'
            className='inline-flex h-7 items-center rounded-[6px] bg-primary px-3 text-[12px] font-medium text-primary-foreground transition-opacity duration-[80ms] hover:opacity-90 disabled:opacity-40'
            onClick={handleSave}
            disabled={updateMutation.isPending || !editName.trim()}
          >
            Save
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className={cn(
        'group/row flex cursor-grab items-center gap-3 border-b border-border-light px-4 py-2.5 transition-colors duration-75 active:cursor-grabbing',
        isDragging && 'z-10 rounded-[10px] border border-primary/20 bg-background shadow-lg shadow-primary/5',
        !isDragging && 'hover:bg-bg-hover/40',
      )}
    >
      {/* Color dot */}
      <div
        className='size-4 shrink-0 rounded-full'
        style={{ backgroundColor: statusColor }}
      />

      {/* Name */}
      <span className='min-w-0 flex-1 truncate text-[13px] font-medium text-foreground'>{status.name}</span>

      {/* Actions — appear on hover */}
      <div className='flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-75 group-hover/row:opacity-100'>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type='button'
              className='inline-flex size-7 items-center justify-center rounded-[6px] text-text-quaternary transition-colors duration-75 hover:bg-bg-active hover:text-foreground'
              onClick={(e) => {
                e.stopPropagation()
                setEditName(status.name)
                setEditColor(status.color ?? defaultStatusColorHex)
                setEditing(true)
              }}
            >
              <Pencil className='size-3.5' />
            </button>
          </TooltipTrigger>
          <TooltipContent>Edit</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type='button'
              className='inline-flex size-7 items-center justify-center rounded-[6px] text-text-quaternary transition-colors duration-75 hover:bg-destructive/10 hover:text-destructive'
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
            >
              <Trash2 className='size-3.5' />
            </button>
          </TooltipTrigger>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

// ── Tasks Section ───────────────────────────────────────────

export const TasksSection = ({ projectId }: { projectId: number }) => {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery(getTaskStatusesQuery(projectId))
  const statuses = data?.results ?? []

  const [orderedStatuses, setOrderedStatuses] = useState<TaskStatus[]>([])
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(defaultStatusColorHex)
  const [deleteTarget, setDeleteTarget] = useState<TaskStatus | null>(null)

  const statusKey = statuses.map((s) => `${s.id}:${s.name}:${s.color}`).join(',')
  useEffect(() => {
    setOrderedStatuses([...statuses].sort((a, b) => a.order - b.order))
  }, [statusKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const reorderMutation = useMutation({
    mutationFn: ({ id, order }: { id: number; order: number }) =>
      taskService.updateStatus(id, { order })
  })

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; color: string }) =>
      taskService.createStatus({
        ...payload,
        project: projectId,
        order: orderedStatuses.length + 1
      }),
    meta: { invalidatesQuery: TASK_QUERY_KEYS.statuses(projectId) }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => taskService.deleteStatus(id),
    onSuccess: (_, id) => {
      setOrderedStatuses((prev) => prev.filter((s) => s.id !== id))
      setDeleteTarget(null)
    },
    meta: { invalidatesQuery: TASK_QUERY_KEYS.statuses(projectId) }
  })

  const handleAddStatus = () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    createMutation.mutate({ name: trimmed, color: newColor })
    setNewName('')
    setNewColor(defaultStatusColorHex)
  }

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

    // Only custom (non-default) statuses are in the sortable — indices are relative to that sub-array
    const nonDefault = orderedStatuses.filter((s) => !s.is_default)
    const defaults = orderedStatuses.filter((s) => s.is_default)

    const fromIndex = useSortableIndices
      ? sortableSource.initialIndex
      : nonDefault.findIndex((s) => s.id === Number(source?.id))
    const toIndex = useSortableIndices
      ? sortableSource.index
      : target != null
        ? nonDefault.findIndex((s) => s.id === Number(target.id))
        : -1

    if (
      typeof fromIndex !== 'number' ||
      typeof toIndex !== 'number' ||
      fromIndex === -1 ||
      toIndex === -1 ||
      fromIndex === toIndex
    )
      return

    const next = arrayMove(nonDefault, fromIndex, toIndex)
    setOrderedStatuses([...defaults, ...next])

    Promise.all(
      next.map((status, i) => reorderMutation.mutateAsync({ id: status.id as number, order: i + 1 }))
    )
      .then(() => {
        queryClient.invalidateQueries({
          queryKey: TASK_QUERY_KEYS.statuses(projectId)
        })
        toast.success('Status order saved')
      })
      .catch(() => {})
  }

  // Split for rendering: defaults (non-done) at top, custom (sortable) in middle, "Done" pinned at bottom
  const defaultStatuses = orderedStatuses.filter((s) => s.is_default && s.name.toLowerCase() !== 'done')
  const doneStatus = orderedStatuses.find((s) => s.is_default && s.name.toLowerCase() === 'done')
  const customStatuses = orderedStatuses.filter((s) => !s.is_default)

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='flex-1 overflow-auto'>
        <div className='mx-auto max-w-[560px] px-8 py-8'>
          {isLoading ? (
            <div className='overflow-hidden rounded-[10px] border border-border'>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={cn('flex items-center gap-3 px-4 py-3', i < 5 && 'border-b border-border-light')}>
                  <Skeleton className='size-4 rounded-full' />
                  <Skeleton className='h-4 w-32' />
                </div>
              ))}
            </div>
          ) : (
            <div className='overflow-hidden rounded-[10px] border border-border'>
              {/* Add new status row — at the top */}
              <div className='flex items-center gap-3 border-b border-dashed border-border-light px-4 py-2'>
                <ColorPicker
                  value={newColor}
                  onChange={setNewColor}
                  className='!size-4 !min-h-0 !min-w-0 !rounded-full !border-0 !p-0 !shadow-none ring-2 ring-border'
                />
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddStatus()}
                  placeholder='Add a status...'
                  className='h-7 min-w-0 flex-1 bg-transparent text-[13px] font-medium outline-none placeholder:text-text-quaternary'
                />
                {newName.trim() && (
                  <button
                    type='button'
                    className='inline-flex h-7 shrink-0 items-center gap-1.5 rounded-[6px] bg-primary px-3 text-[12px] font-medium text-primary-foreground transition-opacity duration-[80ms] hover:opacity-90 disabled:opacity-40'
                    disabled={createMutation.isPending}
                    onClick={handleAddStatus}
                  >
                    {createMutation.isPending ? 'Adding...' : 'Add'}
                  </button>
                )}
              </div>

              {/* Default statuses — static, not draggable */}
              {defaultStatuses.map((status) => (
                <div
                  key={status.id}
                  className='flex items-center gap-3 border-b border-border-light px-4 py-2.5'
                >
                  <div
                    className='size-4 shrink-0 rounded-full'
                    style={{ backgroundColor: status.color ?? defaultStatusColorHex }}
                  />
                  <span className='min-w-0 flex-1 truncate text-[13px] font-medium text-foreground'>
                    {status.name}
                  </span>
                  <span className='shrink-0 rounded-[5px] bg-bg-secondary/80 px-2 py-[3px] text-[11px] font-medium text-text-quaternary'>
                    Default
                  </span>
                </div>
              ))}

              {/* Custom statuses — sortable, whole row is draggable */}
              {customStatuses.length > 0 && (
                <DragDropProvider plugins={SORTABLE_PLUGINS} onDragEnd={handleDragEnd}>
                  <div>
                    {customStatuses.map((status, index) => (
                      <SortableStatusRow
                        key={status.id}
                        status={status}
                        index={index}
                        projectId={projectId}
                        onDelete={() => setDeleteTarget(status)}
                      />
                    ))}
                  </div>
                </DragDropProvider>
              )}

              {/* Done status — always pinned at the bottom */}
              {doneStatus && (
                <div className='flex items-center gap-3 px-4 py-2.5'>
                  <div
                    className='size-4 shrink-0 rounded-full'
                    style={{ backgroundColor: doneStatus.color ?? defaultStatusColorHex }}
                  />
                  <span className='min-w-0 flex-1 truncate text-[13px] font-medium text-foreground'>
                    {doneStatus.name}
                  </span>
                  <span className='shrink-0 rounded-[5px] bg-bg-secondary/80 px-2 py-[3px] text-[11px] font-medium text-text-quaternary'>
                    Default
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className='bg-destructive/10 text-destructive'>
              <TriangleAlert />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.name}&rdquo;? Tasks using this status will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              isPending={deleteMutation.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
