import type { NotFoundRouteProps } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { FileQuestion } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function NotFound(_props: NotFoundRouteProps) {
  return (
    <div className='flex min-h-svh flex-col items-center justify-center gap-6 p-6'>
      <div className='bg-muted/50 flex size-16 items-center justify-center rounded-full'>
        <FileQuestion className='text-muted-foreground size-8' />
      </div>
      <div className='flex flex-col items-center gap-1 text-center'>
        <h1 className='text-2xl font-semibold'>Page not found</h1>
        <p className='text-muted-foreground max-w-sm text-sm'>
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <Button asChild>
        <Link to='/'>Go home</Link>
      </Button>
    </div>
  )
}
