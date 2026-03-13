import { useNavigate } from '@tanstack/react-router'
import {
  Calendar,
  Trash2,
} from 'lucide-react'
import { format } from 'date-fns'
import { useState } from 'react'

import type { TaskListItem, TaskStatus } from '@/api/task/schema'
import { PriorityIcon } from '@/components/tasks/command-bar-create'
import { UserCombobox } from '@/components/common/user-combobox/user-combobox'
import { InitialsAvatar, StatusIcon } from '@/components/ds'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS } from '@/constants/task'
import type { TaskPriority } from '@/constants/task'
import type { Breakpoint } from '@/hooks/use-breakpoint'
import { cn } from '@/lib/utils'

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

// ── Status Change Button ─────────────────────────────────────

export function StatusChangeButton({
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

// ── Task Row ─────────────────────────────────────────────────

export function TaskRow({
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
      <div className={cn('flex shrink-0 items-center', isTablet ? 'gap-3' : 'gap-5')}>
        {/* Priority */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type='button'
              className={cn('flex items-center gap-1.5 rounded-[5px] px-1 py-0.5 transition-colors duration-75 hover:bg-bg-active', isTablet ? 'w-auto' : 'w-[90px]')}
              onClick={(e) => e.stopPropagation()}
            >
              <PriorityIcon priority={task.priority} color={priorityColor} size={14} />
              {!isTablet && <span className='text-sm font-medium'>{priorityLabel}</span>}
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
        {!isTablet && <div className='w-[160px] min-w-0' onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
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
        </div>}

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
