import { cn } from '@/lib/utils'

interface TagProps {
  children: React.ReactNode
  /** 'default' = bgSecondary + textTertiary (tables), 'accent' = accentBg + accent (detail header) */
  variant?: 'default' | 'accent'
  className?: string
}

/**
 * Inline chip / tag per DESIGN_SYSTEM.md:
 * - Default (table): bgSecondary bg, textTertiary color, 1px 6px padding, 4px radius
 * - Accent (detail header): accentBg bg, accent color, 2px 8px padding
 */
export function Tag({ children, variant = 'default', className }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-[4px] text-[13px] font-medium leading-none',
        variant === 'default' && 'bg-bg-secondary px-1.5 py-0.5 text-text-tertiary',
        variant === 'accent' && 'bg-accent-bg px-2 py-[2px] text-primary',
        className
      )}
    >
      {children}
    </span>
  )
}
