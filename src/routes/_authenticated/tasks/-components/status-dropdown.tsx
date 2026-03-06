import { Check } from 'lucide-react'
import { useRef, useState } from 'react'
import { RemoveScroll } from 'react-remove-scroll'

import type { TaskStatus } from '@/api/task/schema'
import { SearchInput, StatusIcon } from '@/components/ds'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface StatusDropdownProps {
  statuses: TaskStatus[]
  value: number | null
  onSelect: (id: number) => void
  trigger: React.ReactNode
  disabled?: boolean
  align?: 'start' | 'center' | 'end'
}

export function StatusDropdown({
  statuses,
  value,
  onSelect,
  trigger,
  disabled,
  align = 'start'
}: StatusDropdownProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      setSearch('')
      queueMicrotask(() => inputRef.current?.focus())
    }
  }

  const filtered = [...statuses]
    .sort((a, b) => a.order - b.order)
    .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild disabled={disabled}>
        {trigger}
      </PopoverTrigger>
      <PopoverContent
        className='w-[210px] overflow-hidden rounded-lg border-border p-1'
        align={align}
        style={{
          boxShadow: 'var(--dropdown-shadow)',
          animation: 'dropIn 0.15s ease',
        }}
      >
        <RemoveScroll>
          <SearchInput
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search...'
            containerClassName='border-b-0 mb-0.5'
          />

          <div className='max-h-60 overflow-y-auto'>
            {filtered.length === 0 ? (
              <p className='py-6 text-center text-[13px] text-text-tertiary'>
                No statuses found
              </p>
            ) : (
              filtered.map((s) => {
                const selected = s.id === value
                return (
                  <button
                    key={s.id}
                    type='button'
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-[7px] text-left text-[13px] font-medium',
                      'transition-colors duration-[80ms]',
                      selected ? 'bg-accent-bg' : 'hover:bg-bg-hover'
                    )}
                    onClick={() => {
                      onSelect(s.id)
                      setOpen(false)
                    }}
                  >
                    <StatusIcon status={s.name} color={s.color} size={16} />
                    <span className='flex-1 truncate'>{s.name}</span>
                    {selected && (
                      <Check className='size-3.5 shrink-0 text-primary' strokeWidth={2} />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </RemoveScroll>
      </PopoverContent>
    </Popover>
  )
}
