import { StickyNote } from 'lucide-react'

import type { EntityNoteType } from '@/api/note/schema'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EntityNotesTriggerProps {
  entityType: EntityNoteType
  autoid: string
  onClick: () => void
  disabled?: boolean
  className?: string
}

export const EntityNotesTrigger = ({
  entityType,
  autoid,
  onClick,
  disabled,
  className
}: EntityNotesTriggerProps) => {
  return (
    <Button
      type='button'
      variant='outline'
      size='sm'
      className={cn('h-8 min-w-0 shrink-0 gap-1.5 px-2', className)}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.stopPropagation()
          onClick()
        }
      }}
      disabled={disabled}
      aria-label={`Open notes for ${entityType} ${autoid}`}
    >
      <StickyNote className='size-3.5' />
      <span className='text-xs'>Notes</span>
    </Button>
  )
}
