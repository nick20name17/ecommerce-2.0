'use no memo'

import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { CheckSquare, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { TASK_QUERY_KEYS, getTaskStatusesQuery, getTasksQuery } from '@/api/task/query'
import type { TaskListItem, TaskStatus } from '@/api/task/schema'
import { taskService } from '@/api/task/service'
import { PageEmpty } from '@/components/common/page-empty'
import { InitialsAvatar, StatusIcon } from '@/components/ds'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS } from '@/constants/task'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { useProjectId } from '@/hooks/use-project-id'
import { TaskDeleteDialog } from '@/components/tasks/task-delete-dialog'
import { CommandBarCreate } from '@/components/tasks/command-bar-create'
import { formatDateShort, getInitials } from '@/helpers/formatters'
import { cn } from '@/lib/utils'

interface CustomerTasksTabProps {
  customerId: string
  customerName?: string | null
}

// ── Helpers ──────────────────────────────────────────────────

function isOverdue(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return d < today
}

const PRIORITY_BARS: Record<string, number> = { low: 1, medium: 2, high: 3, urgent: 4 }

function PriorityIcon({ priority, color, size = 14 }: { priority: string; color: string; size?: number }) {
  const filled = PRIORITY_BARS[priority] ?? 1
  const barWidth = 2.5
  const gap = 1.5
  return (
    <svg width={size} height={size} viewBox='0 0 16 16' fill='none' className='shrink-0'>
      {Array.from({ length: 4 }).map((_, i) => {
        const x = 2 + i * (barWidth + gap)
        const barHeight = 4 + i * 2.5
        const y = 14 - barHeight
        return (
          <rect key={i} x={x} y={y} width={barWidth} height={barHeight} rx={0.75} fill={i < filled ? color : 'var(--border)'} />
        )
      })}
    </svg>
  )
}

// ── Tab Component ────────────────────────────────────────────

