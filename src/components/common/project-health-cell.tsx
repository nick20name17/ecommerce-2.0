import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDate, formatResponseTime } from '@/helpers/formatters'
import { cn } from '@/lib/utils'

export function HealthCell({
  status,
  responseMs,
  lastChecked
}: {
  status: 'healthy' | 'unhealthy' | null
  responseMs?: number
  lastChecked?: string
}) {
  const isHealthy = status === 'healthy'
  const isUnhealthy = status === 'unhealthy'
  const isEmpty = status === null

  const tooltipLines: string[] = []
  if (responseMs !== undefined) tooltipLines.push(`Response: ${formatResponseTime(responseMs)}`)
  if (lastChecked) tooltipLines.push(`Last checked: ${formatDate(lastChecked, 'dateTime')}`)

  const trigger = (
    <span
      className={cn(
        'flex size-6 items-center justify-center rounded-full p-1 transition-all hover:scale-120',
        isHealthy && 'bg-green-500/15',
        isUnhealthy && 'bg-destructive/15',
        isEmpty && 'bg-muted'
      )}
    >
      <span
        className={cn(
          'size-full rounded-full',
          isHealthy && 'bg-green-500',
          isUnhealthy && 'bg-destructive',
          isEmpty && 'bg-muted-foreground/50'
        )}
      />
    </span>
  )

  if (tooltipLines.length === 0) {
    return <span className='inline-flex'>{trigger}</span>
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className='inline-flex'>{trigger}</span>
      </TooltipTrigger>
      <TooltipContent>
        <div className='flex flex-col gap-0.5'>
          {tooltipLines.map((line, i) => (
            <span key={i}>{line}</span>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
