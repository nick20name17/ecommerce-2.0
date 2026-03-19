import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { AppSidebar } from '../-components/app-sidebar'

import { NotificationsWsManager } from './-components/notifications-ws-manager'
import { AUTH_REDIRECTS } from '@/api/constants'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { getSession } from '@/helpers/auth'

const AuthenticatedLayout = () => {
  return (
    <SidebarProvider className='bg-page-canvas h-svh overflow-hidden'>
      <NotificationsWsManager />
      <AppSidebar />
      <SidebarInset className='flex min-h-0 flex-col overflow-hidden bg-transparent p-0 md:p-2'>
        <div className='bg-background flex min-h-0 flex-1 flex-col overflow-hidden rounded-none shadow-sm ring-1 ring-black/[0.04] md:rounded-xl'>
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
