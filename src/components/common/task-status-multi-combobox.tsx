import type { TaskStatus } from '@/api/task/schema'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useLayoutEffect, useState } from 'react'

interface TaskStatusMultiComboboxProps {
  statuses: TaskStatus[]
  value: number[]
  onValueChange: (ids: number[]) => void
  placeholder?: string
  disabled?: boolean
}

export const TaskStatusMultiCombobox = ({
  statuses,
  value,
  onValueChange,
  placeholder = 'All Statuses',
  disabled
}: TaskStatusMultiComboboxProps) => {
  const anchorRef = useComboboxAnchor()
  const [contentWidth, setContentWidth] = useState<number | undefined>(undefined)
  const sorted = [...statuses].sort((a, b) => a.order - b.order)
  const selectedStatuses = sorted.filter((s) => value.includes(s.id))

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
      items={sorted}
      multiple
      value={selectedStatuses}
      onValueChange={(selected: TaskStatus[]) => onValueChange(selected.map((s) => s.id))}
      itemToStringValue={(s) => String(s.id)}
      itemToStringLabel={(s) => s.name}
      isItemEqualToValue={(a: TaskStatus, b: TaskStatus) => a.id === b.id}
      disabled={disabled}
    >
      <ComboboxChips ref={anchorRef} className='w-full'>
        <ComboboxValue>
          {selectedStatuses.map((s: TaskStatus) => (
            <ComboboxChip key={s.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className='flex max-w-[120px] items-center gap-1.5 truncate'>
                    <span
                      className='size-2 shrink-0 rounded-full'
                      style={{ backgroundColor: s.color }}
                    />
                    <span className='truncate'>{s.name}</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{s.name}</TooltipContent>
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
        <ComboboxEmpty>No statuses found.</ComboboxEmpty>
        <ComboboxList>
          {(s: TaskStatus) => (
            <ComboboxItem key={s.id} value={s}>
              <span className='flex items-center gap-1.5'>
                <span
                  className='size-2 shrink-0 rounded-full'
                  style={{ backgroundColor: s.color }}
                />
                {s.name}
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
