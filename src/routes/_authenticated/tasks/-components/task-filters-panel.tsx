import type { TaskStatus } from '@/api/task/schema'
import { TaskPriorityMultiCombobox } from '@/components/common/task-priority-multi-combobox'
import { TaskStatusMultiCombobox } from '@/components/common/task-status-multi-combobox'
import { UserCombobox } from '@/components/common/user-combobox/user-combobox'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Field, FieldLabel } from '@/components/ui/field'
import type { TaskPriority } from '@/constants/task'
import { cn } from '@/lib/utils'

interface TaskFiltersPanelProps {
  statuses: TaskStatus[]
  taskStatusIds: number[]
  onTaskStatusChange: (ids: number[]) => void
  priorities: TaskPriority[]
  onPriorityChange: (priorities: TaskPriority[]) => void
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

export const TaskFiltersPanel = ({
  statuses,
  taskStatusIds,
  onTaskStatusChange,
  priorities,
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
}: TaskFiltersPanelProps) => {
  return (
    <div className={cn('border-border bg-card rounded-lg border p-4', className)}>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <Field className='flex flex-col gap-1.5'>
          <FieldLabel className='text-muted-foreground text-xs font-medium'>Status</FieldLabel>
          <TaskStatusMultiCombobox
            statuses={statuses}
            value={taskStatusIds}
            onValueChange={onTaskStatusChange}
            placeholder='All Statuses'
          />
        </Field>

        <Field className='flex flex-col gap-1.5'>
          <FieldLabel className='text-muted-foreground text-xs font-medium'>Priority</FieldLabel>
          <TaskPriorityMultiCombobox
            value={priorities}
            onValueChange={onPriorityChange}
            placeholder='All Priorities'
          />
        </Field>

        <Field className='flex flex-col gap-1.5'>
          <FieldLabel className='text-muted-foreground text-xs font-medium'>Responsible</FieldLabel>
          <UserCombobox
            value={responsibleUserId}
            onChange={onResponsibleChange}
            placeholder='All Users'
          />
        </Field>

        <Field className='flex flex-col gap-1.5'>
          <FieldLabel className='text-muted-foreground text-xs font-medium'>
            Due Date From
          </FieldLabel>
          <DatePicker
            showTime
            value={dueFrom}
            onChange={onDueFromChange}
            placeholder='Select date'
          />
        </Field>

        <Field className='flex flex-col gap-1.5'>
          <FieldLabel className='text-muted-foreground text-xs font-medium'>Due Date To</FieldLabel>
          <DatePicker
            showTime
            value={dueTo}
            onChange={onDueToChange}
            placeholder='Select date'
          />
        </Field>
      </div>

      {hasAnyFilter && (
        <div className='mt-4 flex justify-end'>
          <Button
            variant='ghost'
            size='sm'
            onClick={onClearFilters}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  )
}
