import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageSquarePlus, StickyNote, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { NOTE_QUERY_KEYS, getEntityNotesQuery } from '@/api/note/query'
import type { EntityNoteList, EntityNoteType } from '@/api/note/schema'
import { noteService } from '@/api/note/service'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
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
import { isAdmin } from '@/constants/user'
import { formatDate } from '@/helpers/formatters'
import { cn } from '@/lib/utils'
import { useAuth } from '@/providers/auth'

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
  const { user } = useAuth()
  const [text, setText] = useState('')
  const [noteToDelete, setNoteToDelete] = useState<EntityNoteList | null>(null)

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

  const deleteMutation = useMutation({
    mutationFn: (id: number) => noteService.deleteNote(id),
    meta: {
      successMessage: 'Note deleted',
      errorMessage: 'Failed to delete note'
    },
    onSuccess: () => {
      setNoteToDelete(null)
      queryClient.invalidateQueries({
        queryKey: NOTE_QUERY_KEYS.entityNotes(entityType, autoid, projectId)
      })
      queryClient.invalidateQueries({
        queryKey: NOTE_QUERY_KEYS.summary(entityType, autoid, projectId)
      })
    }
  })

  const canDeleteNote = (note: EntityNoteList) =>
    !!user && (isAdmin(user.role) || note.author === user.id)

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
        className='flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg'
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
                  isOwn={!!user && note.author === user.id}
                  canDelete={canDeleteNote(note)}
                  onDelete={() => setNoteToDelete(note)}
                  isDeleting={deleteMutation.isPending && noteToDelete?.id === note.id}
                />
              ))
            )}
          </div>
        </ScrollArea>

        <AlertDialog
          open={!!noteToDelete}
          onOpenChange={(open) => !open && setNoteToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete note?</AlertDialogTitle>
              <AlertDialogDescription>
                This note will be permanently removed. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant='destructive'
                isPending={deleteMutation.isPending}
                onClick={() => noteToDelete && deleteMutation.mutate(noteToDelete.id)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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

interface NoteCardProps {
  note: EntityNoteList
  isOwn: boolean
  canDelete: boolean
  onDelete: () => void
  isDeleting: boolean
}

function NoteCard({ note, isOwn, canDelete, onDelete, isDeleting }: NoteCardProps) {
  const initial = (note.author_name || '?').charAt(0).toUpperCase()
  return (
    <div
      className={cn(
        'group flex gap-3 rounded-lg border p-3 transition-all duration-200',
        isOwn
          ? 'border-primary/30 bg-primary/5 dark:border-primary/40 dark:bg-primary/10'
          : 'border-border/80 bg-muted/40 shadow-sm hover:shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.2)]'
      )}
    >
      <div
        className='bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold'
        aria-hidden
      >
        {initial}
      </div>
      <div className='min-w-0 flex-1'>
        <div className='mb-1 flex items-baseline justify-between gap-2'>
          <span className='text-foreground truncate text-sm font-medium'>{note.author_name}</span>
          <div className='flex shrink-0 items-center gap-1'>
            <span className='text-muted-foreground text-xs tabular-nums'>
              {formatDate(note.created_at, 'dateTime')}
            </span>
            {canDelete && (
              <Button
                type='button'
                variant='ghost'
                size='icon-xs'
                className='text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                disabled={isDeleting}
                aria-label='Delete note'
              >
                <Trash2 className='size-3' />
              </Button>
            )}
          </div>
        </div>
        <p className='text-muted-foreground whitespace-pre-wrap wrap-break-word text-sm leading-relaxed'>
          {note.text}
        </p>
      </div>
    </div>
  )
}
