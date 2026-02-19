import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { AppSidebar } from '../-components/app-sidebar'

import { HeaderProjectHealth } from './-components/header-project-health'
import { AUTH_REDIRECTS } from '@/api/constants'
import { ModeToggle } from '@/components/common/mode-toggle'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { getSession } from '@/helpers/auth'

const AuthenticatedLayout = () => {
  return (
    <SidebarProvider className='h-svh overflow-hidden'>
      <AppSidebar />
      <SidebarInset className='overflow-hidden'>
        <header className='flex h-14 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
          <div className='flex min-w-0 flex-1 items-center gap-2 px-4'>
            <SidebarTrigger className='-ml-1 shrink-0' />
            <HeaderProjectHealth />
          </div>
          <div className='shrink-0 px-4'>
            <ModeToggle />
          </div>
        </header>
        <main className='flex min-h-0 flex-1 flex-col p-4'>
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

