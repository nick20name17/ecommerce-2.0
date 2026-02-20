import type { TaskStatus } from '@/api/task/schema'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface TaskStatusSelectProps {
  statuses: TaskStatus[]
  value: number | null
  onValueChange: (id: number | null) => void
  placeholder?: string
  includeAll?: boolean
  disabled?: boolean
  className?: string
  triggerClassName?: string
}

export function TaskStatusSelect({
  statuses,
  value,
  onValueChange,
  placeholder = 'Select status',
  includeAll = false,
  disabled,
  className: _className,
  triggerClassName
}: TaskStatusSelectProps) {
  const sorted = [...statuses].sort((a, b) => a.order - b.order)

  return (
    <Select
      value={value == null ? 'all' : String(value)}
      onValueChange={(v) => onValueChange(v === 'all' ? null : parseInt(v, 10))}
      disabled={disabled}
    >
      <SelectTrigger className={cn('w-full', triggerClassName)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {includeAll && (
          <SelectItem value='all'>
            All Statuses
          </SelectItem>
        )}
        {sorted.map((s) => (
          <SelectItem key={s.id} value={String(s.id)}>
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
  )
}
