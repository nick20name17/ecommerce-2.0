import { createFileRoute } from '@tanstack/react-router'
import { Settings } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/settings/')({
  component: SettingsPage,
  head: () => ({
    meta: [{ title: 'Settings' }]
  })
})

function SettingsPage() {
  return (
    <div className='flex h-full flex-col items-center justify-center gap-3 text-muted-foreground'>
      <Settings className='size-12 opacity-50' />
      <h1 className='text-2xl font-bold text-foreground'>Settings</h1>
      <p className='text-sm'>Settings content will be implemented here.</p>
    </div>
  )
}
