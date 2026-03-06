import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Calendar,
  Check,
  ChevronDown,
  Columns3,
  List,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { addDays, format, nextFriday, nextMonday } from 'date-fns'
import { useRef, useState } from 'react'

import { KanbanView } from './-components/kanban-view'
import { TASK_QUERY_KEYS, getTasksQuery, getTaskStatusesQuery } from '@/api/task/query'
import type { TaskListItem, TaskParams, TaskStatus } from '@/api/task/schema'
import { taskService } from '@/api/task/service'
import { UserCombobox } from '@/components/common/user-combobox/user-combobox'
import { InitialsAvatar, StatusIcon } from '@/components/ds'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TASK_PRIORITY, TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS } from '@/constants/task'
import type { TaskPriority } from '@/constants/task'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import type { Breakpoint } from '@/hooks/use-breakpoint'
import { useProjectId } from '@/hooks/use-project-id'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/todos-2/')({
  component: Todos2Page,
  head: () => ({
    meta: [{ title: "To-Do's" }]
  })
})

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

// ── Page Component ───────────────────────────────────────────

function Todos2Page() {
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const [projectId] = useProjectId()

  const [search, setSearch] = useState('')
  const [view, setView] = useState<'list' | 'board'>('list')
  const [activeStatuses, setActiveStatuses] = useState<Set<number>>(new Set())
  const [activePriorities, setActivePriorities] = useState<Set<TaskPriority>>(new Set())
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [showCreate, setShowCreate] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<TaskListItem | null>(null)

  // Fetch statuses
  const { data: statusesData } = useQuery(getTaskStatusesQuery(projectId ?? null))
  const statuses = statusesData?.results ?? []

  // Fetch tasks (no server-side filter for multi-select — filter client-side)
  const params: TaskParams = {
    search: search || undefined,
    project_id: projectId ?? undefined,
    limit: 200,
  }
  const { data: tasksData, isLoading } = useQuery(getTasksQuery(params))
  const allTasks = tasksData?.results ?? []

  // Client-side multi-select filtering
  const tasks = allTasks.filter((t) => {
    if (activeStatuses.size > 0 && !activeStatuses.has(t.status)) return false
    if (activePriorities.size > 0 && !activePriorities.has(t.priority)) return false
    return true
  })

  const hasFilters = activeStatuses.size > 0 || activePriorities.size > 0

  const toggleStatus = (id: number) => {
    setActiveStatuses((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const togglePriority = (p: TaskPriority) => {
    setActivePriorities((prev) => {
      const next = new Set(prev)
      if (next.has(p)) next.delete(p)
      else next.add(p)
      return next
    })
  }

  const clearAllFilters = () => {
    setActiveStatuses(new Set())
    setActivePriorities(new Set())
  }

  // Group tasks by status in the order defined by statuses
  const groupedTasks = statuses.map((status) => ({
    status,
    tasks: tasks.filter((t) => t.status === status.id),
  })).filter((g) => g.tasks.length > 0)

  // Status change mutation with optimistic update
  const queryClient = useQueryClient()
  const statusChangeMutation = useMutation({
    mutationFn: ({ taskId, statusId }: { taskId: number; statusId: number }) =>
      taskService.update(taskId, { status: statusId }),
    onMutate: async ({ taskId, statusId }) => {
      await queryClient.cancelQueries({ queryKey: TASK_QUERY_KEYS.lists() })
      const queryKey = TASK_QUERY_KEYS.list(params)
      const previous = queryClient.getQueryData(queryKey)
      const newStatus = statuses.find((s) => s.id === statusId)
      queryClient.setQueryData(
        queryKey,
        (old: { count: number; results: TaskListItem[] } | undefined) => {
          if (!old) return old
          return {
            ...old,
            results: old.results.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    status: statusId,
                    status_name: newStatus?.name ?? t.status_name,
                    status_color: newStatus?.color ?? t.status_color,
                  }
                : t
            ),
          }
        }
      )
      return { previous, queryKey }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.queryKey, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.lists() })
    },
    meta: { successMessage: 'Status updated' }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => taskService.delete(id),
    meta: {
      successMessage: 'Task deleted',
      invalidatesQuery: TASK_QUERY_KEYS.lists()
    }
  })

  // Quick-create mutation (kanban) with optimistic update
  const resolvedProjectId = projectId ?? allTasks[0]?.project ?? undefined
  const queryKey = TASK_QUERY_KEYS.list(params)
  const quickCreateMutation = useMutation({
    mutationFn: ({ title, statusId }: { title: string; statusId: number }) =>
      taskService.create({
        title,
        status: statusId,
        priority: TASK_PRIORITY.medium,
        project: resolvedProjectId,
      }),
    onMutate: async ({ title, statusId }) => {
      await queryClient.cancelQueries({ queryKey: TASK_QUERY_KEYS.lists() })
      const previous = queryClient.getQueryData(queryKey)
      const newStatus = statuses.find((s) => s.id === statusId)
      const optimisticTask: TaskListItem = {
        id: -Date.now(),
        project: resolvedProjectId ?? 0,
        title,
        status: statusId,
        status_name: newStatus?.name ?? '',
        status_color: newStatus?.color ?? '',
        priority: TASK_PRIORITY.medium,
        due_date: null,
        author: 0,
        author_name: '',
        responsible_user: null,
        responsible_user_name: null,
        attachment_count: '0',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      queryClient.setQueryData(
        queryKey,
        (old: { count: number; results: TaskListItem[] } | undefined) => {
          if (!old) return old
          return { ...old, count: old.count + 1, results: [optimisticTask, ...old.results] }
        }
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.lists() })
    },
    meta: { successMessage: 'Task created' }
  })

  const handleStatusChange = (task: TaskListItem, statusId: number) =>
    statusChangeMutation.mutate({ taskId: task.id, statusId })

  const handleQuickCreate = (title: string, statusId: number) =>
    quickCreateMutation.mutate({ title, statusId })

  const handleDelete = (task: TaskListItem) => {
    setTaskToDelete(task)
  }

  const confirmDelete = () => {
    if (taskToDelete) {
      deleteMutation.mutate(taskToDelete.id)
      setTaskToDelete(null)
    }
  }

  const toggleGroup = (statusName: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(statusName)) {
        next.delete(statusName)
      } else {
        next.add(statusName)
      }
      return next
    })
  }

  return (
    <div className='-m-4 flex h-[calc(100%+2rem)] flex-col overflow-hidden'>
      {/* ── Header ── */}
      <header
        className={cn(
          'flex shrink-0 items-center gap-3 border-b border-border',
          isMobile ? 'flex-wrap px-5 py-2' : 'px-8 py-2'
        )}
      >
        <div className='flex items-center gap-2'>
          {/* Linear-style issues icon */}
          <svg width='18' height='18' viewBox='0 0 16 16' fill='none' className='shrink-0 text-text-secondary'>
            <rect x='1' y='2.5' width='14' height='1.5' rx='0.75' fill='currentColor' />
            <rect x='1' y='7.25' width='10' height='1.5' rx='0.75' fill='currentColor' />
            <rect x='1' y='12' width='7' height='1.5' rx='0.75' fill='currentColor' />
          </svg>
          <h1 className='text-[16px] font-semibold tracking-[-0.02em]'>To-Do&apos;s</h1>
        </div>
        {/* View toggle */}
        <div className='flex items-center rounded-[6px] border border-border bg-background p-0.5'>
          <button
            type='button'
            className={cn(
              'inline-flex items-center gap-1 rounded-[4px] px-2 py-1 text-[12px] font-medium transition-colors duration-[80ms]',
              view === 'list' ? 'bg-bg-active text-foreground' : 'text-text-tertiary hover:text-text-secondary'
            )}
            onClick={() => setView('list')}
          >
            <List className='size-3.5' />
            {!isMobile && 'List'}
          </button>
          <button
            type='button'
            className={cn(
              'inline-flex items-center gap-1 rounded-[4px] px-2 py-1 text-[12px] font-medium transition-colors duration-[80ms]',
              view === 'board' ? 'bg-bg-active text-foreground' : 'text-text-tertiary hover:text-text-secondary'
            )}
            onClick={() => setView('board')}
          >
            <Columns3 className='size-3.5' />
            {!isMobile && 'Board'}
          </button>
        </div>
        <div className='flex flex-1 items-center gap-1.5 rounded-[6px] border border-border bg-background px-2.5 py-1.5'>
          <Search className='size-3.5 shrink-0 text-text-tertiary' />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search tasks...'
            className='flex-1 bg-transparent text-[13px] outline-none placeholder:text-text-tertiary'
          />
        </div>
        <div className='flex items-center gap-2'>
          {/* Status filter */}
          <FilterPopover
            label='Status'
            active={activeStatuses.size > 0}
            icon={<StatusIcon status='' color='currentColor' size={14} />}
          >
            {statuses.map((s) => {
              const selected = activeStatuses.has(s.id)
              return (
                <button
                  key={s.id}
                  type='button'
                  className={cn(
                    'flex w-full items-center gap-2 rounded-[6px] px-2 py-[3px] text-left text-[13px] font-medium',
                    'transition-colors duration-[80ms] hover:bg-bg-hover'
                  )}
                  onClick={() => toggleStatus(s.id)}
                >
                  <div className={cn(
                    'flex size-3.5 items-center justify-center rounded-[3px] border transition-colors duration-[80ms]',
                    selected ? 'border-primary bg-primary' : 'border-border'
                  )}>
                    {selected && <Check className='size-2.5 text-primary-foreground' strokeWidth={3} />}
                  </div>
                  <StatusIcon status={s.name} color={s.color} size={14} />
                  <span className='flex-1'>{s.name}</span>
                </button>
              )
            })}
          </FilterPopover>

          {/* Priority filter */}
          <FilterPopover
            label='Priority'
            active={activePriorities.size > 0}
            icon={<PriorityIcon priority='medium' color='currentColor' size={14} />}
          >
            {Object.entries(TASK_PRIORITY_LABELS).map(([key, label]) => {
              const selected = activePriorities.has(key as TaskPriority)
              return (
                <button
                  key={key}
                  type='button'
                  className={cn(
                    'flex w-full items-center gap-2 rounded-[6px] px-2 py-[3px] text-left text-[13px] font-medium',
                    'transition-colors duration-[80ms] hover:bg-bg-hover'
                  )}
                  onClick={() => togglePriority(key as TaskPriority)}
                >
                  <div className={cn(
                    'flex size-3.5 items-center justify-center rounded-[3px] border transition-colors duration-[80ms]',
                    selected ? 'border-primary bg-primary' : 'border-border'
                  )}>
                    {selected && <Check className='size-2.5 text-primary-foreground' strokeWidth={3} />}
                  </div>
                  <PriorityIcon priority={key} color={TASK_PRIORITY_COLORS[key as TaskPriority]} size={14} />
                  <span className='flex-1'>{label}</span>
                </button>
              )
            })}
          </FilterPopover>

          <button
            type='button'
            className='inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-primary px-3 text-[13px] font-medium text-primary-foreground transition-colors duration-[80ms] hover:opacity-90'
            onClick={() => setShowCreate(true)}
          >
            <Plus className='size-4' />
            New Task
          </button>
        </div>
      </header>

      {/* Active filter chips */}
      {hasFilters && (
        <div className={cn('flex shrink-0 flex-wrap items-center gap-1.5 border-b border-border py-1.5', isMobile ? 'px-5' : 'px-8')}>
          <button
            type='button'
            className='text-[12px] font-medium text-text-tertiary transition-colors duration-[80ms] hover:text-foreground'
            onClick={clearAllFilters}
          >
            Clear
          </button>
          {Array.from(activeStatuses).map((id) => {
            const s = statuses.find((st) => st.id === id)
            if (!s) return null
            return (
              <FilterChip key={`status-${id}`} onRemove={() => toggleStatus(id)}>
                <span className='text-text-tertiary'>Status is</span>
                <StatusIcon status={s.name} color={s.color} size={12} />
                {s.name}
              </FilterChip>
            )
          })}
          {Array.from(activePriorities).map((p) => (
            <FilterChip key={`priority-${p}`} onRemove={() => togglePriority(p)}>
              <span className='text-text-tertiary'>Priority is</span>
              <PriorityIcon priority={p} color={TASK_PRIORITY_COLORS[p]} size={12} />
              {TASK_PRIORITY_LABELS[p]}
            </FilterChip>
          ))}
        </div>
      )}

      {/* Content: List or Board view */}
      {view === 'board' ? (
        <div className='flex-1 overflow-hidden'>
          {isLoading ? (
            <div className='flex h-full gap-4 px-6 py-4'>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className='w-[300px] shrink-0'>
                  <div className='mb-3 flex items-center gap-2 px-1'>
                    <div className='size-2.5 animate-pulse rounded-full bg-border' />
                    <div className='h-3.5 w-20 animate-pulse rounded bg-border' />
                  </div>
                  <div className='space-y-2'>
                    {Array.from({ length: 3 - i }).map((_, j) => (
                      <div key={j} className='h-20 animate-pulse rounded-lg bg-border/50' />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <KanbanView
              tasks={tasks}
              statuses={statuses}
              onStatusChange={handleStatusChange}
              onCreate={handleQuickCreate}
            />
          )}
        </div>
      ) : (
        <div className='flex-1 overflow-y-auto'>
          {isLoading ? (
            <div className='space-y-0'>
              {Array.from({ length: 3 }).map((_, gi) => (
                <div key={gi}>
                  <div className={cn('flex items-center gap-2 border-b border-border bg-bg-secondary py-1.5', isMobile ? 'px-3.5' : 'px-8')}>
                    <div className='size-3.5 animate-pulse rounded-full bg-border' />
                    <div className='h-3.5 w-20 animate-pulse rounded bg-border' />
                  </div>
                  {Array.from({ length: gi === 0 ? 3 : 2 }).map((_, ti) => (
                    <div key={ti} className={cn('flex items-center gap-3 border-b border-border-light py-2.5', isMobile ? 'px-3.5' : 'px-8')}>
                      <div className='size-3.5 animate-pulse rounded-full bg-border' />
                      <div className='h-3 w-16 animate-pulse rounded bg-border' />
                      <div className='h-3 flex-1 animate-pulse rounded bg-border' />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : groupedTasks.length === 0 ? (
            <EmptyState />
          ) : (
            groupedTasks.map(({ status, tasks: groupTasks }) => {
              const collapsed = collapsedGroups.has(status.name)
              return (
                <div key={status.id}>
                  {/* Status Group Header */}
                  <button
                    type='button'
                    className={cn('flex w-full items-center gap-2 border-b border-border bg-bg-secondary py-1.5 transition-colors duration-[80ms] hover:bg-bg-hover', isMobile ? 'px-3.5' : 'px-8')}
                    onClick={() => toggleGroup(status.name)}
                  >
                    <StatusIcon status={status.name} color={status.color} size={14} />
                    <span className='text-[13px] font-semibold text-foreground'>
                      {status.name}
                    </span>
                    <span className='text-[12px] tabular-nums text-text-tertiary'>
                      {groupTasks.length}
                    </span>
                    <ChevronDown
                      className={cn(
                        'ml-auto size-3.5 text-text-tertiary transition-transform duration-100',
                        collapsed && '-rotate-90'
                      )}
                    />
                  </button>

                  {/* Tasks in this group */}
                  {!collapsed && (
                    <div>
                      {groupTasks.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          statuses={statuses}
                          bp={bp}
                          onStatusChange={handleStatusChange}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Command bar create */}
      {showCreate && (
        <CommandBarCreate
          statuses={statuses}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* Delete confirmation */}
      {taskToDelete && (
        <>
          <div className='fixed inset-0 z-40 bg-black/40' onClick={() => setTaskToDelete(null)} />
          <div className='fixed inset-0 z-50 flex items-center justify-center px-4'>
            <div className='w-full max-w-[400px] rounded-[12px] border border-border bg-background p-6' style={{ boxShadow: '0 16px 70px rgba(0,0,0,.2)' }}>
              <h3 className='mb-2 text-[15px] font-semibold'>Delete task</h3>
              <p className='mb-5 text-[13px] text-text-secondary'>
                Are you sure you want to delete &ldquo;{taskToDelete.title}&rdquo;? This action cannot be undone.
              </p>
              <div className='flex justify-end gap-2'>
                <button
                  type='button'
                  className='rounded-[6px] border border-border px-3 py-1.5 text-[13px] font-medium transition-colors duration-[80ms] hover:bg-bg-hover'
                  onClick={() => setTaskToDelete(null)}
                >
                  Cancel
                </button>
                <button
                  type='button'
                  className='rounded-[6px] bg-destructive px-3 py-1.5 text-[13px] font-medium text-white transition-colors duration-[80ms] hover:opacity-90'
                  onClick={confirmDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      {tasks.length > 0 && (
        <div className={cn('shrink-0 border-t border-border py-2', isMobile ? 'px-5' : 'px-8')}>
          <p className='text-[12px] tabular-nums text-text-tertiary'>
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  )
}

// ── Task Row ─────────────────────────────────────────────────

function TaskRow({
  task,
  statuses,
  bp,
  onStatusChange,
  onDelete,
}: {
  task: TaskListItem
  statuses: TaskStatus[]
  bp: Breakpoint
  onStatusChange: (task: TaskListItem, statusId: number) => void
  onDelete: (task: TaskListItem) => void
}) {
  const navigate = useNavigate()
  const priorityColor = TASK_PRIORITY_COLORS[task.priority]
  const priorityLabel = TASK_PRIORITY_LABELS[task.priority]
  const assigneeName = task.responsible_user_name
  const assigneeInitials = assigneeName ? getInitials(assigneeName) : null
  const assigneeFirst = assigneeName?.split(' ')[0]
  const dueDateLabel = task.due_date ? formatDate(task.due_date) : null
  const overdue = task.due_date ? isOverdue(task.due_date) : false
  const isMobile = bp === 'mobile'
  const isTablet = bp === 'tablet'

  const goToDetail = () => {
    navigate({ to: '/todos-2/$taskId', params: { taskId: String(task.id) } })
  }

  if (isMobile) {
    return (
      <div className='cursor-pointer border-b border-border-light px-3.5 py-3 transition-colors duration-100 hover:bg-bg-hover' onClick={goToDetail}>
        <div className='mb-2 flex items-start gap-2.5'>
          <StatusChangeButton task={task} statuses={statuses} size={14} onStatusChange={onStatusChange} />
          <span className='min-w-0 flex-1 text-sm font-medium leading-snug text-foreground'>
            {task.title}
          </span>
        </div>
        <div className='flex flex-wrap items-center gap-2 pl-[24px]'>
          <span className='text-[11px] tabular-nums text-text-tertiary'>
            TSK-{task.id.toString().padStart(3, '0')}
          </span>
          <span className='inline-flex items-center gap-1'>
            <PriorityIcon priority={task.priority} color={priorityColor} size={12} />
            <span className='text-[11px] font-medium text-text-secondary'>{priorityLabel}</span>
          </span>
          {assigneeInitials && (
            <span className='inline-flex items-center gap-1'>
              <InitialsAvatar initials={assigneeInitials} size={16} />
              <span className='text-[11px] text-text-secondary'>{assigneeFirst}</span>
            </span>
          )}
          {dueDateLabel && (
            <span className={cn('text-[11px]', overdue ? 'font-medium text-destructive' : 'text-text-tertiary')}>
              {dueDateLabel}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group/row flex cursor-pointer items-center border-b border-border-light text-sm text-foreground transition-colors duration-100 hover:bg-bg-hover',
        isTablet ? 'gap-4 px-5 py-2' : 'gap-6 px-8 py-2'
      )}
      onClick={goToDetail}
    >
      {/* Task: status icon (clickable) + ID + title */}
      <div className='flex min-w-0 flex-1 items-center gap-2'>
        <StatusChangeButton task={task} statuses={statuses} size={14} onStatusChange={onStatusChange} />
        <span className='shrink-0 text-[13px] tabular-nums text-text-tertiary'>
          TSK-{task.id.toString().padStart(3, '0')}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className='truncate font-medium'>{task.title}</span>
          </TooltipTrigger>
          <TooltipContent side='top'>{task.title}</TooltipContent>
        </Tooltip>
      </div>

      {/* Right-aligned metadata */}
      <div className='flex shrink-0 items-center gap-5'>
        {/* Priority */}
        <div className='flex w-[90px] items-center gap-1.5'>
          <PriorityIcon priority={task.priority} color={priorityColor} size={14} />
          <span className='text-sm font-medium'>{priorityLabel}</span>
        </div>

        {/* Assignee */}
        <div className='flex w-[130px] min-w-0 items-center gap-1.5'>
          {assigneeInitials ? (
            <>
              <InitialsAvatar initials={assigneeInitials} size={24} />
              <span className='truncate text-sm text-text-secondary'>{assigneeFirst}</span>
            </>
          ) : (
            <span className='text-sm text-text-tertiary'>&mdash;</span>
          )}
        </div>

        {/* Due date */}
        <div className='w-[80px] text-sm text-text-tertiary'>
          {dueDateLabel ? (
            <span className={cn(overdue && 'font-medium text-destructive')}>
              {dueDateLabel}
            </span>
          ) : (
            <span>&mdash;</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div
        className='flex justify-center opacity-0 transition-opacity group-hover/row:opacity-100'
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role='group'
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type='button'
              className='inline-flex size-6 items-center justify-center rounded-[6px] text-text-tertiary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground'
              aria-label='Task actions'
            >
              <svg width='15' height='15' viewBox='0 0 15 15' fill='none'>
                <circle cx='3' cy='7.5' r='1.2' fill='currentColor' />
                <circle cx='7.5' cy='7.5' r='1.2' fill='currentColor' />
                <circle cx='12' cy='7.5' r='1.2' fill='currentColor' />
              </svg>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align='end'
            className='w-[180px] rounded-[8px] p-1'
            style={{ boxShadow: 'var(--dropdown-shadow)' }}
          >
            <DropdownMenuItem
              variant='destructive'
              className='cursor-pointer gap-2 rounded-[6px] px-2 py-1 text-[13px]'
              onClick={() => onDelete(task)}
            >
              <Trash2 className='size-3.5' />
              Delete task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// ── Status Change Button ─────────────────────────────────────

function StatusChangeButton({
  task,
  statuses,
  size,
  onStatusChange,
}: {
  task: TaskListItem
  statuses: TaskStatus[]
  size: number
  onStatusChange: (task: TaskListItem, statusId: number) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type='button'
          className='shrink-0 rounded-[4px] transition-opacity duration-[80ms] hover:opacity-70'
          onClick={(e) => e.stopPropagation()}
          aria-label='Change status'
        >
          <StatusIcon status={task.status_name} color={task.status_color} size={size} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className='w-[180px] overflow-hidden rounded-[8px] border-border gap-0 p-1'
        align='start'
        style={{ boxShadow: 'var(--dropdown-shadow)' }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {statuses.map((s) => {
          const selected = s.id === task.status
          return (
            <button
              key={s.id}
              type='button'
              className={cn(
                'flex w-full items-center gap-2 rounded-[6px] px-2 py-1 text-left text-[13px] font-medium',
                'transition-colors duration-[80ms]',
                selected ? 'bg-accent-bg' : 'hover:bg-bg-hover'
              )}
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                onStatusChange(task, s.id)
              }}
            >
              <StatusIcon status={s.name} color={s.color} size={14} />
              <span className='flex-1'>{s.name}</span>
            </button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}

// ── Priority Icon (bar levels) ───────────────────────────────

const PRIORITY_BARS: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
}

function PriorityIcon({ priority, color, size = 14 }: { priority: string; color: string; size?: number }) {
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

// ── Create Flow: Command Bar ────────────────────────────────

const CMD_DATE_PRESETS = [
  { label: 'Today', getDate: () => new Date() },
  { label: 'Tomorrow', getDate: () => addDays(new Date(), 1) },
  { label: 'Next Monday', getDate: () => nextMonday(new Date()) },
  { label: 'Next Friday', getDate: () => nextFriday(new Date()) },
  { label: 'In 2 weeks', getDate: () => addDays(new Date(), 14) },
] as const

function CommandBarCreate({
  statuses,
  onClose,
}: {
  statuses: TaskStatus[]
  onClose: () => void
}) {
  const [projectId] = useProjectId()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | null>(
    () => statuses.find((s) => s.is_default) ?? statuses[0] ?? null
  )
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority>(TASK_PRIORITY.medium)
  const [selectedAssignee, setSelectedAssignee] = useState<number | null>(null)
  const [selectedDueDate, setSelectedDueDate] = useState<string | null>(null)
  const [statusOpen, setStatusOpen] = useState(false)
  const [priorityOpen, setPriorityOpen] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  const createMutation = useMutation({
    mutationFn: () =>
      taskService.create({
        title: title.trim(),
        description: description.trim() || undefined,
        status: selectedStatus!.id,
        priority: selectedPriority,
        project: projectId ?? undefined,
        responsible_user: selectedAssignee,
        due_date: selectedDueDate,
      }),
    meta: {
      successMessage: 'Task created',
      invalidatesQuery: TASK_QUERY_KEYS.lists()
    },
    onSuccess: () => {
      onClose()
    },
  })

  const canSubmit = title.trim().length > 0 && selectedStatus != null

  const handleSubmit = () => {
    if (canSubmit && !createMutation.isPending) {
      createMutation.mutate()
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className='fixed inset-0 z-40 bg-black/40 transition-opacity duration-150'
        onClick={onClose}
      />
      {/* Command bar */}
      <div className='fixed inset-x-0 top-[20%] z-50 mx-auto w-full max-w-[580px] px-4'>
        <div
          className='overflow-hidden rounded-[12px] border border-border bg-background animate-in zoom-in-95 fade-in duration-150'
          style={{ boxShadow: '0 16px 70px rgba(0,0,0,.2)' }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { e.stopPropagation(); onClose() }
            if (e.key === 'Enter' && !e.shiftKey && e.target instanceof HTMLInputElement) {
              e.preventDefault()
              handleSubmit()
            }
          }}
        >
          {/* Input area */}
          <div className='px-5 pt-4 pb-3'>
            <div className='flex items-center gap-3'>
              <Plus className='size-5 shrink-0 text-primary' />
              <input
                ref={titleRef}
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='What needs to be done?'
                className='flex-1 text-[15px] font-medium text-foreground outline-none placeholder:text-text-tertiary'
                onKeyDown={(e) => {
                  if (e.key === 'Escape') onClose()
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
              />
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Add description...'
              rows={2}
              className='mt-2 ml-8 w-[calc(100%-2rem)] resize-none bg-transparent text-[13px] text-text-secondary outline-none placeholder:text-text-tertiary'
            />
          </div>

          {/* Divider */}
          <div className='border-t border-border' />

          {/* Quick-set fields */}
          <div className='flex flex-wrap items-center gap-2 px-5 py-3'>
            {/* Status */}
            <Popover open={statusOpen} onOpenChange={setStatusOpen}>
              <PopoverTrigger asChild>
                <button
                  type='button'
                  className='inline-flex items-center gap-1.5 rounded-[6px] bg-bg-secondary px-2.5 py-1.5 text-[12px] font-medium text-foreground transition-colors duration-[80ms] hover:bg-bg-hover'
                >
                  {selectedStatus && <StatusIcon status={selectedStatus.name} color={selectedStatus.color} size={12} />}
                  {selectedStatus?.name ?? 'Status'}
                  <ChevronDown className='size-3 text-text-tertiary' />
                </button>
              </PopoverTrigger>
              <PopoverContent className='w-[180px] overflow-hidden rounded-[8px] border-border gap-0 p-1' align='start' style={{ boxShadow: 'var(--dropdown-shadow)' }}>
                {statuses.map((s) => (
                  <button
                    key={s.id}
                    type='button'
                    className={cn(
                      'flex w-full items-center gap-2 rounded-[6px] px-2 py-1 text-left text-[13px] font-medium',
                      'transition-colors duration-[80ms]',
                      selectedStatus?.id === s.id ? 'bg-accent-bg' : 'hover:bg-bg-hover'
                    )}
                    onClick={() => { setSelectedStatus(s); setStatusOpen(false) }}
                  >
                    <StatusIcon status={s.name} color={s.color} size={14} />
                    <span className='flex-1'>{s.name}</span>
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            {/* Priority */}
            <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
              <PopoverTrigger asChild>
                <button
                  type='button'
                  className='inline-flex items-center gap-1.5 rounded-[6px] bg-bg-secondary px-2.5 py-1.5 text-[12px] font-medium text-foreground transition-colors duration-[80ms] hover:bg-bg-hover'
                >
                  <PriorityIcon priority={selectedPriority} color={TASK_PRIORITY_COLORS[selectedPriority]} size={12} />
                  {TASK_PRIORITY_LABELS[selectedPriority]}
                  <ChevronDown className='size-3 text-text-tertiary' />
                </button>
              </PopoverTrigger>
              <PopoverContent className='w-[180px] overflow-hidden rounded-[8px] border-border gap-0 p-1' align='start' style={{ boxShadow: 'var(--dropdown-shadow)' }}>
                {Object.entries(TASK_PRIORITY_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    type='button'
                    className={cn(
                      'flex w-full items-center gap-2 rounded-[6px] px-2 py-1 text-left text-[13px] font-medium',
                      'transition-colors duration-[80ms]',
                      selectedPriority === key ? 'bg-accent-bg' : 'hover:bg-bg-hover'
                    )}
                    onClick={() => { setSelectedPriority(key as TaskPriority); setPriorityOpen(false) }}
                  >
                    <PriorityIcon priority={key} color={TASK_PRIORITY_COLORS[key as TaskPriority]} size={14} />
                    <span className='flex-1'>{label}</span>
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            {/* Assignee */}
            <UserCombobox
              value={selectedAssignee}
              onChange={setSelectedAssignee}
              placeholder='Assignee'
              triggerClassName='inline-flex items-center gap-1.5 rounded-[6px] bg-bg-secondary px-2.5 py-1.5 text-[12px] font-medium text-text-tertiary transition-colors duration-[80ms] hover:bg-bg-hover cursor-pointer'
            />

            {/* Due date */}
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <button
                  type='button'
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-[6px] bg-bg-secondary px-2.5 py-1.5 text-[12px] font-medium transition-colors duration-[80ms] hover:bg-bg-hover',
                    selectedDueDate ? 'text-foreground' : 'text-text-tertiary'
                  )}
                >
                  <Calendar className='size-3.5' />
                  {selectedDueDate ? format(new Date(selectedDueDate), 'MMM d') : 'Date'}
                </button>
              </PopoverTrigger>
              <PopoverContent className='w-auto gap-0 p-0' align='start'>
                <div className='flex flex-col gap-0.5 border-b border-border px-1 py-1'>
                  {CMD_DATE_PRESETS.map((preset) => {
                    const resolved = preset.getDate()
                    return (
                      <button
                        key={preset.label}
                        type='button'
                        className='flex w-full items-center justify-between rounded-[5px] px-2.5 py-1 text-[13px] font-medium transition-colors duration-[80ms] hover:bg-bg-hover'
                        onClick={() => { setSelectedDueDate(format(resolved, 'yyyy-MM-dd')); setDateOpen(false) }}
                      >
                        <span>{preset.label}</span>
                        <span className='text-[11px] text-text-tertiary'>{format(resolved, 'MMM d')}</span>
                      </button>
                    )
                  })}
                  {selectedDueDate && (
                    <button
                      type='button'
                      className='flex w-full items-center rounded-[5px] px-2.5 py-1 text-[13px] font-medium text-destructive transition-colors duration-[80ms] hover:bg-bg-hover'
                      onClick={() => { setSelectedDueDate(null); setDateOpen(false) }}
                    >
                      No date
                    </button>
                  )}
                </div>
                <CalendarComponent
                  mode='single'
                  selected={selectedDueDate ? new Date(selectedDueDate) : undefined}
                  onSelect={(date) => { setSelectedDueDate(date ? format(date, 'yyyy-MM-dd') : null); setDateOpen(false) }}
                  className='p-2'
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Divider */}
          <div className='border-t border-border' />

          {/* Footer hints */}
          <div className='flex items-center justify-between px-5 py-2.5'>
            <div className='flex items-center gap-3'>
              <button type='button' className='text-[11px] text-text-tertiary transition-colors hover:text-text-secondary' onClick={handleSubmit}>
                <kbd className='rounded border border-border bg-bg-secondary px-1 py-0.5 text-[10px] font-medium'>Enter</kbd> to create
              </button>
              <button type='button' className='text-[11px] text-text-tertiary transition-colors hover:text-text-secondary' onClick={onClose}>
                <kbd className='rounded border border-border bg-bg-secondary px-1 py-0.5 text-[10px] font-medium'>Esc</kbd> to cancel
              </button>
            </div>
            <button
              type='button'
              className={cn(
                'rounded-[6px] bg-primary px-3 py-1 text-[12px] font-medium text-primary-foreground transition-colors duration-[80ms]',
                canSubmit ? 'hover:opacity-90' : 'opacity-50'
              )}
              onClick={handleSubmit}
              disabled={!canSubmit || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Filter Popover ──────────────────────────────────────────

function FilterPopover({
  label,
  active,
  icon,
  children,
}: {
  label: string
  active: boolean
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type='button'
          className={cn(
            'inline-flex items-center gap-1.5 rounded-[6px] border px-2.5 py-1.5 text-[13px] font-medium',
            'transition-colors duration-[80ms] hover:bg-bg-hover',
            active
              ? 'border-primary/30 bg-primary/5 text-foreground'
              : 'border-border bg-background text-text-secondary'
          )}
        >
          {icon}
          {label}
          <ChevronDown className='size-3 text-text-tertiary' />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className='w-[180px] overflow-hidden rounded-[8px] border-border gap-0 p-1'
        align='start'
        style={{ boxShadow: 'var(--dropdown-shadow)' }}
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}

// ── Filter Chip ─────────────────────────────────────────────

function FilterChip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span className='inline-flex items-center gap-1 rounded-[5px] border border-border bg-bg-secondary px-2 py-0.5 text-[12px] font-medium text-foreground'>
      {children}
      <button
        type='button'
        className='ml-0.5 rounded-[3px] p-0.5 text-text-tertiary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground'
        onClick={onRemove}
      >
        <X className='size-3' />
      </button>
    </span>
  )
}

// ── Empty State ──────────────────────────────────────────────

function EmptyState() {
  return (
    <div className='flex flex-col items-center justify-center py-24 text-center'>
      <div className='mb-1 text-text-tertiary/30'>
        <svg width='28' height='28' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'>
          <rect x='3' y='3' width='7' height='7' rx='1' />
          <rect x='14' y='3' width='7' height='7' rx='1' />
          <rect x='3' y='14' width='7' height='7' rx='1' />
          <rect x='14' y='14' width='7' height='7' rx='1' />
        </svg>
      </div>
      <p className='text-[13px] text-text-tertiary'>
        No matching tasks
      </p>
    </div>
  )
}
