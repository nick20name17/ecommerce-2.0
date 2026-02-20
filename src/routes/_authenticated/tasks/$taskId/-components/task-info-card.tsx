import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { FileText, ShoppingCart, Trash2, User } from 'lucide-react'
import { useState } from 'react'

import { UserCombobox } from '../../-components/user-combobox'

import { TASK_QUERY_KEYS, getTaskStatusesQuery } from '@/api/task/query'
import type { Task } from '@/api/task/schema'
import { taskService } from '@/api/task/service'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { TASK_PRIORITY_LABELS, getTaskPriorityColor } from '@/constants/task'
import type { TaskPriority } from '@/constants/task'
import { useProjectId } from '@/hooks/use-project-id'

const DATE_TIME_LONG = 'MMM d, yyyy, h:mm a'

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
    updateMutation.mutate({ due_date: date ? date.toISOString().slice(0, 10) : null })
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

  return (
    <Card className='bg-card rounded-lg border shadow-sm'>
      <CardContent className='p-6'>
        <div className='flex items-start justify-between gap-4'>
          <div className='min-w-0 flex-1 space-y-3'>
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
              className='focus-visible:border-input focus-visible:ring-ring h-auto rounded-md border-transparent px-3 py-2 text-2xl font-bold focus-visible:ring-2'
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
              placeholder='Add description...'
              className='placeholder:text-muted-foreground focus-visible:border-input focus-visible:ring-ring min-h-6 resize-none rounded-md border-transparent px-3 py-2 text-sm placeholder:italic focus-visible:ring-2'
              rows={2}
            />
          </div>
          <Button
            variant='ghost'
            size='icon'
            className='text-muted-foreground hover:text-destructive shrink-0'
            onClick={onDelete}
            aria-label='Delete task'
          >
            <Trash2 />
          </Button>
        </div>

        <div className='mt-6 grid grid-cols-2 gap-x-8 gap-y-4'>
          <div className='space-y-1'>
            <label className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
              Status
            </label>
            <Select
              value={String(task.status)}
              onValueChange={handleStatusChange}
              disabled={updateMutation.isPending}
            >
              <SelectTrigger className='h-9 w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem
                    key={s.id}
                    value={String(s.id)}
                  >
                    <span className='flex items-center gap-1.5'>
                      <span
                        className='size-2 shrink-0 rounded-full'
                        style={{ backgroundColor: s.color }}
                      />
                      {s.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1'>
            <label className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
              Priority
            </label>
            <Select
              value={task.priority}
              onValueChange={handlePriorityChange}
              disabled={updateMutation.isPending}
            >
              <SelectTrigger className='h-9 w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                  <SelectItem
                    key={value}
                    value={value}
                  >
                    <span className='flex items-center gap-1.5'>
                      <span
                        className='size-2 shrink-0 rounded-full'
                        style={{ backgroundColor: getTaskPriorityColor(value as TaskPriority) }}
                      />
                      {label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1'>
            <label className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
              Due date
            </label>
            <DatePicker
              value={task.due_date ? new Date(task.due_date) : undefined}
              onChange={handleDueDateChange}
              placeholder='Set due date'
              className='w-full'
            />
          </div>

          <div className='space-y-1'>
            <label className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
              Responsible
            </label>
            <UserCombobox
              value={task.responsible_user ?? null}
              onChange={handleResponsibleChange}
            />
          </div>

          <div className='space-y-1'>
            <div className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
              Related order
            </div>
            {task.linked_order_autoid ? (
              <Button
                variant='secondary'
                asChild
              >
                <Link
                  to='/orders'
                  search={{
                    autoid: task.linked_order_autoid,
                    status: 'all'
                  }}
                  className='hover:bg-secondary/80 inline-flex w-fit cursor-pointer items-center gap-1.5 border border-transparent px-2.5 py-1 text-sm font-medium transition-colors'
                >
                  <ShoppingCart className='size-4 shrink-0' />
                  Order {task.linked_order_autoid}
                </Link>
              </Button>
            ) : (
              <p className='text-sm'>—</p>
            )}
          </div>

          <div className='space-y-1'>
            <label className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
              Author
            </label>
            <p className='text-sm'>{task.author_details?.full_name ?? task.author_name}</p>
          </div>

          <div className='space-y-1'>
            <label className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
              Created
            </label>
            <p className='text-sm'>{createdDate ? format(createdDate, DATE_TIME_LONG) : '—'}</p>
          </div>
        </div>

        {(task.linked_order_details ??
          task.linked_proposal_details ??
          task.linked_customer_details) && (
          <div className='mt-6 space-y-2'>
            <label className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
              Linked to
            </label>
            <div className='flex flex-wrap items-center gap-2'>
              {task.linked_order_details && (
                <Badge
                  variant='secondary'
                  asChild
                >
                  <Link
                    to='/orders'
                    search={{
                      autoid: task.linked_order_details.autoid,
                      project_id: task.project
                    }}
                    className='hover:bg-secondary/80 inline-flex cursor-pointer items-center gap-1.5 border border-transparent px-2.5 py-1 text-sm font-medium transition-colors'
                  >
                    <ShoppingCart className='size-4 shrink-0' />
                    Order {task.linked_order_details.invoice}
                  </Link>
                </Badge>
              )}
              {task.linked_proposal_details && (
                <Badge
                  variant='secondary'
                  asChild
                >
                  <Link
                    to='/proposals'
                    search={{ search: task.linked_proposal_details.quote }}
                    className='hover:bg-secondary/80 inline-flex cursor-pointer items-center gap-1.5 border border-transparent px-2.5 py-1 text-sm font-medium transition-colors'
                  >
                    <FileText className='size-4 shrink-0' />
                    Proposal {task.linked_proposal_details.quote}
                  </Link>
                </Badge>
              )}
              {task.linked_customer_details && (
                <Badge
                  variant='secondary'
                  asChild
                >
                  <Link
                    to='/customers/$customerId'
                    params={{ customerId: task.linked_customer_details.id }}
                    className='hover:bg-secondary/80 inline-flex cursor-pointer items-center gap-1.5 border border-transparent px-2.5 py-1 text-sm font-medium transition-colors'
                  >
                    <User className='size-4 shrink-0' />
                    {task.linked_customer_details.l_name}
                  </Link>
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className='mt-6 space-y-2'>
          <label className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
            Attachments
          </label>
          {task.attachments?.length ? (
            <ul className='space-y-1'>
              {task.attachments.map((a) => (
                <li key={a.id}>
                  <a
                    href={a.download_url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-primary text-sm hover:underline'
                  >
                    {a.file_name}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className='text-muted-foreground text-sm'>No attachments</p>
          )}
        </div>

        {updatedDate && (
          <p className='text-muted-foreground mt-6 text-xs'>
            Last updated {format(updatedDate, DATE_TIME_LONG)}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
