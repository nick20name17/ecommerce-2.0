import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { FileText, ShoppingCart, Trash2, User } from 'lucide-react'
import { useState } from 'react'

import { TaskAttachments } from '../../-components/task-attachments'

import { TASK_QUERY_KEYS, getTaskStatusesQuery } from '@/api/task/query'
import type { Task } from '@/api/task/schema'
import { taskService } from '@/api/task/service'
import { TaskPrioritySelect } from '@/components/common/task-priority-select'
import { TaskStatusSelect } from '@/components/common/task-status-select'
import { UserCombobox } from '@/components/common/user-combobox/user-combobox'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { TaskPriority } from '@/constants/task'
import { dateToLocalDateString, localDateStringToDate } from '@/helpers/date'
import { useProjectId } from '@/hooks/use-project-id'
import { cn } from '@/lib/utils'

const DATE_TIME_LONG = 'MMM d, yyyy, h:mm a'

function DetailRow({
  label,
  children,
  className
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <span className='text-muted-foreground text-xs'>{label}</span>
      <div className='min-w-0'>{children}</div>
    </div>
  )
}

interface TaskInfoCardProps {
  task: Task
  onDelete: () => void
}

export const TaskInfoCard = ({ task, onDelete }: TaskInfoCardProps) => {
  const [projectId] = useProjectId()
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')

  const { data: statusesData } = useQuery(getTaskStatusesQuery(projectId ?? task.project))
  const statuses = statusesData?.results ?? []

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof taskService.update>[1]) =>
      taskService.update(task.id, payload),
    meta: {
      successMessage: 'Task updated',
      invalidatesQuery: TASK_QUERY_KEYS.all()
    }
  })

  const handleStatusChange = (value: string) => {
    updateMutation.mutate({ status: Number(value) })
  }
  const handlePriorityChange = (value: string) => {
    updateMutation.mutate({ priority: value as TaskPriority })
  }
  const handleDueDateChange = (date: Date | undefined) => {
    updateMutation.mutate({ due_date: date ? dateToLocalDateString(date) : null })
  }
  const handleResponsibleChange = (userId: number | null) => {
    updateMutation.mutate({ responsible_user: userId })
  }

  const handleTitleBlur = () => {
    const trimmed = title.trim()
    if (trimmed && trimmed !== task.title) {
      updateMutation.mutate({ title: trimmed })
    } else if (!trimmed) {
      setTitle(task.title)
    }
  }

  const handleDescriptionBlur = () => {
    const value = description.trim() || null
    if (value !== (task.description ?? '')) {
      updateMutation.mutate({ description: value })
    }
  }

  const createdDate = task.created_at ? new Date(task.created_at) : null
  const updatedDate = task.updated_at ? new Date(task.updated_at) : null
  const hasLinked =
    task.linked_order_details ?? task.linked_proposal_details ?? task.linked_customer_details

  return (
    <article className='mx-auto max-w-2xl px-1 py-8'>
      <div className='flex items-start justify-between gap-4'>
        <div className='min-w-0 flex-1 space-y-1'>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                e.currentTarget.blur()
              }
            }}
            className='placeholder:text-muted-foreground/60 border-0 bg-transparent px-0 py-0.5 text-xl font-semibold shadow-none focus-visible:ring-0'
            placeholder='Task title'
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                e.currentTarget.blur()
              }
            }}
            placeholder='Add description…'
            className='placeholder:text-muted-foreground/60 min-h-16 resize-none border-0 bg-transparent px-0 py-1 text-sm leading-relaxed shadow-none focus-visible:ring-0'
            rows={3}
          />
        </div>
        <Button
          variant='ghost'
          size='sm'
          className='text-muted-foreground hover:text-destructive shrink-0'
          onClick={onDelete}
          aria-label='Delete task'
        >
          <Trash2 className='size-4' />
        </Button>
      </div>

      <div className='border-border/60 mt-8 border-t pt-6'>
        <h2 className='text-muted-foreground mb-4 text-xs font-medium'>Details</h2>
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <DetailRow label='Status'>
            <TaskStatusSelect
              statuses={statuses}
              value={task.status}
              onValueChange={(id) => id != null && handleStatusChange(String(id))}
              placeholder='Status'
              disabled={updateMutation.isPending}
              triggerClassName='h-8 w-full text-sm'
            />
          </DetailRow>
          <DetailRow label='Priority'>
            <TaskPrioritySelect
              value={task.priority}
              onValueChange={(v) => v && handlePriorityChange(v)}
              placeholder='Priority'
              disabled={updateMutation.isPending}
              triggerClassName='h-8 w-full text-sm'
            />
          </DetailRow>
          <DetailRow label='Due date'>
            <DatePicker
              value={task.due_date ? localDateStringToDate(task.due_date) : undefined}
              onChange={handleDueDateChange}
              placeholder='Set date'
              className='w-full'
            />
          </DetailRow>
          <DetailRow label='Responsible'>
            <UserCombobox
              value={task.responsible_user ?? null}
              onChange={handleResponsibleChange}
              valueLabel={
                task.responsible_user_details
                  ? `${task.responsible_user_details.first_name} ${task.responsible_user_details.last_name}`.trim()
                  : (task.responsible_user_name ?? undefined)
              }
            />
          </DetailRow>
          <DetailRow label='Related order'>
            {task.linked_order_autoid ? (
              <Button
                variant='ghost'
                size='sm'
                className='h-8 justify-start gap-1.5 font-normal'
                asChild
              >
                <Link
                  to='/orders'
                  search={{ autoid: task.linked_order_autoid, status: 'all' }}
                >
                  <ShoppingCart className='size-3.5' />
                  Order {task.linked_order_autoid}
                </Link>
              </Button>
            ) : (
              <span className='text-muted-foreground text-sm'>—</span>
            )}
          </DetailRow>
          <DetailRow label='Author'>
            <span className='text-sm'>{task.author_details?.full_name ?? task.author_name}</span>
          </DetailRow>
          <DetailRow label='Created'>
            <span className='text-sm'>
              {createdDate ? format(createdDate, DATE_TIME_LONG) : '—'}
            </span>
          </DetailRow>
        </div>
      </div>

      {hasLinked && (
        <div className='border-border/60 mt-8 border-t pt-6'>
          <h2 className='text-muted-foreground mb-3 text-xs font-medium'>Linked to</h2>
          <div className='flex flex-wrap gap-2'>
            {task.linked_order_details && (
              <Button
                variant='ghost'
                size='sm'
                className='h-7 gap-1.5 font-normal'
                asChild
              >
                <Link
                  to='/orders'
                  search={{
                    autoid: task.linked_order_details.autoid,
                    project_id: task.project
                  }}
                >
                  <ShoppingCart className='size-3.5' />
                  Order {task.linked_order_details.invoice}
                </Link>
              </Button>
            )}
            {task.linked_proposal_details && (
              <Button
                variant='ghost'
                size='sm'
                className='h-7 gap-1.5 font-normal'
                asChild
              >
                <Link
                  to='/proposals'
                  search={{ search: task.linked_proposal_details.quote }}
                >
                  <FileText className='size-3.5' />
                  Proposal {task.linked_proposal_details.quote}
                </Link>
              </Button>
            )}
            {task.linked_customer_details && (
              <Button
                variant='ghost'
                size='sm'
                className='h-7 gap-1.5 font-normal'
                asChild
              >
                <Link
                  to='/customers/$customerId'
                  params={{ customerId: task.linked_customer_details.id }}
                >
                  <User className='size-3.5' />
                  {task.linked_customer_details.l_name}
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}

      <div className='border-border/60 mt-8 border-t pt-6'>
        <h2 className='text-muted-foreground mb-3 text-xs font-medium'>Attachments</h2>
        <TaskAttachments
          taskId={task.id}
          attachments={task.attachments ?? []}
        />
      </div>

      {updatedDate && (
        <p className='text-muted-foreground mt-6 text-xs'>
          Updated {format(updatedDate, DATE_TIME_LONG)}
        </p>
      )}
    </article>
  )
}
