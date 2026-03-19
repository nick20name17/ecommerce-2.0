import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Calendar,
  ChevronDown,
  Plus,
} from 'lucide-react'
import { addDays, format, nextFriday, nextMonday } from 'date-fns'
import { useRef, useState } from 'react'

import { TaskCustomerCombobox } from './customer-combobox'
import { OrderCombobox } from './order-combobox'
import { ProposalCombobox } from './proposal-combobox'
import { TASK_QUERY_KEYS, getTaskStatusesQuery } from '@/api/task/query'
import type { TaskStatus } from '@/api/task/schema'
import { taskService } from '@/api/task/service'
import { UserCombobox } from '@/components/common/user-combobox/user-combobox'
import { isSuperAdmin, USER_ROLES } from '@/constants/user'
import { useAuth } from '@/providers/auth'
import { StatusIcon } from '@/components/ds'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { TASK_PRIORITY, TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS } from '@/constants/task'
import type { TaskPriority } from '@/constants/task'
import { useProjectId } from '@/hooks/use-project-id'
import { cn } from '@/lib/utils'

// ── Helpers ──────────────────────────────────────────────────

const PRIORITY_BARS: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
}

export function PriorityIcon({ priority, color, size = 14 }: { priority: string; color: string; size?: number }) {
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

const CMD_DATE_PRESETS = [
  { label: 'Today', getDate: () => new Date() },
  { label: 'Tomorrow', getDate: () => addDays(new Date(), 1) },
  { label: 'Next Monday', getDate: () => nextMonday(new Date()) },
  { label: 'Next Friday', getDate: () => nextFriday(new Date()) },
  { label: 'In 2 weeks', getDate: () => addDays(new Date(), 14) },
] as const

// ── Component ────────────────────────────────────────────────

interface CommandBarCreateProps {
  onClose: () => void
  defaultLinkedOrderAutoid?: string | null
  defaultLinkedProposalAutoid?: string | null
  defaultLinkedCustomerAutoid?: string | null
  lockLinkedCustomer?: boolean
  linkedCustomerLabel?: string | null
}

export function CommandBarCreate({
  onClose,
  defaultLinkedOrderAutoid,
  defaultLinkedProposalAutoid,
  defaultLinkedCustomerAutoid,
  lockLinkedCustomer,
  linkedCustomerLabel,
}: CommandBarCreateProps) {
  const [projectId] = useProjectId()
  const { data: statusesData } = useQuery(getTaskStatusesQuery(projectId ?? null))
  const statuses = statusesData?.results ?? []

  if (statuses.length === 0) return null

  return (
    <CommandBarCreateInner
      statuses={statuses}
      onClose={onClose}
      defaultLinkedOrderAutoid={defaultLinkedOrderAutoid}
      defaultLinkedProposalAutoid={defaultLinkedProposalAutoid}
      defaultLinkedCustomerAutoid={defaultLinkedCustomerAutoid}
      lockLinkedCustomer={lockLinkedCustomer}
      linkedCustomerLabel={linkedCustomerLabel}
    />
  )
}

function CommandBarCreateInner({
  statuses,
  onClose,
  defaultLinkedOrderAutoid,
  defaultLinkedProposalAutoid,
  defaultLinkedCustomerAutoid,
  lockLinkedCustomer,
  linkedCustomerLabel,
}: {
  statuses: TaskStatus[]
  onClose: () => void
  defaultLinkedOrderAutoid?: string | null
  defaultLinkedProposalAutoid?: string | null
  defaultLinkedCustomerAutoid?: string | null
  lockLinkedCustomer?: boolean
  linkedCustomerLabel?: string | null
}) {
  const { user } = useAuth()
  const userIsSuperAdmin = !!user?.role && isSuperAdmin(user.role)
  const [projectId] = useProjectId()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | null>(
    () => statuses.find((s) => s.is_default) ?? statuses[0] ?? null
  )
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority>(TASK_PRIORITY.medium)
  const [selectedAssignee, setSelectedAssignee] = useState<number | null>(null)
  const [selectedDueDate, setSelectedDueDate] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<string | null>(defaultLinkedOrderAutoid ?? null)
  const [selectedProposal, setSelectedProposal] = useState<string | null>(defaultLinkedProposalAutoid ?? null)
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(defaultLinkedCustomerAutoid ?? null)
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
        ...(userIsSuperAdmin && projectId != null ? { project: projectId } : {}),
        responsible_user: selectedAssignee,
        due_date: selectedDueDate,
        linked_order_autoid: selectedOrder,
        linked_proposal_autoid: selectedProposal,
        linked_customer_autoid: selectedCustomer,
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
                  className='inline-flex items-center gap-1.5 rounded-[6px] bg-bg-secondary px-2.5 py-1.5 text-[13px] font-medium text-foreground transition-colors duration-[80ms] hover:bg-bg-hover'
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
                  className='inline-flex items-center gap-1.5 rounded-[6px] bg-bg-secondary px-2.5 py-1.5 text-[13px] font-medium text-foreground transition-colors duration-[80ms] hover:bg-bg-hover'
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
              excludeRoles={[USER_ROLES.superadmin]}
              triggerClassName='inline-flex items-center gap-1.5 rounded-[6px] bg-bg-secondary px-2.5 py-1.5 text-[13px] font-medium text-text-tertiary transition-colors duration-[80ms] hover:bg-bg-hover cursor-pointer'
            />

            {/* Due date */}
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <button
                  type='button'
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-[6px] bg-bg-secondary px-2.5 py-1.5 text-[13px] font-medium transition-colors duration-[80ms] hover:bg-bg-hover',
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
                        <span className='text-[13px] text-text-tertiary'>{format(resolved, 'MMM d')}</span>
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

          {/* Reference */}
          <div className='border-t border-border-light px-5 py-2.5'>
            <div className='mb-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-text-tertiary'>Reference</div>
            <div className='flex flex-col gap-1'>
              <div className='flex items-center gap-2'>
                <span className='w-[60px] shrink-0 text-[13px] font-medium text-text-tertiary'>Order</span>
                <OrderCombobox
                  value={selectedOrder}
                  onChange={setSelectedOrder}
                  projectId={projectId}
                  placeholder='None'
                  triggerClassName={cn(
                    'inline-flex items-center gap-1.5 rounded-[5px] px-2 py-1 text-[13px] font-medium transition-colors duration-[80ms] hover:bg-bg-hover cursor-pointer',
                    selectedOrder ? 'text-foreground' : 'text-text-tertiary'
                  )}
                />
              </div>
              <div className='flex items-center gap-2'>
                <span className='w-[60px] shrink-0 text-[13px] font-medium text-text-tertiary'>Proposal</span>
                <ProposalCombobox
                  value={selectedProposal}
                  onChange={setSelectedProposal}
                  projectId={projectId}
                  placeholder='None'
                  triggerClassName={cn(
                    'inline-flex items-center gap-1.5 rounded-[5px] px-2 py-1 text-[13px] font-medium transition-colors duration-[80ms] hover:bg-bg-hover cursor-pointer',
                    selectedProposal ? 'text-foreground' : 'text-text-tertiary'
                  )}
                />
              </div>
              <div className='flex items-center gap-2'>
                <span className='w-[60px] shrink-0 text-[13px] font-medium text-text-tertiary'>Customer</span>
                {lockLinkedCustomer && selectedCustomer ? (
                  <span className='inline-flex items-center gap-1.5 rounded-[5px] px-2 py-1 text-[13px] font-medium text-foreground'>
                    {linkedCustomerLabel ?? selectedCustomer}
                  </span>
                ) : (
                  <TaskCustomerCombobox
                    value={selectedCustomer}
                    onChange={setSelectedCustomer}
                    projectId={projectId}
                    placeholder='None'
                    triggerClassName={cn(
                      'inline-flex items-center gap-1.5 rounded-[5px] px-2 py-1 text-[13px] font-medium transition-colors duration-[80ms] hover:bg-bg-hover cursor-pointer',
                      selectedCustomer ? 'text-foreground' : 'text-text-tertiary'
                    )}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className='border-t border-border' />

          {/* Footer hints */}
          <div className='flex items-center justify-between px-5 py-2.5'>
            <div className='flex items-center gap-3'>
              <button type='button' className='text-[13px] text-text-tertiary transition-colors hover:text-text-secondary' onClick={handleSubmit}>
                <kbd className='rounded border border-border bg-bg-secondary px-1 py-0.5 text-[13px] font-medium'>Enter</kbd> to create
              </button>
              <button type='button' className='text-[13px] text-text-tertiary transition-colors hover:text-text-secondary' onClick={onClose}>
                <kbd className='rounded border border-border bg-bg-secondary px-1 py-0.5 text-[13px] font-medium'>Esc</kbd> to cancel
              </button>
            </div>
            <button
              type='button'
              className={cn(
                'rounded-[6px] bg-primary px-3 py-1 text-[13px] font-medium text-primary-foreground transition-colors duration-[80ms]',
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
