import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

interface PageEmptyProps {
  icon: LucideIcon
  iconClassName?: string
  title: string
  description?: string
  action?: React.ReactNode
  compact?: boolean
}

/**
 * Unified empty state component for pages and sections.
 * `compact` uses smaller padding for inline/section empty states.
 */
export const PageEmpty = ({
  icon: Icon,
  iconClassName,
  title,
  description,
  action,
  compact,
}: PageEmptyProps) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-12' : 'py-24'
      )}
    >
      <div
        className={cn(
          'mb-3 flex items-center justify-center rounded-[10px]',
          compact ? 'size-9' : 'size-10',
          iconClassName ?? 'bg-primary/[0.08] text-primary dark:bg-primary/15'
        )}
      >
        <Icon className={compact ? 'size-[18px]' : 'size-5'} strokeWidth={1.75} />
      </div>
      <h3
        className={cn(
          'font-semibold tracking-[-0.01em] text-foreground',
          compact ? 'text-[13px]' : 'text-[14px]'
        )}
      >
        {title}
      </h3>
      {description && (
        <p className='mt-0.5 max-w-[280px] text-[13px] leading-snug text-text-tertiary'>
          {description}
        </p>
      )}
      {action && <div className='mt-3'>{action}</div>}
    </div>
  )
}
