import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'

interface FieldTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  /** Hide the chevron icon */
  hideChevron?: boolean
  ref?: React.Ref<HTMLButtonElement>
}

/**
 * Clickable property value trigger per DESIGN_SYSTEM.md:
 * - padding 4px 8px, margin -4px -8px (for alignment)
 * - icon + value + chevron
 * - bgHover on hover with 0.08s transition
 * - 5px border-radius
 */
export const FieldTrigger = ({
  children,
  hideChevron,
  className,
  ref,
  ...props
}: FieldTriggerProps) => {
  return (
    <button
      ref={ref}
      type='button'
      className={cn(
        '-mx-2 -my-1 inline-flex items-center gap-1.5 rounded-[5px] px-2 py-1',
        'transition-colors duration-80 hover:bg-bg-hover',
        'text-[13px] font-medium text-foreground',
        'cursor-pointer disabled:cursor-default disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
      {!hideChevron && <ChevronDown className='ml-0.5 size-3 shrink-0 text-text-tertiary' />}
    </button>
  )
}
