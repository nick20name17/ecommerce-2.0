import type { TaskPriority } from '@/constants/task'
import {
  getTaskPriorityColor,
  TASK_PRIORITY_LABELS
} from '@/constants/task'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const PRIORITY_ENTRIES = Object.entries(TASK_PRIORITY_LABELS) as [TaskPriority, string][]

interface TaskPrioritySelectProps {
  value: TaskPriority | ''
  onValueChange: (value: TaskPriority | '') => void
  placeholder?: string
  includeAll?: boolean
  disabled?: boolean
  className?: string
  triggerClassName?: string
}

export function TaskPrioritySelect({
  value,
  onValueChange,
  placeholder = 'Select priority',
  includeAll = false,
  disabled,
  className,
  triggerClassName
}: TaskPrioritySelectProps) {
  return (
    <Select
      value={value || 'all'}
      onValueChange={(v) => onValueChange((v === 'all' ? '' : v) as TaskPriority | '')}
      disabled={disabled}
    >
      <SelectTrigger className={cn('w-full', triggerClassName)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {includeAll && (
          <SelectItem value='all'>
            All Priorities
          </SelectItem>
        )}
        {PRIORITY_ENTRIES.map(([priorityValue, label]) => (
          <SelectItem key={priorityValue} value={priorityValue}>
            <span className='flex items-center gap-1.5'>
              <span
                className='size-2 shrink-0 rounded-full'
                style={{ backgroundColor: getTaskPriorityColor(priorityValue) }}
              />
              {label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
