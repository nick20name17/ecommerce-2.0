import { DragDropProvider, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/react'
import { useNavigate } from '@tanstack/react-router'
import { Plus, X } from 'lucide-react'
import { useRef, useState } from 'react'

import { InitialsAvatar } from '@/components/ds'
import { TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS } from '@/constants/task'
import type { TaskListItem, TaskStatus } from '@/api/task/schema'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { cn } from '@/lib/utils'

// ── Priority Icon (shared with list view) ───────────────────

const PRIORITY_BARS: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
}

function PriorityIcon({ priority, color, size = 12 }: { priority: string; color: string; size?: number }) {
  const filled = PRIORITY_BARS[priority] ?? 1
  const barWidth = 2.5
  const gap = 1.5
  const totalBars = 4

  return (
    <svg width={size} height={size} viewBox='0 0 16 16' fill='none' className='shrink-0'>
      {Array.from({ length: totalBars }).map((_, i) => {
        const x = 2 + i * (barWidth + gap)
        const barHeight = 4 + i * 2.5
        const y = 14 - barHeight
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            rx={0.75}
            fill={i < filled ? color : 'var(--border)'}
          />
        )
      })}
    </svg>
  )
}

// ── Helpers ──────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase() ?? '').join('')
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isOverdue(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return d < today
}

// ── Types ────────────────────────────────────────────────────

interface KanbanViewProps {
  tasks: TaskListItem[]
  statuses: TaskStatus[]
  onStatusChange: (task: TaskListItem, statusId: number) => void
  onCreate: (title: string, statusId: number) => void
}

// ── Kanban View ──────────────────────────────────────────────

export function KanbanView({ tasks, statuses, onStatusChange, onCreate }: KanbanViewProps) {
  const handleDragEnd = (event: any) => {
    const { source, target } = event.operation ?? {}
    if (!source || !target) return

    const taskId = source.data?.taskId as number | undefined
    const statusId = target.data?.statusId as number | undefined

    if (taskId == null || statusId == null) return

    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.status === statusId) return

    onStatusChange(task, statusId)
  }

  return (
    <DragDropProvider onDragEnd={handleDragEnd}>
      <div className='flex h-full gap-4 overflow-x-auto px-6 py-4'>
        {statuses.map((status) => {
          const columnTasks = tasks.filter((t) => t.status === status.id)
          return (
            <KanbanColumn
              key={status.id}
              status={status}
              tasks={columnTasks}
              onCreate={onCreate}
            />
          )
        })}
      </div>
      <DragOverlay>
        {(source) => {
          if (!source) return null
          const task = tasks.find((t) => t.id === source.data?.taskId)
          if (!task) return null
          return <KanbanCardContent task={task} isDragging />
        }}
      </DragOverlay>
    </DragDropProvider>
  )
}

// ── Column ───────────────────────────────────────────────────