export const CustomerTasksTab = ({ customerId, customerName }: CustomerTasksTabProps) => {
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const navigate = useNavigate()
  const [projectId] = useProjectId()
  const [search, setSearch] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<TaskListItem | null>(null)

  const { data: statusesData } = useQuery(getTaskStatusesQuery(projectId ?? null))
  const statuses = statusesData?.results ?? []

  const params = {
    linked_customer_autoid: customerId,
    search: search || undefined,
    project_id: projectId ?? undefined,
    limit: 200,
  }

  const { data, isLoading } = useQuery({
    ...getTasksQuery(params),
    placeholderData: keepPreviousData,
  })

  const tasks = data?.results ?? []

  const statusChangeMutation = useMutation({
    mutationFn: ({ taskId, statusId }: { taskId: number; statusId: number }) =>
      taskService.update(taskId, { status: statusId }),
    meta: {
      successMessage: 'Status updated',
      invalidatesQuery: TASK_QUERY_KEYS.lists(),
    },
  })

  const handleStatusChange = (task: TaskListItem, statusId: number) =>
    statusChangeMutation.mutate({ taskId: task.id, statusId })

  const handleTaskClick = (task: TaskListItem) => {
    navigate({ to: '/tasks/$taskId', params: { taskId: String(task.id) } })
  }

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* Search + create */}
      <div
        className={cn(
          'flex shrink-0 items-center gap-2 border-b border-border py-2',
          isMobile ? 'px-5' : 'px-6'
        )}
      >
        <div className='flex flex-1 items-center gap-1.5 rounded-[6px] border border-border bg-background px-2.5 py-1.5'>
          <Search className='size-3.5 shrink-0 text-text-tertiary' />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search to-do's..."
            className='flex-1 bg-transparent text-[13px] outline-none placeholder:text-text-tertiary'
          />
        </div>
        <button
          type='button'
          className='inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[6px] bg-primary px-3 text-[13px] font-medium text-primary-foreground transition-colors duration-[80ms] hover:opacity-90'
          onClick={() => setShowCreate(true)}
        >
          <Plus className='size-4' />
          Add
        </button>
      </div>

      {/* Task list */}
      <div className='flex-1 overflow-y-auto'>
        {isLoading ? (
          <div className='space-y-0'>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-2 border-b border-border-light py-2',
                  isMobile ? 'px-5' : 'px-6'
                )}
              >
                <div className='size-3.5 animate-pulse rounded-full bg-border' />
                <div className='h-3 w-12 animate-pulse rounded bg-border' />
                <div className='h-3 flex-1 animate-pulse rounded bg-border' />
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <PageEmpty icon={CheckSquare} title="No to-do's found" description='This customer has no tasks yet.' compact />
        ) : (
          tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              statuses={statuses}
              isMobile={isMobile}
              isTablet={bp === 'tablet'}
              onStatusChange={handleStatusChange}
              onDelete={setTaskToDelete}
              onClick={() => handleTaskClick(task)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      {tasks.length > 0 && (
        <div
          className={cn(
            'shrink-0 border-t border-border py-1.5',
            isMobile ? 'px-5' : 'px-6'
          )}
        >
          <p className='text-[13px] tabular-nums text-text-tertiary'>
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {showCreate && (
        <CommandBarCreate
          onClose={() => setShowCreate(false)}
          defaultLinkedCustomerAutoid={customerId}
          lockLinkedCustomer
          linkedCustomerLabel={customerName}
        />
      )}

      <TaskDeleteDialog
        task={taskToDelete}
        open={taskToDelete !== null}
        onOpenChange={(open) => !open && setTaskToDelete(null)}
        onDeleted={() => setTaskToDelete(null)}
      />
    </div>
  )
}

// ── Task Row ────────────────────────────────────────────────

function TaskRow({
  task,
  statuses,
  isMobile,
  isTablet,
  onStatusChange,
  onDelete,
  onClick,
}: {
  task: TaskListItem
  statuses: TaskStatus[]
  isMobile: boolean
  isTablet: boolean
  onStatusChange: (task: TaskListItem, statusId: number) => void
  onDelete: (task: TaskListItem) => void
  onClick: () => void
}) {
  const [statusOpen, setStatusOpen] = useState(false)
  const priorityColor = TASK_PRIORITY_COLORS[task.priority]
  const priorityLabel = TASK_PRIORITY_LABELS[task.priority]
  const assigneeName = task.responsible_user_name
  const assigneeInitials = assigneeName ? getInitials(assigneeName) : null
  const assigneeFirst = assigneeName?.split(' ')[0]
  const dueDateLabel = task.due_date ? formatDateShort(task.due_date) : null
  const overdue = task.due_date ? isOverdue(task.due_date) : false

  if (isMobile) {
    return (
      <div
        className='cursor-pointer border-b border-border-light px-5 py-2 transition-colors duration-100 hover:bg-bg-hover'
        onClick={onClick}
      >
        <div className='flex items-center gap-2'>
          <button
            type='button'
            className='shrink-0 rounded-[4px] transition-opacity duration-[80ms] hover:opacity-70'
            onClick={(e) => { e.stopPropagation(); setStatusOpen(true) }}
          >
            <StatusIcon status={task.status_name} color={task.status_color} size={14} />
          </button>
          <span className='min-w-0 flex-1 truncate text-[13px] font-medium text-foreground'>
            {task.title}
          </span>
        </div>
        <div className='mt-0.5 flex items-center gap-2 pl-[22px]'>
          <span className='text-[13px] tabular-nums text-text-tertiary'>
            TSK-{task.id.toString().padStart(3, '0')}
          </span>
          <PriorityIcon priority={task.priority} color={priorityColor} size={12} />
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
        'group/row flex cursor-pointer items-center border-b border-border-light transition-colors duration-100 hover:bg-bg-hover',
        isTablet ? 'gap-3 px-5 py-1.5' : 'gap-4 px-6 py-1.5'
      )}
      onClick={onClick}
    >
      {/* Status + ID + title */}
      <div className='flex min-w-0 flex-1 items-center gap-2'>
        <Popover open={statusOpen} onOpenChange={setStatusOpen}>
          <PopoverTrigger asChild>
            <button
              type='button'
              className='shrink-0 rounded-[4px] transition-opacity duration-[80ms] hover:opacity-70'
              onClick={(e) => e.stopPropagation()}
            >
              <StatusIcon status={task.status_name} color={task.status_color} size={14} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className='w-[180px] overflow-hidden rounded-[8px] border-border gap-0 p-1'
            align='start'
            style={{ boxShadow: 'var(--dropdown-shadow)' }}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {statuses.map((s) => (
              <button
                key={s.id}
                type='button'
                className={cn(
                  'flex w-full items-center gap-2 rounded-[6px] px-2 py-1 text-left text-[13px] font-medium',
                  'transition-colors duration-[80ms]',
                  s.id === task.status ? 'bg-accent-bg' : 'hover:bg-bg-hover'
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  setStatusOpen(false)
                  onStatusChange(task, s.id)
                }}
              >
                <StatusIcon status={s.name} color={s.color} size={14} />
                <span className='flex-1'>{s.name}</span>
              </button>
            ))}
          </PopoverContent>
        </Popover>
        <span className='shrink-0 text-[13px] tabular-nums text-text-tertiary'>
          TSK-{task.id.toString().padStart(3, '0')}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className='truncate text-[13px] font-medium'>{task.title}</span>
          </TooltipTrigger>
          <TooltipContent side='top'>{task.title}</TooltipContent>
        </Tooltip>
      </div>

      {/* Metadata */}
      <div className='flex shrink-0 items-center gap-4'>
        <div className='flex w-[70px] items-center gap-1.5'>
          <PriorityIcon priority={task.priority} color={priorityColor} size={14} />
          <span className='text-[13px] font-medium'>{priorityLabel}</span>
        </div>

        {!isTablet && (
          <div className='flex w-[90px] min-w-0 items-center gap-1.5'>
            {assigneeInitials ? (
              <>
                <InitialsAvatar initials={assigneeInitials} size={18} />
                <span className='truncate text-[13px] text-text-secondary'>{assigneeFirst}</span>
              </>
            ) : (
              <span className='text-[13px] text-text-tertiary'>&mdash;</span>
            )}
          </div>
        )}

        <div className='w-[60px] text-[13px] text-text-tertiary'>
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
