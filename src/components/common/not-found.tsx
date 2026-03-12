import type { NotFoundRouteProps } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, FileSearch } from 'lucide-react'

export const NotFound = (_props: NotFoundRouteProps) => {
  return (
    <div className='flex min-h-svh flex-col items-center justify-center gap-5 p-6'>
      <div className='flex size-12 items-center justify-center rounded-[12px] bg-primary/[0.08] text-primary dark:bg-primary/15'>
        <FileSearch className='size-6' strokeWidth={1.75} />
      </div>

      <div className='flex flex-col items-center gap-1.5 text-center'>
        <h1 className='text-[16px] font-semibold tracking-[-0.02em] text-foreground'>
          Page not found
        </h1>
        <p className='max-w-sm text-[13px] leading-snug text-text-tertiary'>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>

      <Link
        to='/'
        className='inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-border bg-background px-3 text-[13px] font-medium text-foreground shadow-xs transition-colors duration-100 hover:bg-bg-hover active:scale-[0.98]'
      >
        <ArrowLeft className='size-3.5' />
        Back to home
      </Link>
    </div>
  )
}
