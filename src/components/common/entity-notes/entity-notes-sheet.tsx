import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageSquarePlus, StickyNote } from 'lucide-react'
import { useState } from 'react'

import { NOTE_QUERY_KEYS, getEntityNotesQuery } from '@/api/note/query'
import type { EntityNoteList, EntityNoteType } from '@/api/note/schema'
import { noteService } from '@/api/note/service'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { formatDate } from '@/helpers/formatters'
import { cn } from '@/lib/utils'

interface EntityNotesSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityType: EntityNoteType
  entityLabel: string
  autoid: string
  projectId: number | null
}

const NOTE_TEXT_MAX = 500

export const EntityNotesSheet = ({
  open,
  onOpenChange,
  entityType,
  entityLabel,
  autoid,
  projectId
}: EntityNotesSheetProps) => {
  const queryClient = useQueryClient()
  const [text, setText] = useState('')

  const { data: notes = [], isLoading } = useQuery({
    ...getEntityNotesQuery(entityType, autoid, projectId),
    enabled: open && !!autoid
  })

  const createMutation = useMutation({
    mutationFn: (payload: { text: string }) =>
      noteService.createEntityNote(entityType, autoid, payload, projectId),
    meta: {
      successMessage: 'Note added',
      errorMessage: 'Failed to add note'
    },
    onSuccess: () => {
      setText('')
      queryClient.invalidateQueries({
        queryKey: NOTE_QUERY_KEYS.entityNotes(entityType, autoid, projectId)
      })
      queryClient.invalidateQueries({
        queryKey: NOTE_QUERY_KEYS.summary(entityType, autoid, projectId)
      })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || createMutation.isPending) return
    if (trimmed.length > NOTE_TEXT_MAX) return
    createMutation.mutate({ text: trimmed })
  }

  const orderedNotes = [...notes].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        className='flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md'
        side='right'
      >
        <SheetHeader className='bg-muted/30 shrink-0 border-b px-5 py-4'>
          <SheetTitle className='text-base font-semibold tracking-tight'>Notes</SheetTitle>
          <SheetDescription className='text-muted-foreground mt-0.5 text-sm'>
            {entityLabel}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className='min-h-0 flex-1'>
          <div className='flex flex-col gap-3 p-4'>
            {isLoading ? (
              <div className='flex flex-col gap-3'>
                {[1, 2, 3].map((i) => (
                  <NoteCardSkeleton key={i} />
                ))}
              </div>
            ) : orderedNotes.length === 0 ? (
              <Empty className='border-0 py-12'>
                <EmptyHeader>
                  <EmptyMedia variant='icon' className='rounded-xl'>
                    <StickyNote className='text-muted-foreground size-5' />
                  </EmptyMedia>
                  <EmptyTitle className='text-foreground font-medium'>No notes yet</EmptyTitle>
                  <EmptyContent>
                    <p className='text-muted-foreground max-w-[240px] text-sm leading-relaxed'>
                      Add a note below to keep context for this record.
                    </p>
                  </EmptyContent>
                </EmptyHeader>
              </Empty>
            ) : (
              orderedNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                />
              ))
            )}
          </div>
        </ScrollArea>

        <form
          className='shrink-0 border-t bg-background px-4 py-4'
          onSubmit={handleSubmit}
        >
          <div className='flex gap-2'>
            <Input
              type='text'
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, NOTE_TEXT_MAX))}
              placeholder='Add a note…'
              maxLength={NOTE_TEXT_MAX}
              className='min-w-0 flex-1'
              disabled={createMutation.isPending}
              aria-label='Note text'
            />
            <Button
              type='submit'
              disabled={!text.trim() || createMutation.isPending}
              className='shrink-0 gap-1.5'
            >
              <MessageSquarePlus className='size-3.5' />
              {createMutation.isPending ? 'Adding…' : 'Add'}
            </Button>
          </div>
          <p
            className={cn(
              'mt-1.5 text-xs tabular-nums',
              text.length > NOTE_TEXT_MAX * 0.9
                ? 'text-destructive'
                : 'text-muted-foreground'
            )}
          >
            {text.length}/{NOTE_TEXT_MAX}
          </p>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function NoteCardSkeleton() {
  return (
    <div className='flex gap-3 rounded-lg border border-border/80 p-3'>
      <Skeleton className='size-8 shrink-0 rounded-full' />
      <div className='min-w-0 flex-1 space-y-2'>
        <div className='flex items-baseline justify-between gap-2'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-3 w-16' />
        </div>
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-3/4' />
      </div>
    </div>
  )
}

function NoteCard({ note }: { note: EntityNoteList }) {
  const initial = (note.author_name || '?').charAt(0).toUpperCase()
  return (
    <div className='bg-muted/40 border-border/80 flex gap-3 rounded-lg border p-3 shadow-sm transition-shadow hover:shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.2)]'>
      <div
        className='bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold'
        aria-hidden
      >
        {initial}
      </div>
      <div className='min-w-0 flex-1'>
        <div className='mb-1 flex items-baseline justify-between gap-2'>
          <span className='text-foreground truncate text-sm font-medium'>{note.author_name}</span>
          <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
            {formatDate(note.created_at, 'dateTime')}
          </span>
        </div>
        <p className='text-muted-foreground whitespace-pre-wrap wrap-break-word text-sm leading-relaxed'>
          {note.text}
        </p>
      </div>
    </div>
  )
}