function KanbanColumn({
  status,
  tasks,
  onCreate,
}: {
  status: TaskStatus
  tasks: TaskListItem[]
  onCreate: (title: string, statusId: number) => void
}) {
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const columnWidth = isMobile ? 'w-[280px]' : 'w-[300px]'
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const { ref, isDropTarget } = useDroppable({
    id: `column-${status.id}`,
    data: { statusId: status.id },
  })

  const handleCreate = () => {
    const trimmed = newTitle.trim()
    if (trimmed) {
      onCreate(trimmed, status.id)
      setNewTitle('')
      setIsCreating(false)
    }
  }

  const handleCancel = () => {
    setNewTitle('')
    setIsCreating(false)
  }

  return (
    <div
      className={cn(
        'flex shrink-0 flex-col rounded-lg',
        columnWidth
      )}
    >
      {/* Column header */}
      <div className='mb-3 flex items-center gap-2 px-1'>
        <div
          className='size-2.5 rounded-full'
          style={{ backgroundColor: status.color }}
        />
        <span className='text-[13px] font-semibold text-foreground'>
          {status.name}
        </span>
        <span className='text-[12px] tabular-nums text-text-tertiary'>
          {tasks.length}
        </span>
        <div className='flex-1' />
        <button
          type='button'
          className='rounded-[5px] p-0.5 text-text-tertiary transition-colors duration-[80ms] hover:bg-bg-hover hover:text-foreground'
          onClick={() => {
            setIsCreating(true)
            queueMicrotask(() => inputRef.current?.focus())
          }}
        >
          <Plus className='size-4' />
        </button>
      </div>

      {/* Droppable area */}
      <div
        ref={ref}
        className={cn(
          'flex flex-1 flex-col gap-2 rounded-lg border border-transparent p-1 transition-colors duration-150',
          isDropTarget && 'border-primary/30 bg-primary/5'
        )}
      >
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && !isCreating && (
          <div className={cn(
            'flex items-center justify-center rounded-lg border border-dashed py-8 text-[12px] text-text-tertiary transition-colors duration-150',
            isDropTarget ? 'border-primary/40 bg-primary/5' : 'border-border-light'
          )}>
            Drop tasks here
          </div>
        )}

        {/* Inline create */}
        {isCreating && (
          <div className='rounded-lg border border-primary/40 bg-background p-2.5'>
            <input
              ref={inputRef}
              type='text'
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate()
                if (e.key === 'Escape') handleCancel()
              }}
              placeholder='Task title'
              className='w-full bg-transparent text-[13px] font-medium text-foreground outline-none placeholder:text-text-tertiary'
            />
            <div className='mt-2 flex items-center justify-end gap-1.5'>
              <button
                type='button'
                className='rounded-[5px] p-1 text-text-tertiary transition-colors duration-[80ms] hover:bg-bg-hover hover:text-foreground'
                onClick={handleCancel}
              >
                <X className='size-3.5' />
              </button>
              <button
                type='button'
                className={cn(
                  'rounded-[6px] bg-primary px-2.5 py-1 text-[12px] font-medium text-primary-foreground transition-colors duration-[80ms]',
                  !newTitle.trim() ? 'opacity-40' : 'hover:opacity-90'
                )}
                disabled={!newTitle.trim()}
                onClick={handleCreate}
              >
                Create
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Draggable Card ───────────────────────────────────────────

function KanbanCard({ task }: { task: TaskListItem }) {
  const { ref, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { taskId: task.id },
  })

  return (
    <div
      ref={ref}
      className={cn(
        isDragging && 'opacity-30'
      )}
    >
      <KanbanCardContent task={task} />
    </div>
  )
}

// ── Card Content (shared between card & drag overlay) ────────

function KanbanCardContent({ task, isDragging }: { task: TaskListItem; isDragging?: boolean }) {
  const navigate = useNavigate()
  const priorityColor = TASK_PRIORITY_COLORS[task.priority]
  const priorityLabel = TASK_PRIORITY_LABELS[task.priority]
  const assigneeName = task.responsible_user_name
  const assigneeInitials = assigneeName ? getInitials(assigneeName) : null
  const dueDateLabel = task.due_date ? formatDate(task.due_date) : null
  const overdue = task.due_date ? isOverdue(task.due_date) : false

  return (
    <div
      className={cn(
        'cursor-pointer rounded-lg border border-border bg-background p-3 transition-all duration-100',
        isDragging
          ? 'rotate-[2deg] shadow-lg ring-1 ring-primary/20'
          : 'hover:border-border hover:shadow-sm'
      )}
      onClick={(e) => {
        if (isDragging) return
        e.stopPropagation()
        navigate({ to: '/todos-2/$taskId', params: { taskId: String(task.id) } })
      }}
      style={isDragging ? { width: 290 } : undefined}
    >
      {/* Title */}
      <p className='mb-2 text-[13px] font-medium leading-snug text-foreground line-clamp-2'>
        {task.title}
      </p>

      {/* Meta row */}
      <div className='flex items-center gap-2'>
        <span className='text-[11px] tabular-nums text-text-tertiary'>
          TSK-{task.id.toString().padStart(3, '0')}
        </span>

        <span className='inline-flex items-center gap-1'>
          <PriorityIcon priority={task.priority} color={priorityColor} size={12} />
          <span className='text-[11px] font-medium text-text-secondary'>{priorityLabel}</span>
        </span>

        <div className='flex-1' />

        {dueDateLabel && (
          <span className={cn(
            'text-[11px]',
            overdue ? 'font-medium text-destructive' : 'text-text-tertiary'
          )}>
            {dueDateLabel}
          </span>
        )}

        {assigneeInitials && (
          <InitialsAvatar initials={assigneeInitials} size={18} />
        )}
      </div>
    </div>
  )
}
