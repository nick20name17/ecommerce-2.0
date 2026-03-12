import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { AppSidebar } from '../-components/app-sidebar'

import { NotificationsWsManager } from './-components/notifications-ws-manager'
import { AUTH_REDIRECTS } from '@/api/constants'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { getSession } from '@/helpers/auth'

const AuthenticatedLayout = () => {
  return (
    <SidebarProvider className='h-svh overflow-hidden bg-page-canvas'>
      <NotificationsWsManager />
      <AppSidebar />
      <SidebarInset className='flex min-h-0 flex-col overflow-hidden bg-transparent p-2'>
        <div className='flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-background shadow-sm ring-1 ring-black/[0.04]'>
          <header className='flex h-11 shrink-0 items-center gap-2 border-b border-border/40'>
            <div className='flex min-w-0 flex-1 items-center gap-2 px-6'>
              <SidebarTrigger className='-ml-1.5 shrink-0' />
            </div>
          </header>
          <main className='flex min-h-0 flex-1 flex-col overflow-hidden'>
            <Outlet />
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
  beforeLoad: ({ location }) => {
    const session = getSession()

    if (!session?.user) {
      throw redirect({
        to: AUTH_REDIRECTS.logout,
        replace: true,
        search: (prev) => ({ ...prev, redirect: location.href })
      })
    }
  }
})
