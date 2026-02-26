import type { ErrorComponentProps } from '@tanstack/react-router'
import { AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { FALLBACK_ERROR_MESSAGE, getErrorMessage } from '@/helpers/error'
import { cn } from '@/lib/utils'

interface ErrorProps extends ErrorComponentProps {
  className?: string
}

export function Error({ error, reset, className }: ErrorProps) {
  const message = getErrorMessage(error)

  return (
    <div
      className={cn(
        'flex min-h-svh flex-col items-center justify-center gap-6 p-6',
        className
      )}
    >
      <div className='bg-destructive/10 flex size-16 items-center justify-center rounded-full'>
        <AlertCircle className='text-destructive size-8' />
      </div>
      <div className='flex flex-col items-center gap-1 text-center'>
        <h1 className='text-2xl font-semibold'>{FALLBACK_ERROR_MESSAGE}</h1>
        <p className='text-muted-foreground max-w-md text-sm'>{message}</p>
      </div>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  )
}
