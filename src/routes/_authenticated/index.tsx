import { createFileRoute } from '@tanstack/react-router'
import { LayoutDashboard } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/')({
  component: DashboardPage,
  head: () => ({
    meta: [{ title: 'Dashboard' }]
  })
})

function DashboardPage() {
  return (
    <div className='flex h-full flex-col items-center justify-center gap-3 text-muted-foreground'>
      <LayoutDashboard className='size-12 opacity-50' />
      <h1 className='text-2xl font-bold text-foreground'>Dashboard</h1>
      <p className='text-sm'>Dashboard content will be implemented here.</p>
    </div>
  )
}
