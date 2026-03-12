import type { ErrorComponentProps } from '@tanstack/react-router'
import { RotateCw, TriangleAlert } from 'lucide-react'

import { FALLBACK_ERROR_MESSAGE, getErrorMessage } from '@/helpers/error'
import { cn } from '@/lib/utils'

interface ErrorProps extends ErrorComponentProps {
  className?: string
}

export const Error = ({ error, reset, className }: ErrorProps) => {
  const message = getErrorMessage(error)

  return (
    <div className={cn('flex min-h-svh flex-col items-center justify-center gap-5 p-6', className)}>
      <div className='flex size-12 items-center justify-center rounded-[12px] bg-destructive/10 text-destructive'>
        <TriangleAlert className='size-6' strokeWidth={1.75} />
      </div>

      <div className='flex flex-col items-center gap-1.5 text-center'>
        <h1 className='text-[16px] font-semibold tracking-[-0.02em] text-foreground'>
          {FALLBACK_ERROR_MESSAGE}
        </h1>
        <p className='max-w-sm text-[13px] leading-snug text-text-tertiary'>{message}</p>
      </div>

      <button
        type='button'
        onClick={() => reset()}
        className='inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-border bg-background px-3 text-[13px] font-medium text-foreground shadow-xs transition-colors duration-100 hover:bg-bg-hover active:scale-[0.98]'
      >
        <RotateCw className='size-3.5' />
        Try again
      </button>
    </div>
  )
}
