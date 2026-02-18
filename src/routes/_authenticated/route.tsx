import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { AppSidebar } from '../-components/app-sidebar'

import { AUTH_REDIRECTS } from '@/api/constants'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { getSession } from '@/helpers/auth'

const AuthenticatedLayout = () => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className='flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
          <div className='flex items-center gap-2 px-4'>
            <SidebarTrigger className='-ml-1' />
          </div>
        </header>
        <main className='p-4'>
          <Outlet />
        </main>
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
