'use no memo'

import { format, isPast, isToday } from 'date-fns'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import { StatusDropdown } from './status-dropdown'
import type { TaskListItem, TaskStatus } from '@/api/task/schema'
import { InitialsAvatar, StatusIcon } from '@/components/ds'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getTaskPriorityColor, getTaskPriorityLabel } from '@/constants/task'
import type { Breakpoint } from '@/hooks/use-breakpoint'
import { cn } from '@/lib/utils'

interface TaskRowProps {
  task: TaskListItem
  statuses: TaskStatus[]
  bp: Breakpoint
  onView: (task: TaskListItem) => void
  onEdit: (task: TaskListItem) => void
  onDelete: (task: TaskListItem) => void
  onStatusChange: (task: TaskListItem, statusId: number) => void
}

export function TaskRow({ task, statuses, bp, onView, onEdit, onDelete, onStatusChange }: TaskRowProps) {
  const status = statuses.find((s) => s.id === task.status)
  const priorityColor = getTaskPriorityColor(task.priority)
  const priorityLabel = getTaskPriorityLabel(task.priority)

  const dueDate = task.due_date ? new Date(task.due_date) : null
  const overdue = dueDate ? isPast(dueDate) && !isToday(dueDate) : false
  const dueDateLabel = dueDate ? format(dueDate, 'MMM d') : null

  const assigneeName = task.responsible_user_name
  const assigneeInitials = assigneeName
    ?.split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
  const assigneeFirstName = assigneeName?.split(' ')[0]

  const isMobile = bp === 'mobile'
  const isTablet = bp === 'tablet'

  // ── Mobile card layout ──
  if (isMobile) {
    return (
      <div
        className='cursor-pointer border-b border-border-light px-3.5 py-3 transition-colors duration-100 hover:bg-bg-hover'
        onClick={() => onView(task)}
      >
        {/* Row 1: status icon + title */}
        <div className='mb-2 flex items-start gap-2.5'>
          <div className='pt-0.5'>
            <StatusIcon status={task.status_name} color={status?.color} size={14} />
          </div>
          <span className='min-w-0 flex-1 text-sm font-medium leading-snug text-foreground'>
            {task.title}
          </span>
        </div>
        {/* Row 2: meta chips */}
        <div className='flex flex-wrap items-center gap-2 pl-[24px]'>
          <span className='text-[11px] tabular-nums text-text-tertiary'>
            TSK-{task.id.toString().padStart(3, '0')}
          </span>
          <span className='inline-flex items-center gap-1'>
            <span className='size-2 rounded-full' style={{ backgroundColor: priorityColor }} />
            <span className='text-[11px] font-medium text-text-secondary'>{priorityLabel}</span>
          </span>
          {assigneeInitials && (
            <span className='inline-flex items-center gap-1'>
              <InitialsAvatar initials={assigneeInitials} size={16} />
              <span className='text-[11px] text-text-secondary'>{assigneeFirstName}</span>
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

  // ── Desktop / Tablet grid row ──
  return (
    <div
      className={cn(
        'group/row grid cursor-pointer items-center border-b border-border-light text-[13px] text-foreground transition-colors duration-100 hover:bg-bg-hover',
        isTablet
          ? 'grid-cols-[minmax(0,1fr)_120px_80px_80px_36px] gap-x-4 px-3 py-2'
          : 'grid-cols-[minmax(0,1fr)_120px_80px_120px_80px_36px] gap-x-5 px-4 py-2'
      )}
      onClick={() => onView(task)}
    >
      {/* Task: status icon + ID + title */}
      <div className='flex min-w-0 items-center gap-2'>
        <StatusIcon status={task.status_name} color={status?.color} size={14} />
        <span className='shrink-0 text-xs tabular-nums text-text-tertiary'>
          TSK-{task.id.toString().padStart(3, '0')}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className='truncate font-medium'>{task.title}</span>
          </TooltipTrigger>
          <TooltipContent side='top'>{task.title}</TooltipContent>
        </Tooltip>
      </div>

      {/* Status */}
      <div
        className='flex min-w-0 shrink-0 items-center gap-1.5'
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role='group'
      >
        <StatusDropdown
          statuses={statuses}
          value={task.status}
          onSelect={(id) => onStatusChange(task, id)}
          trigger={
            <button
              type='button'
              className='inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap text-[12px] font-medium transition-opacity duration-[80ms] hover:opacity-70'
              style={{
                color: status?.color ?? 'var(--text-secondary)',
              }}
            >
              <StatusIcon status={task.status_name} color={status?.color} size={12} />
              {task.status_name}
            </button>
          }
        />
      </div>

      {/* Priority */}
      <div className='flex items-center gap-1.5'>
        <span className='size-2 shrink-0 rounded-full' style={{ backgroundColor: priorityColor }} />
        <span className='text-xs font-medium'>{priorityLabel}</span>
      </div>

      {/* Assignee (desktop only) */}
      {!isTablet && (
        <div className='flex min-w-0 items-center gap-1.5'>
          {assigneeInitials ? (
            <>
              <InitialsAvatar initials={assigneeInitials} size={18} />
              <span className='truncate text-xs text-text-secondary'>{assigneeFirstName}</span>
            </>
          ) : (
            <span className='text-xs text-text-tertiary'>&mdash;</span>
          )}
        </div>
      )}

      {/* Due date */}
      <div className='text-xs text-text-tertiary'>
        {dueDateLabel ? (
          <span className={cn(overdue && 'font-medium text-destructive')}>
            {dueDateLabel}
          </span>
        ) : (
          <span>&mdash;</span>
        )}
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
              className='inline-flex size-6 items-center justify-center rounded-[5px] text-text-tertiary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground'
            >
              <MoreHorizontal className='size-3.5' />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='min-w-36'>
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Pencil className='size-4' />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant='destructive' onClick={() => onDelete(task)}>
              <Trash2 className='size-4' />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export function TaskRowSkeleton({ bp = 'desktop' }: { bp?: Breakpoint }) {
  if (bp === 'mobile') {
    return (
      <div className='border-b border-border-light px-3.5 py-3'>
        <div className='mb-2 flex items-start gap-2.5'>
          <Skeleton className='size-3.5 rounded-full' />
          <Skeleton className='h-4 flex-1' />
        </div>
        <div className='flex items-center gap-2 pl-[24px]'>
          <Skeleton className='h-3 w-12' />
          <Skeleton className='h-3 w-10' />
          <Skeleton className='size-4 rounded-full' />
        </div>
      </div>
    )
  }

  return (
    <div className='grid grid-cols-[minmax(0,1fr)_120px_80px_120px_80px_36px] gap-x-5 border-b border-border-light px-4 py-2'>
      <div className='flex items-center gap-2'>
        <Skeleton className='size-3.5 shrink-0 rounded-full' />
        <Skeleton className='h-3 w-12' />
        <Skeleton className='h-3 flex-1' />
      </div>
      <Skeleton className='h-3 w-14' />
      <div className='flex items-center gap-1.5'>
        <Skeleton className='size-2 rounded-full' />
        <Skeleton className='h-3 w-10' />
      </div>
      <div className='flex items-center gap-1.5'>
        <Skeleton className='size-[18px] rounded-full' />
        <Skeleton className='h-3 w-10' />
      </div>
      <Skeleton className='ml-auto h-3 w-10' />
      <span />
    </div>
  )
}
