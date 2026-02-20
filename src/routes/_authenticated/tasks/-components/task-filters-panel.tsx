import type { TaskStatus } from '@/api/task/schema'
import type { TaskPriority } from '@/constants/task'
import { TaskPrioritySelect } from '@/components/common/task-priority-select'
import { TaskStatusSelect } from '@/components/common/task-status-select'
import { UserCombobox } from '@/routes/_authenticated/tasks/-components/user-combobox'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Field, FieldLabel } from '@/components/ui/field'
import { cn } from '@/lib/utils'

interface TaskFiltersPanelProps {
  statuses: TaskStatus[]
  taskStatusId: number | null
  onTaskStatusChange: (id: number | null) => void
  priority: TaskPriority | ''
  onPriorityChange: (value: TaskPriority | '') => void
  responsibleUserId: number | null
  onResponsibleChange: (id: number | null) => void
  dueFrom: Date | undefined
  onDueFromChange: (date: Date | undefined) => void
  dueTo: Date | undefined
  onDueToChange: (date: Date | undefined) => void
  hasAnyFilter: boolean
  onClearFilters: () => void
  className?: string
}

export function TaskFiltersPanel({
  statuses,
  taskStatusId,
  onTaskStatusChange,
  priority,
  onPriorityChange,
  responsibleUserId,
  onResponsibleChange,
  dueFrom,
  onDueFromChange,
  dueTo,
  onDueToChange,
  hasAnyFilter,
  onClearFilters,
  className
}: TaskFiltersPanelProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-4',
        className
      )}
    >
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <Field className='flex flex-col gap-1.5'>
          <FieldLabel className='text-xs font-medium text-muted-foreground'>
            Status
          </FieldLabel>
          <TaskStatusSelect
            statuses={statuses}
            value={taskStatusId}
            onValueChange={onTaskStatusChange}
            placeholder='All Statuses'
            includeAll
          />
        </Field>

        <Field className='flex flex-col gap-1.5'>
          <FieldLabel className='text-xs font-medium text-muted-foreground'>
            Priority
          </FieldLabel>
          <TaskPrioritySelect
            value={priority}
            onValueChange={onPriorityChange}
            placeholder='All Priorities'
            includeAll
          />
        </Field>

        <Field className='flex flex-col gap-1.5'>
          <FieldLabel className='text-xs font-medium text-muted-foreground'>
            Responsible
          </FieldLabel>
          <UserCombobox
            value={responsibleUserId}
            onChange={onResponsibleChange}
            placeholder='All Users'
          />
        </Field>

        <Field className='flex flex-col gap-1.5'>
          <FieldLabel className='text-xs font-medium text-muted-foreground'>
            Due Date From
          </FieldLabel>
          <DatePicker
            value={dueFrom}
            onChange={onDueFromChange}
            placeholder='Select date'
          />
        </Field>

        <Field className='flex flex-col gap-1.5'>
          <FieldLabel className='text-xs font-medium text-muted-foreground'>
            Due Date To
          </FieldLabel>
          <DatePicker
            value={dueTo}
            onChange={onDueToChange}
            placeholder='Select date'
          />
        </Field>
      </div>

      {hasAnyFilter && (
        <div className='mt-4 flex justify-end'>
          <Button variant='ghost' size='sm' onClick={onClearFilters}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  )
}
