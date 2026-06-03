import { cn } from '@/lib/utils'

export const CreatePageSection = ({
  icon,
  title,
  description,
  trailing,
  step,
  isComplete,
  isDisabled,
  noPadding,
  allowOverflow,
  children
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  trailing?: React.ReactNode
  step?: number
  isComplete?: boolean
  isDisabled?: boolean
  noPadding?: boolean
  allowOverflow?: boolean
  children: React.ReactNode
}) => {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card transition-all',
        !allowOverflow && 'overflow-hidden',
        isDisabled && 'opacity-60'
      )}
    >
      <div className='flex items-center gap-3 border-b bg-bg-secondary/30 px-4 py-3'>
        {step !== undefined && (
          <div
            className={cn(
              'flex size-6 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold transition-colors',
              isComplete
                ? 'bg-primary text-primary-foreground'
                : 'bg-bg-secondary text-text-tertiary'
            )}
          >
            {step}
          </div>
        )}
        {icon && !step && (
          <div className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-bg-secondary text-text-tertiary'>
            {icon}
          </div>
        )}
        <div className='min-w-0 flex-1'>
          <h3 className='text-sm font-semibold'>{title}</h3>
          {description && <p className='text-[13px] text-text-tertiary'>{description}</p>}
        </div>
        {trailing}
      </div>
      <div className={cn(!noPadding && 'p-4')}>{children}</div>
    </div>
  )
}
