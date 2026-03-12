import { ChevronDown, X } from 'lucide-react'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export function FilterPopover({
  label,
  active,
  icon,
  children,
}: {
  label: string
  active: boolean
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type='button'
          className={cn(
            'inline-flex h-7 items-center gap-1 rounded-[5px] border px-2 text-[13px] font-medium',
            'transition-colors duration-[80ms] hover:bg-bg-hover',
            active
              ? 'border-primary/30 bg-primary/5 text-foreground'
              : 'border-border bg-background text-text-secondary'
          )}
        >
          {icon}
          {label}
          <ChevronDown className='size-2.5 text-text-tertiary' />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className='w-[180px] overflow-hidden rounded-[8px] border-border gap-0 p-1'
        align='start'
        style={{ boxShadow: 'var(--dropdown-shadow)' }}
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}

export function FilterChip({
  children,
  onRemove,
}: {
  children: React.ReactNode
  onRemove: () => void
}) {
  return (
    <span className='inline-flex items-center gap-1 rounded-[5px] border border-border bg-bg-secondary px-2 py-0.5 text-[13px] font-medium text-foreground'>
      {children}
      <button
        type='button'
        className='ml-0.5 rounded-[3px] p-0.5 text-text-tertiary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground'
        onClick={onRemove}
      >
        <X className='size-3' />
      </button>
    </span>
  )
}
