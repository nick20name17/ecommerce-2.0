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
        'bg-card rounded-xl border transition-all',
        !allowOverflow && 'overflow-hidden',
        isDisabled && 'opacity-60'
      )}
    >
      <div className='bg-muted/30 flex items-center gap-3 border-b px-4 py-3'>
        {step !== undefined && (
          <div
            className={cn(
              'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
              isComplete ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}
          >
            {step}
          </div>
        )}
        {icon && !step && (
          <div className='bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg'>
            {icon}
          </div>
        )}
        <div className='min-w-0 flex-1'>
          <h3 className='text-sm font-semibold'>{title}</h3>
          {description && <p className='text-muted-foreground text-xs'>{description}</p>}
        </div>
        {trailing}
      </div>
      <div className={cn(!noPadding && 'p-4')}>{children}</div>
    </div>
  )
}
