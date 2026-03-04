import { createFileRoute } from '@tanstack/react-router'
import { StickyNote } from 'lucide-react'

const NotesPage = () => (
  <div className='text-muted-foreground flex h-full flex-col items-center justify-center gap-3'>
    <StickyNote className='size-12 opacity-50' />
    <h1 className='text-foreground text-2xl font-bold'>Notes</h1>
    <p className='text-sm'>Notes content will be implemented here.</p>
  </div>
)

export const Route = createFileRoute('/_authenticated/notes/')({
  component: NotesPage,
  head: () => ({
    meta: [{ title: 'Notes' }]
  })
})
