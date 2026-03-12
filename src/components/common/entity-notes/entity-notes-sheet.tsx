import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Send, StickyNote, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'

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
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { InitialsAvatar } from '@/components/ds'
import { isAdmin } from '@/constants/user'
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

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

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
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { data: notes = [], isLoading } = useQuery({
    ...getEntityNotesQuery(entityType, autoid, projectId),
    enabled: open && !!autoid
  })

  const notesQueryKey = NOTE_QUERY_KEYS.entityNotes(entityType, autoid, projectId)

  const createMutation = useMutation({
    mutationFn: (payload: { text: string }) =>
      noteService.createEntityNote(entityType, autoid, payload, projectId),
    meta: {
      successMessage: 'Note added',
      errorMessage: 'Failed to add note'
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: notesQueryKey, exact: true })
      const previous = queryClient.getQueryData<EntityNoteList[]>(notesQueryKey)
      const optimistic: EntityNoteList = {
        id: -Date.now(),
        entity_type: entityType,
        entity_autoid: autoid,
        project: projectId ?? 0,
        text: payload.text,
        author: user?.id ?? null,
        author_name: user ? `${user.first_name} ${user.last_name}`.trim() : '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      queryClient.setQueryData<EntityNoteList[]>(notesQueryKey, (old) =>
        old ? [optimistic, ...old] : [optimistic]
      )
      setText('')
      return { previous }
    },
    onSuccess: (serverNote) => {
      const real: EntityNoteList = {
        id: serverNote.id,
        entity_type: serverNote.entity_type,
        entity_autoid: serverNote.entity_autoid,
        project: serverNote.project,
        text: serverNote.text,
        author: serverNote.author,
        author_name: serverNote.author_details?.full_name ?? (user ? `${user.first_name} ${user.last_name}`.trim() : ''),
        created_at: serverNote.created_at,
        updated_at: serverNote.updated_at
      }
      queryClient.setQueryData<EntityNoteList[]>(notesQueryKey, (old) =>
        old?.map((n) => (n.id < 0 ? real : n))
      )
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notesQueryKey, context.previous)
      }
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => noteService.deleteNote(id),
    meta: {
      successMessage: 'Note deleted',
      errorMessage: 'Failed to delete note'
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notesQueryKey, exact: true })
      const previous = queryClient.getQueryData<EntityNoteList[]>(notesQueryKey)
      queryClient.setQueryData<EntityNoteList[]>(notesQueryKey, (old) =>
        old ? old.filter((n) => n.id !== id) : old
      )
      setNoteToDelete(null)
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notesQueryKey, context.previous)
      }
    }
  })

  const canDeleteNote = (note: EntityNoteList) =>
    !!user && (isAdmin(user.role) || note.author === user.id)

  const submitNote = () => {
    const trimmed = text.trim()
    if (!trimmed || createMutation.isPending) return
    if (trimmed.length > NOTE_TEXT_MAX) return
    createMutation.mutate({ text: trimmed })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitNote()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submitNote()
    }
  }

  const orderedNotes = [...notes].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className='flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md'
        side='right'
      >
        <SheetHeader className='flex h-12 shrink-0 flex-row items-center gap-2 border-b border-border px-5'>
          <SheetTitle className='text-[14px] font-semibold tracking-[-0.01em]'>Notes</SheetTitle>
          <SheetDescription className='!mt-0 text-[13px] text-text-tertiary'>
            {entityLabel}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className='min-h-0 flex-1'>
          {isLoading ? (
            <div className='flex flex-col'>
              {(['sk-1', 'sk-2', 'sk-3', 'sk-4'] as const).map((key) => (
                <NoteRowSkeleton key={key} />
              ))}
            </div>
          ) : orderedNotes.length === 0 ? (
            <Empty className='border-0 py-16'>
              <EmptyHeader>
                <EmptyMedia variant='icon' className='rounded-xl'>
                  <StickyNote className='size-5 text-text-tertiary' />
                </EmptyMedia>
                <EmptyTitle className='font-medium text-foreground'>No notes yet</EmptyTitle>
                <EmptyContent>
                  <p className='max-w-[220px] text-[13px] leading-relaxed text-text-tertiary'>
                    Add a note below to keep context for this record.
                  </p>
                </EmptyContent>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className='flex flex-col'>
              {orderedNotes.map((note) => (
                <NoteRow
                  key={note.id}
                  note={note}
                  canDelete={canDeleteNote(note)}
                  onDelete={() => setNoteToDelete(note)}
                />
              ))}
            </div>
          )}
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
          className='shrink-0 border-t border-border px-4 py-3'
          onSubmit={handleSubmit}
        >
          <div className='relative'>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, NOTE_TEXT_MAX))}
              onKeyDown={handleKeyDown}
              placeholder='Write a note...'
              rows={2}
              className='w-full resize-none rounded-[6px] border border-border bg-transparent px-3 py-2 pr-10 text-[13px] leading-relaxed placeholder:text-text-tertiary focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring/50'
              disabled={createMutation.isPending}
            />
            <button
              type='submit'
              disabled={!text.trim() || createMutation.isPending}
              className={cn(
                'absolute bottom-2.5 right-2.5 flex size-6 items-center justify-center rounded-[5px] transition-colors duration-[80ms]',
                text.trim()
                  ? 'bg-primary text-primary-foreground hover:opacity-90'
                  : 'text-text-tertiary'
              )}
            >
              <Send className='size-3' />
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function NoteRowSkeleton() {
  return (
    <div className='flex gap-2.5 px-5 py-3'>
      <Skeleton className='size-5 shrink-0 rounded-full' />
      <div className='min-w-0 flex-1 space-y-1.5'>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-3.5 w-20' />
          <Skeleton className='h-3 w-12' />
        </div>
        <Skeleton className='h-3.5 w-full' />
        <Skeleton className='h-3.5 w-2/3' />
      </div>
    </div>
  )
}

function NoteRow({
  note,
  canDelete,
  onDelete,
}: {
  note: EntityNoteList
  canDelete: boolean
  onDelete: () => void
}) {
  const initials = getInitials(note.author_name || '?')
  return (
    <div className='group flex gap-2.5 border-b border-border-light px-5 py-3 last:border-b-0'>
      <InitialsAvatar initials={initials} size={20} />
      <div className='min-w-0 flex-1'>
        <div className='flex items-center gap-2'>
          <span className='truncate text-[13px] font-medium text-foreground'>
            {note.author_name}
          </span>
          <span className='shrink-0 text-[12px] tabular-nums text-text-tertiary'>
            {relativeTime(note.created_at)}
          </span>
          {canDelete && (
            <button
              type='button'
              className='ml-auto shrink-0 rounded-[4px] p-0.5 text-text-tertiary opacity-0 transition-all duration-[80ms] hover:text-destructive group-hover:opacity-100'
              onClick={onDelete}
              aria-label='Delete note'
            >
              <Trash2 className='size-3' />
            </button>
          )}
        </div>
        <p className='mt-0.5 whitespace-pre-wrap text-[13px] leading-relaxed text-text-secondary wrap-break-word'>
          {note.text}
        </p>
      </div>
    </div>
  )
}
