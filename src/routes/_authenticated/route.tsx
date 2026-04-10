import { useQueryClient } from '@tanstack/react-query'
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect } from 'react'

import { AppSidebar } from '../-components/app-sidebar'

import { NotificationsWsManager } from './-components/notifications-ws-manager'
import { AUTH_REDIRECTS } from '@/api/constants'
import { getEditableFieldsQuery } from '@/api/data/query'
import { getFieldConfigQuery } from '@/api/field-config/query'
import { getPriceLevelsQuery } from '@/api/price-level/query'
import { getSalespersonsQuery } from '@/api/salesperson/query'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { getSession } from '@/helpers/auth'
import { useProjectId } from '@/hooks/use-project-id'

const AuthenticatedLayout = () => {
  const queryClient = useQueryClient()
  const [projectId] = useProjectId()

  // Prefetch reference data once — used across many pages
  useEffect(() => {
    if (!projectId) return
    queryClient.prefetchQuery(getFieldConfigQuery(projectId))
    queryClient.prefetchQuery(getEditableFieldsQuery(projectId))
    queryClient.prefetchQuery(getPriceLevelsQuery(projectId))
    queryClient.prefetchQuery(getSalespersonsQuery(projectId))
  }, [projectId, queryClient])

  return (
    <SidebarProvider className='bg-page-canvas h-svh overflow-hidden'>
      <NotificationsWsManager />
      <AppSidebar />
      <SidebarInset className='flex min-h-0 flex-col overflow-hidden bg-transparent p-0 md:p-2'>
        <div className='bg-background flex min-h-0 flex-1 flex-col overflow-hidden rounded-none shadow-sm ring-1 ring-black/[0.04] md:rounded-xl'>
          <main data-slot='page-content' className='flex min-h-0 flex-1 flex-col overflow-hidden'>
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
