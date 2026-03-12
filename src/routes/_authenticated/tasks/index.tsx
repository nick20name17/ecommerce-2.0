import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Calendar,
  Check,
  CheckSquare,
  ChevronDown,
  Columns3,
  List,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { format } from 'date-fns'
import { useState } from 'react'

import { KanbanView } from './-components/kanban-view'
import { TASK_QUERY_KEYS, getTasksQuery, getTaskStatusesQuery } from '@/api/task/query'
import type { TaskListItem, TaskParams, TaskStatus } from '@/api/task/schema'
import { taskService } from '@/api/task/service'
import { PageEmpty } from '@/components/common/page-empty'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { CommandBarCreate, PriorityIcon } from '@/components/tasks/command-bar-create'
import { UserCombobox } from '@/components/common/user-combobox/user-combobox'
import { FilterChip, FilterPopover, ITodos, InitialsAvatar, PAGE_COLORS, PageHeaderIcon, StatusIcon, ViewToggle, type ViewOption } from '@/components/ds'
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

export const Route = createFileRoute('/_authenticated/tasks/')({
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

const TASK_VIEW_OPTIONS: ViewOption<'list' | 'board'>[] = [
  { value: 'list', label: 'List', icon: List },
  { value: 'board', label: 'Board', icon: Columns3 },
]

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

  // Query key for optimistic updates
  const queryKey = TASK_QUERY_KEYS.list(params)

  // Generic field update mutation with optimistic update
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, payload }: { taskId: number; payload: Record<string, unknown> }) =>
      taskService.update(taskId, payload),
    onMutate: async ({ taskId, payload }) => {
      await queryClient.cancelQueries({ queryKey: TASK_QUERY_KEYS.lists() })
      const previous = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(
        queryKey,
        (old: { count: number; results: TaskListItem[] } | undefined) => {
          if (!old) return old
          return {
            ...old,
            results: old.results.map((t) =>
              t.id === taskId ? { ...t, ...payload } : t
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

  const handleTaskUpdate = (task: TaskListItem, payload: Record<string, unknown>) =>
    updateTaskMutation.mutate({ taskId: task.id, payload })

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
    <div className='flex h-full flex-col overflow-hidden'>
      {/* ── Header ── */}
      <header
        className='flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-6'
      >
        <SidebarTrigger className='-ml-1' />
        <div className='flex items-center gap-1.5'>
          <PageHeaderIcon icon={ITodos} color={PAGE_COLORS.todos} />
          <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>To-Do&apos;s</h1>
        </div>

        <ViewToggle options={TASK_VIEW_OPTIONS} value={view} onChange={setView} compact={isMobile} />

        <div className='flex-1' />

        <div className='hidden h-7 w-[260px] items-center gap-1.5 rounded-[5px] border border-border bg-background px-2 transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50 sm:flex'>
          <Search className='size-3 shrink-0 text-text-tertiary' />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search tasks...'
            className='flex-1 bg-transparent text-[13px] outline-none placeholder:text-text-tertiary'
          />
        </div>

        <div className='flex items-center gap-1.5'>
          <FilterPopover
            label='Status'
            active={activeStatuses.size > 0}
            icon={<StatusIcon status='' color='currentColor' size={12} />}
            width='w-[220px]'
          >
            {statuses.map((s) => {
              const selected = activeStatuses.has(s.id)
              return (
                <button
                  key={s.id}
                  type='button'
                  className={cn(
                    'flex w-full items-center gap-2 rounded-[5px] px-2 py-[3px] text-left text-[13px] font-medium',
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
                  <StatusIcon status={s.name} color={s.color} size={13} />
                  <span className='flex-1'>{s.name}</span>
                </button>
              )
            })}
          </FilterPopover>

          <FilterPopover
            label='Priority'
            active={activePriorities.size > 0}
            icon={<PriorityIcon priority='medium' color='currentColor' size={12} />}
          >
            {Object.entries(TASK_PRIORITY_LABELS).map(([key, label]) => {
              const selected = activePriorities.has(key as TaskPriority)
              return (
                <button
                  key={key}
                  type='button'
                  className={cn(
                    'flex w-full items-center gap-2 rounded-[5px] px-2 py-[3px] text-left text-[13px] font-medium',
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
                  <PriorityIcon priority={key} color={TASK_PRIORITY_COLORS[key as TaskPriority]} size={13} />
                  <span className='flex-1'>{label}</span>
                </button>
              )
            })}
          </FilterPopover>

          <button
            type='button'
            className='inline-flex h-7 items-center gap-1 rounded-[5px] bg-primary px-2 text-[13px] font-semibold text-primary-foreground transition-colors duration-[80ms] hover:opacity-90 sm:px-2.5'
            onClick={() => setShowCreate(true)}
          >
            <Plus className='size-3.5' />
            <span className='hidden sm:inline'>New Task</span>
          </button>
        </div>
      </header>

      {/* Active filter chips */}
      {hasFilters && (
        <div className='flex shrink-0 flex-wrap items-center gap-1.5 border-b border-border px-6 py-1.5'>
          <button
            type='button'
            className='text-[13px] font-medium text-text-tertiary transition-colors duration-[80ms] hover:text-foreground'
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
                  <div className={cn('flex items-center gap-2 border-b border-border bg-bg-secondary py-1.5', isMobile ? 'px-3.5' : 'px-6')}>
                    <div className='size-3.5 animate-pulse rounded-full bg-border' />
                    <div className='h-3.5 w-20 animate-pulse rounded bg-border' />
                  </div>
                  {Array.from({ length: gi === 0 ? 3 : 2 }).map((_, ti) => (
                    <div key={ti} className={cn('flex items-center gap-3 border-b border-border-light py-2.5', isMobile ? 'px-3.5' : 'px-6')}>
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
                    className={cn('flex w-full items-center gap-2 border-b border-border bg-bg-secondary py-1.5 transition-colors duration-[80ms] hover:bg-bg-hover', isMobile ? 'px-3.5' : 'px-6')}
                    onClick={() => toggleGroup(status.name)}
                  >
                    <StatusIcon status={status.name} color={status.color} size={14} />
                    <span className='text-[13px] font-semibold text-foreground'>
                      {status.name}
                    </span>
                    <span className='text-[13px] tabular-nums text-text-tertiary'>
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
                          onUpdate={handleTaskUpdate}
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
        <div className={cn('shrink-0 border-t border-border py-2', isMobile ? 'px-5' : 'px-6')}>
          <p className='text-[13px] tabular-nums text-text-tertiary'>
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
  onUpdate,
}: {
  task: TaskListItem
  statuses: TaskStatus[]
  bp: Breakpoint
  onStatusChange: (task: TaskListItem, statusId: number) => void
  onDelete: (task: TaskListItem) => void
  onUpdate: (task: TaskListItem, payload: Record<string, unknown>) => void
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
    navigate({ to: '/tasks/$taskId', params: { taskId: String(task.id) } })
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
          <span className='text-[13px] tabular-nums text-text-tertiary'>
            TSK-{task.id.toString().padStart(3, '0')}
          </span>
          <span className='inline-flex items-center gap-1'>
            <PriorityIcon priority={task.priority} color={priorityColor} size={12} />
            <span className='text-[13px] font-medium text-text-secondary'>{priorityLabel}</span>
          </span>
          {assigneeInitials && (
            <span className='inline-flex items-center gap-1'>
              <InitialsAvatar initials={assigneeInitials} size={16} />
              <span className='text-[13px] text-text-secondary'>{assigneeFirst}</span>
            </span>
          )}
          {dueDateLabel && (
            <span className={cn('text-[13px]', overdue ? 'font-medium text-destructive' : 'text-text-tertiary')}>
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
        isTablet ? 'gap-4 px-5 py-2' : 'gap-6 px-6 py-2'
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
        <Popover>
          <PopoverTrigger asChild>
            <button
              type='button'
              className='flex w-[90px] items-center gap-1.5 rounded-[5px] px-1 py-0.5 transition-colors duration-75 hover:bg-bg-active'
              onClick={(e) => e.stopPropagation()}
            >
              <PriorityIcon priority={task.priority} color={priorityColor} size={14} />
              <span className='text-sm font-medium'>{priorityLabel}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className='w-[160px] overflow-hidden rounded-[8px] border-border gap-0 p-1' align='start' style={{ boxShadow: 'var(--dropdown-shadow)' }} onOpenAutoFocus={(e) => e.preventDefault()}>
            {Object.entries(TASK_PRIORITY_LABELS).map(([key, label]) => (
              <button
                key={key}
                type='button'
                className={cn(
                  'flex w-full items-center gap-2 rounded-[6px] px-2 py-1 text-left text-[13px] font-medium',
                  'transition-colors duration-[80ms]',
                  task.priority === key ? 'bg-accent-bg' : 'hover:bg-bg-hover'
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  onUpdate(task, { priority: key })
                }}
              >
                <PriorityIcon priority={key} color={TASK_PRIORITY_COLORS[key as TaskPriority]} size={14} />
                <span className='flex-1'>{label}</span>
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Assignee */}
        <div className='w-[160px] min-w-0' onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <UserCombobox
            value={task.responsible_user ?? null}
            onChange={(userId) => onUpdate(task, { responsible_user: userId, responsible_user_name: null })}
            valueLabel={assigneeName ?? undefined}
            placeholder='Assignee'
            triggerClassName={cn(
              'flex w-full items-center gap-1.5 rounded-[5px] px-1 py-0.5 text-[13px] transition-colors duration-75 hover:bg-bg-active cursor-pointer',
              assigneeName ? 'text-text-secondary' : 'text-text-tertiary'
            )}
          />
        </div>

        {/* Due date */}
        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type='button'
                className={cn(
                  'flex w-[80px] items-center gap-1 rounded-[5px] px-1 py-0.5 text-sm transition-colors duration-75 hover:bg-bg-active',
                  overdue ? 'font-medium text-destructive' : 'text-text-tertiary'
                )}
              >
                <Calendar className='size-3' />
                {dueDateLabel ?? '\u2014'}
              </button>
            </PopoverTrigger>
            <PopoverContent className='w-auto gap-0 p-0' align='start'>
              <CalendarComponent
                mode='single'
                selected={task.due_date ? new Date(task.due_date) : undefined}
                onSelect={(date) => onUpdate(task, { due_date: date ? format(date, 'yyyy-MM-dd') : null })}
                className='p-2'
              />
            </PopoverContent>
          </Popover>
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

// ── Empty State ──────────────────────────────────────────────

function EmptyState() {
  return (
    <PageEmpty icon={CheckSquare} title='No matching tasks' description='Try adjusting your search or filters.' />
  )
}
