import { Loader2 } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDate, formatResponseTime } from '@/helpers/formatters'
import { cn } from '@/lib/utils'

export function HealthCell({
  status,
  responseMs,
  lastChecked,
  isLoading
}: {
  status: 'healthy' | 'unhealthy' | null
  responseMs?: number
  lastChecked?: string
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <span className='flex size-6 items-center justify-center'>
        <Loader2 className='text-muted-foreground size-4 animate-spin' />
      </span>
    )
  }

  if (status === null) {
    return <span className='text-muted-foreground flex size-6 items-center justify-center text-sm'>—</span>
  }

  const isHealthy = status === 'healthy'
  const isUnhealthy = status === 'unhealthy'

  const tooltipLines: string[] = []
  if (responseMs !== undefined) tooltipLines.push(`Response: ${formatResponseTime(responseMs)}`)
  if (lastChecked) tooltipLines.push(`Last checked: ${formatDate(lastChecked, 'dateTime')}`)

  const trigger = (
    <span
      className={cn(
        'flex size-6 items-center justify-center rounded-full p-1 transition-all hover:scale-120',
        isHealthy && 'bg-green-500/15',
        isUnhealthy && 'bg-destructive/15'
      )}
    >
      <span
        className={cn(
          'size-full rounded-full',
          isHealthy && 'bg-green-500',
          isUnhealthy && 'bg-destructive'
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
          {tooltipLines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
