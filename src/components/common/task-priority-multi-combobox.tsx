import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor
} from '@/components/ui/combobox'
import {
  getTaskPriorityColor,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_VALUES,
  type TaskPriority
} from '@/constants/task'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useLayoutEffect, useState } from 'react'

const PRIORITY_ITEMS = [...TASK_PRIORITY_VALUES]

interface TaskPriorityMultiComboboxProps {
  value: TaskPriority[]
  onValueChange: (priorities: TaskPriority[]) => void
  placeholder?: string
  disabled?: boolean
}

export const TaskPriorityMultiCombobox = ({
  value,
  onValueChange,
  placeholder = 'All Priorities',
  disabled
}: TaskPriorityMultiComboboxProps) => {
  const anchorRef = useComboboxAnchor()
  const [contentWidth, setContentWidth] = useState<number | undefined>(undefined)

  useLayoutEffect(() => {
    const el = anchorRef.current
    if (!el) return
    const update = () => setContentWidth(el.offsetWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [anchorRef])

  return (
    <Combobox
      items={PRIORITY_ITEMS}
      multiple
      value={value}
      onValueChange={(v: TaskPriority[]) => onValueChange(v)}
      disabled={disabled}
    >
      <ComboboxChips ref={anchorRef} className='w-full'>
        <ComboboxValue>
          {value.map((p) => (
            <ComboboxChip key={p}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className='flex max-w-[120px] items-center gap-1.5 truncate'>
                    <span
                      className='size-2 shrink-0 rounded-full'
                      style={{ backgroundColor: getTaskPriorityColor(p) }}
                    />
                    <span className='truncate'>{TASK_PRIORITY_LABELS[p]}</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{TASK_PRIORITY_LABELS[p]}</TooltipContent>
              </Tooltip>
            </ComboboxChip>
          ))}
        </ComboboxValue>
        <ComboboxChipsInput placeholder={placeholder} />
      </ComboboxChips>
      <ComboboxContent
        anchor={anchorRef}
        style={contentWidth !== undefined ? { width: contentWidth } : undefined}
      >
        <ComboboxEmpty>No priorities found.</ComboboxEmpty>
        <ComboboxList>
          {(p: TaskPriority) => (
            <ComboboxItem key={p} value={p}>
              <span className='flex items-center gap-1.5'>
                <span
                  className='size-2 shrink-0 rounded-full'
                  style={{ backgroundColor: getTaskPriorityColor(p) }}
                />
                {TASK_PRIORITY_LABELS[p]}
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
