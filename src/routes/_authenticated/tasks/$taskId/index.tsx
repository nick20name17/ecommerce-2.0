import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { addDays, format, nextFriday, nextMonday } from 'date-fns'
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  Paperclip,
  Trash2,
  X
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { TASK_QUERY_KEYS, getTaskDetailQuery, getTaskStatusesQuery } from '@/api/task/query'
import type { Task } from '@/api/task/schema'
import { taskService } from '@/api/task/service'
import { TaskAttachments } from '@/components/tasks/task-attachments'
import { TaskCustomerCombobox } from '@/components/tasks/customer-combobox'
import { OrderCombobox } from '@/components/tasks/order-combobox'
import { ProposalCombobox } from '@/components/tasks/proposal-combobox'
import { UserCombobox } from '@/components/common/user-combobox/user-combobox'
import { StatusIcon } from '@/components/ds'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS } from '@/constants/task'
import type { TaskPriority } from '@/constants/task'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { useProjectId } from '@/hooks/use-project-id'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/tasks/$taskId/')({
  component: TaskDetailPage,
  head: () => ({
    meta: [{ title: 'Task Detail' }]
  })
})

// ── Helpers ──────────────────────────────────────────────────

function formatDateLong(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

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

// ── Page Component ───────────────────────────────────────────

function TaskDetailPage() {
  const { taskId } = Route.useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const [projectId] = useProjectId()
  const id = Number(taskId)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'attachments'>('details')
  const titleRef = useRef<HTMLTextAreaElement>(null)

  const autoResizeTitle = useCallback(() => {
    const el = titleRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
  }, [])

  // Fetch task
  const { data: task, isLoading } = useQuery({
    ...getTaskDetailQuery(id),
    enabled: !Number.isNaN(id)
  })

  // Fetch statuses
  const { data: statusesData } = useQuery(getTaskStatusesQuery(projectId ?? task?.project ?? null))
  const statuses = statusesData?.results ?? []
  const currentStatus = statuses.find((s) => s.id === task?.status)

  // Local state for editable fields
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')

  useEffect(() => {
    if (task?.title) {
      setTitle(task.title)
      // defer resize so DOM has updated
      queueMicrotask(autoResizeTitle)
    }
  }, [task?.title, autoResizeTitle])

  useEffect(() => {
    setDescription(task?.description ?? '')
  }, [task?.description])

  // Update mutation with optimistic updates
  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof taskService.update>[1]) =>
      taskService.update(id, payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: TASK_QUERY_KEYS.detail(id) })
      const previous = queryClient.getQueryData(TASK_QUERY_KEYS.detail(id))
      queryClient.setQueryData(
        TASK_QUERY_KEYS.detail(id),
        (old: Task | undefined) => {
          if (!old) return old
          const next = { ...old, ...payload }
          // Clear stale linked details when the autoid changes
          if ('linked_order_autoid' in payload && payload.linked_order_autoid !== old.linked_order_autoid)
            next.linked_order_details = null
          if ('linked_proposal_autoid' in payload && payload.linked_proposal_autoid !== old.linked_proposal_autoid)
            next.linked_proposal_details = null
          if ('linked_customer_autoid' in payload && payload.linked_customer_autoid !== old.linked_customer_autoid)
            next.linked_customer_details = null
          return next
        }
      )
      return { previous }
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(TASK_QUERY_KEYS.detail(id), context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.all() })
    },
    meta: { successMessage: 'Todo updated' }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => taskService.delete(id),
    meta: {
      successMessage: 'Task deleted',
      invalidatesQuery: TASK_QUERY_KEYS.lists()
    },
    onSuccess: () => {
      router.history.back()
    },
  })

  const handleTitleBlur = () => {
    if (!task) return
    const trimmed = title.trim()
    if (trimmed && trimmed !== task.title) {
      updateMutation.mutate({ title: trimmed })
    } else if (!trimmed) {
      setTitle(task.title)
    }
  }

  const handleDescriptionBlur = () => {
    if (!task) return
    const trimmed = description.trim()
    if (trimmed !== (task.description ?? '').trim()) {
      updateMutation.mutate({ description: trimmed || null })
    }
  }

  // Invalid ID
  if (Number.isNaN(id)) {
    return (
      <div className='flex h-full items-center justify-center'>
        <p className='text-text-secondary'>Invalid task ID.</p>
      </div>
    )
  }

  // Loading
  if (isLoading) {
    return (
      <div className='flex h-full flex-col overflow-hidden'>
        <header className={cn('flex shrink-0 items-center gap-2.5 border-b border-border py-2', isMobile ? 'px-4' : 'px-4')}>
          <SidebarTrigger className='-ml-1' />
          <Skeleton className='h-4 w-24' />
          <div className='flex-1' />
          <Skeleton className='h-4 w-16' />
        </header>
        <div className='flex min-h-0 flex-1'>
          <div className={cn('flex-1 overflow-y-auto', isMobile ? 'px-4 pt-5' : 'px-4 pt-6')}>
            <div className='mx-auto max-w-[640px]'>
              <Skeleton className='mb-6 h-8 w-3/4' />
              <Skeleton className='mb-8 h-32 w-full' />
            </div>
          </div>
          {!isMobile && (
            <div className='w-[320px] shrink-0 border-l border-border p-5'>
              <Skeleton className='mb-4 h-4 w-20' />
              <Skeleton className='mb-3 h-8 w-full' />
              <Skeleton className='mb-3 h-8 w-full' />
              <Skeleton className='mb-3 h-8 w-full' />
              <Skeleton className='h-8 w-full' />
            </div>
          )}
        </div>
      </div>
    )
  }

  // Not found
  if (!task) {
    return (
      <div className='flex h-full items-center justify-center'>
        <p className='text-text-secondary'>Task not found.</p>
      </div>
    )
  }

  const assigneeName = task.responsible_user_details
    ? `${task.responsible_user_details.first_name} ${task.responsible_user_details.last_name}`.trim()
    : task.responsible_user_name

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* Top bar */}
      <header className={cn('flex shrink-0 items-center justify-between border-b border-border py-2', isMobile ? 'px-4' : 'px-4')}>
        <div className='flex items-center gap-3'>
          <SidebarTrigger className='-ml-1' />
          <button
            type='button'
            className='inline-flex h-7 items-center gap-0.5 rounded-[6px] border border-border bg-bg-secondary pl-1.5 pr-2.5 text-[13px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground'
            onClick={() => router.history.back()}
          >
            <ChevronLeft className='size-3.5' />
            Back
          </button>
          <span className='text-text-tertiary'>/</span>
          <span className='text-[13px] tabular-nums text-text-tertiary'>
            TSK-{task.id.toString().padStart(3, '0')}
          </span>
        </div>
        <button
          type='button'
          className='inline-flex items-center gap-1.5 rounded-[6px] px-2.5 py-1.5 text-[13px] font-medium text-text-tertiary transition-colors duration-[80ms] hover:bg-bg-hover hover:text-destructive'
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className='size-3.5' />
          Delete
        </button>
      </header>

      {/* Content area: main + right panel */}
      <div className={cn('flex min-h-0 flex-1', isMobile && 'flex-col')}>
        {/* Main content — scrollable */}
        <div className='flex flex-1 flex-col overflow-hidden'>
          {/* Tabs */}
          <div className={cn('flex shrink-0 gap-1 border-b border-border', isMobile ? 'px-4' : 'px-4')}>
            <button
              type='button'
              className={cn(
                'relative px-3 py-2.5 text-[13px] font-medium transition-colors duration-[80ms]',
                activeTab === 'details'
                  ? 'text-foreground'
                  : 'text-text-tertiary hover:text-text-secondary'
              )}
              onClick={() => setActiveTab('details')}
            >
              Details
              {activeTab === 'details' && (
                <div className='absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-foreground' />
              )}
            </button>
            <button
              type='button'
              className={cn(
                'relative flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium transition-colors duration-[80ms]',
                activeTab === 'attachments'
                  ? 'text-foreground'
                  : 'text-text-tertiary hover:text-text-secondary'
              )}
              onClick={() => setActiveTab('attachments')}
            >
              <Paperclip className='size-3.5' />
              Attachments
              {(task.attachments?.length ?? 0) > 0 && (
                <span className='text-[11px] tabular-nums text-text-tertiary'>
                  {task.attachments!.length}
                </span>
              )}
              {activeTab === 'attachments' && (
                <div className='absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-foreground' />
              )}
            </button>
          </div>

          {/* Tab content */}
          <div className={cn('flex-1 overflow-y-auto', isMobile ? 'px-4 pt-5' : 'px-4 pt-6')}>
            <div className='mx-auto max-w-[640px] pb-16'>
              {activeTab === 'details' ? (
                <>
                  {/* Title — editable, auto-resizing */}
                  <textarea
                    ref={titleRef}
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); autoResizeTitle() }}
                    onBlur={handleTitleBlur}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() }
                    }}
                    rows={1}
                    className={cn(
                      'mb-6 w-full resize-none overflow-hidden bg-transparent font-semibold tracking-[-0.02em] leading-[1.3] outline-none',
                      'placeholder:text-text-tertiary',
                      isMobile ? 'text-xl' : 'text-[24px]'
                    )}
                    placeholder='Task title'
                  />

                  {/* Description */}
                  <div className='mb-8'>
                    <div className='mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-text-tertiary'>
                      Description
                    </div>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      onBlur={handleDescriptionBlur}
                      placeholder='Add a description...'
                      rows={5}
                      className='w-full resize-none rounded-[6px] border border-border bg-transparent px-3 py-2.5 text-sm leading-relaxed text-text-secondary placeholder:text-text-tertiary focus:border-primary focus:outline-none'
                    />
                    {task.updated_at && (
                      <p className='mt-2 text-[13px] text-text-tertiary'>
                        Last updated {formatDateTime(task.updated_at)}
                      </p>
                    )}
                  </div>

                  {/* Activity */}
                  <div>
                    <div className='mb-3 flex items-center gap-2'>
                      <span className='text-[13px] font-semibold uppercase tracking-[0.06em] text-text-tertiary'>
                        Activity
                      </span>
                      <span className='rounded-[4px] bg-bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-text-tertiary'>
                        Coming soon
                      </span>
                    </div>
                    <p className='text-[13px] text-text-tertiary'>
                      Activity feed and comments will be available here soon.
                    </p>
                  </div>
                </>
              ) : (
                <TaskAttachments taskId={task.id} attachments={task.attachments ?? []} showDropZone />
              )}
            </div>
          </div>
        </div>

        {/* Right panel — full height, border-left */}
        <div className={cn(
          'shrink-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
          isMobile
            ? 'border-t border-border px-4 py-4'
            : 'w-[320px] border-l border-border'
        )}>
          <div className={cn(isMobile ? '' : 'p-5')}>
            <div className='mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-text-tertiary'>
              Properties
            </div>

            {/* Status */}
            <PropertyRow label='Status'>
              <Popover open={statusOpen} onOpenChange={setStatusOpen}>
                <PopoverTrigger asChild>
                  <button
                    type='button'
                    className='inline-flex items-center gap-1.5 rounded-[5px] px-2 py-1 -mx-2 -my-1 text-[13px] font-medium transition-colors duration-[80ms] hover:bg-bg-hover cursor-pointer'
                  >
                    <StatusIcon status={task.status_name} color={currentStatus?.color ?? task.status_color} size={14} />
                    <span style={{ color: currentStatus?.color ?? task.status_color }}>{currentStatus?.name ?? task.status_name}</span>
                    <ChevronDown className='ml-0.5 size-3 text-text-tertiary' />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className='w-[220px] overflow-hidden rounded-[8px] border-border gap-0 p-[3px]'
                  align='start'
                  onOpenAutoFocus={(e) => e.preventDefault()}
                  style={{ boxShadow: 'var(--dropdown-shadow)' }}
                >
                  {statuses.map((s) => (
                    <button
                      key={s.id}
                      type='button'
                      className={cn(
                        'flex w-full cursor-pointer items-center gap-2 rounded-[5px] px-2 py-[5px] text-left text-[13px] font-medium',
                        'transition-colors duration-[80ms]',
                        s.id === task.status ? 'bg-accent-bg' : 'hover:bg-bg-hover'
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        setStatusOpen(false)
                        updateMutation.mutate({ status: s.id })
                      }}
                    >
                      <StatusIcon status={s.name} color={s.color} size={14} />
                      <span className='flex-1'>{s.name}</span>
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            </PropertyRow>

            {/* Priority */}
            <PropertyRow label='Priority'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type='button'
                    className='inline-flex items-center gap-1.5 rounded-[5px] px-2 py-1 -mx-2 -my-1 text-[13px] font-medium transition-colors duration-[80ms] hover:bg-bg-hover cursor-pointer'
                  >
                    <PriorityIcon priority={task.priority} color={TASK_PRIORITY_COLORS[task.priority]} size={14} />
                    <span>{TASK_PRIORITY_LABELS[task.priority]}</span>
                    <ChevronDown className='ml-0.5 size-3 text-text-tertiary' />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align='start'
                  className='w-[180px] p-0.5'
                  style={{ boxShadow: 'var(--dropdown-shadow)' }}
                >
                  {Object.entries(TASK_PRIORITY_LABELS).map(([key, label]) => (
                    <DropdownMenuItem
                      key={key}
                      className={cn(
                        'cursor-pointer gap-2 rounded-[6px] px-2 py-[5px] text-[13px] font-medium hover:!bg-bg-hover hover:!text-foreground',
                        task.priority === key && 'bg-accent-bg'
                      )}
                      onSelect={() => updateMutation.mutate({ priority: key as TaskPriority })}
                    >
                      <PriorityIcon priority={key} color={TASK_PRIORITY_COLORS[key as TaskPriority]} size={14} />
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </PropertyRow>

            {/* Due date */}
            <PropertyRow label='Due date'>
              <div className='flex items-center'>
                <DueDatePicker
                  value={task.due_date ?? null}
                  onChange={(date) => updateMutation.mutate({ due_date: date })}
                />
              </div>
            </PropertyRow>

            {/* Assignee */}
            <PropertyRow label='Assignee'>
              <UserCombobox
                value={task.responsible_user ?? null}
                onChange={(userId) => updateMutation.mutate({ responsible_user: userId })}
                placeholder='Unassigned'
                valueLabel={assigneeName ?? undefined}
                triggerClassName={cn(
                  'inline-flex items-center gap-1.5 rounded-[5px] px-2 py-1 -mx-2 -my-1 text-[13px] font-medium transition-colors duration-[80ms] hover:bg-bg-hover cursor-pointer',
                  !task.responsible_user && 'text-text-tertiary'
                )}
              />
            </PropertyRow>

            {/* Reference section */}
            <div className='mt-4 border-t border-border-light pt-3'>
              <div className='mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-text-tertiary'>
                Reference
              </div>

              <PropertyRow label='Order'>
                <OrderCombobox
                  value={task.linked_order_autoid ?? null}
                  onChange={(autoid) => updateMutation.mutate({ linked_order_autoid: autoid })}
                  projectId={task.project}
                  placeholder='None'
                  valueLabel={task.linked_order_details ? `Order ${task.linked_order_details.invoice}` : undefined}
                  triggerClassName={cn(
                    'inline-flex items-center gap-1.5 rounded-[5px] px-2 py-1 -mx-2 -my-1 text-[13px] font-medium transition-colors duration-[80ms] hover:bg-bg-hover cursor-pointer',
                    !task.linked_order_autoid && 'text-text-tertiary'
                  )}
                />
              </PropertyRow>

              <PropertyRow label='Proposal'>
                <ProposalCombobox
                  value={task.linked_proposal_autoid ?? null}
                  onChange={(autoid) => updateMutation.mutate({ linked_proposal_autoid: autoid })}
                  projectId={task.project}
                  placeholder='None'
                  valueLabel={task.linked_proposal_details ? `Proposal ${task.linked_proposal_details.quote}` : undefined}
                  triggerClassName={cn(
                    'inline-flex items-center gap-1.5 rounded-[5px] px-2 py-1 -mx-2 -my-1 text-[13px] font-medium transition-colors duration-[80ms] hover:bg-bg-hover cursor-pointer',
                    !task.linked_proposal_autoid && 'text-text-tertiary'
                  )}
                />
              </PropertyRow>

              <PropertyRow label='Customer'>
                <TaskCustomerCombobox
                  value={task.linked_customer_autoid ?? null}
                  onChange={(autoid) => updateMutation.mutate({ linked_customer_autoid: autoid })}
                  projectId={task.project}
                  placeholder='None'
                  valueLabel={task.linked_customer_details?.l_name ?? undefined}
                  triggerClassName={cn(
                    'inline-flex items-center gap-1.5 rounded-[5px] px-2 py-1 -mx-2 -my-1 text-[13px] font-medium transition-colors duration-[80ms] hover:bg-bg-hover cursor-pointer',
                    !task.linked_customer_autoid && 'text-text-tertiary'
                  )}
                />
              </PropertyRow>
            </div>

            {/* Created by metadata */}
            <div className='mt-4 border-t border-border-light pt-3'>
              <div className='text-[13px] text-text-tertiary'>
                <span>Created by </span>
                <span className='font-medium text-text-secondary'>
                  {task.author_details?.full_name ?? task.author_name ?? '\u2014'}
                </span>
              </div>
              <div className='mt-1 text-[13px] text-text-tertiary'>
                {formatDateLong(task.created_at)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      {deleteOpen && (
        <>
          <div className='fixed inset-0 z-40 bg-black/40' onClick={() => setDeleteOpen(false)} />
          <div className='fixed inset-0 z-50 flex items-center justify-center px-4'>
            <div className='w-full max-w-[400px] rounded-[12px] border border-border bg-background p-6' style={{ boxShadow: '0 16px 70px rgba(0,0,0,.2)' }}>
              <h3 className='mb-2 text-[15px] font-semibold'>Delete task</h3>
              <p className='mb-5 text-[13px] text-text-secondary'>
                Are you sure you want to delete &ldquo;{task.title}&rdquo;? This action cannot be undone.
              </p>
              <div className='flex justify-end gap-2'>
                <button
                  type='button'
                  className='rounded-[6px] border border-border px-3 py-1.5 text-[13px] font-medium transition-colors duration-[80ms] hover:bg-bg-hover'
                  onClick={() => setDeleteOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type='button'
                  className='rounded-[6px] bg-destructive px-3 py-1.5 text-[13px] font-medium text-white transition-colors duration-[80ms] hover:opacity-90'
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Property Row ─────────────────────────────────────────────

function PropertyRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className='mb-3'>
      <div className='mb-1 text-[13px] font-medium text-text-tertiary'>{label}</div>
      <div className='flex items-center'>{children}</div>
    </div>
  )
}

// ── Linear-style Due Date Picker ─────────────────────────────

const DATE_PRESETS = [
  { label: 'Today', getDate: () => new Date() },
  { label: 'Tomorrow', getDate: () => addDays(new Date(), 1) },
  { label: 'Next Monday', getDate: () => nextMonday(new Date()) },
  { label: 'Next Friday', getDate: () => nextFriday(new Date()) },
  { label: 'In 2 weeks', getDate: () => addDays(new Date(), 14) },
] as const

function DueDatePicker({
  value,
  onChange,
}: {
  value: string | null
  onChange: (date: string | null) => void
}) {
  const [open, setOpen] = useState(false)

  const handleSelect = (date: Date | undefined) => {
    onChange(date ? format(date, 'yyyy-MM-dd') : null)
    setOpen(false)
  }

  const handlePreset = (getDate: () => Date) => {
    onChange(format(getDate(), 'yyyy-MM-dd'))
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type='button'
          className={cn(
            'inline-flex items-center gap-1.5 rounded-[5px] px-2 py-1 -mx-2 -my-1 text-[13px] font-medium transition-colors duration-[80ms] hover:bg-bg-hover cursor-pointer',
            !value && 'text-text-tertiary'
          )}
        >
          <CalendarDays className='size-3.5 shrink-0 text-text-tertiary' />
          <span>{value ? formatDateLong(value) : 'Not set'}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className='w-auto overflow-hidden rounded-[10px] p-0'
        side='left'
        align='start'
        collisionPadding={16}
        style={{ boxShadow: 'var(--dropdown-shadow)' }}
      >
        {/* Quick presets */}
        <div className='border-b border-border-light p-1.5'>
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type='button'
              className='flex w-full items-center justify-between rounded-[6px] px-2.5 py-[5px] text-[13px] transition-colors duration-[80ms] hover:bg-bg-hover'
              onClick={() => handlePreset(preset.getDate)}
            >
              <span className='font-medium'>{preset.label}</span>
              <span className='text-[13px] tabular-nums text-text-tertiary'>
                {format(preset.getDate(), 'MMM d')}
              </span>
            </button>
          ))}
          {value && (
            <button
              type='button'
              className='flex w-full items-center rounded-[6px] px-2.5 py-[5px] text-[13px] font-medium text-text-tertiary transition-colors duration-[80ms] hover:bg-bg-hover hover:text-foreground'
              onClick={() => { onChange(null); setOpen(false) }}
            >
              No date
            </button>
          )}
        </div>

        {/* Calendar */}
        <Calendar
          mode='single'
          selected={value ? new Date(value) : undefined}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  )
}
