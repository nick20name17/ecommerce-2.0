import { cn } from '@/lib/utils'

const Skeleton = ({ className, ...props }: React.ComponentProps<'div'>) => {
  return (
    <div
      data-slot='skeleton'
      className={cn('rounded-md bg-foreground/[0.06]', className)}
      style={{ animation: 'skeletonPulse 1.8s ease-in-out infinite' }}
      {...props}
    />
  )
}

export { Skeleton }
