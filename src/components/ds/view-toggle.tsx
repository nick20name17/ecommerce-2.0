import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface ViewOption<T extends string = string> {
  value: T
  label: string
  icon?: LucideIcon
}

interface ViewToggleProps<T extends string = string> {
  options: ViewOption<T>[]
  value: T
  onChange: (value: T) => void
  /** Hide labels on mobile — only show icons */
  compact?: boolean
}

export function ViewToggle<T extends string>({
  options,
  value,
  onChange,
  compact,
}: ViewToggleProps<T>) {
  return (
    <div className='flex items-center rounded-[5px] border border-border bg-background p-[3px]'>
      {options.map((opt) => (
        <button
          key={opt.value}
          type='button'
          className={cn(
            'inline-flex items-center gap-1 rounded-[3px] px-1.5 py-[3px] text-[13px] font-medium transition-colors duration-[80ms]',
            value === opt.value
              ? 'bg-bg-active text-foreground'
              : 'text-text-tertiary hover:text-text-secondary'
          )}
          aria-label={`Switch to ${opt.label.toLowerCase()} view`}
          onClick={() => onChange(opt.value)}
        >
          {opt.icon && <opt.icon className='size-3' />}
          {!compact && opt.label}
        </button>
      ))}
    </div>
  )
}
