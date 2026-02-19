import { createFileRoute } from '@tanstack/react-router'
import { StickyNote } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/notes/')({
  component: NotesPage,
})

function NotesPage() {
  return (
    <div className='flex h-full flex-col items-center justify-center gap-3 text-muted-foreground'>
      <StickyNote className='size-12 opacity-50' />
      <h1 className='text-2xl font-bold text-foreground'>Notes</h1>
      <p className='text-sm'>Notes content will be implemented here.</p>
    </div>
  )
}
