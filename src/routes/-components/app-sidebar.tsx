import * as React from 'react'

import { NavMain } from './nav/main'
import { NavProjects } from './nav/projects'
import { NavUser } from './nav/user'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar'

export const AppSidebar = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
  return (
    <Sidebar collapsible='offcanvas' {...props} className='border-none bg-transparent'>
      <SidebarHeader className='p-0'>
        <NavProjects />
      </SidebarHeader>
      <SidebarContent className='flex flex-col gap-0 overflow-x-hidden overflow-y-auto px-0'>
        <NavMain />
      </SidebarContent>
      <SidebarFooter className='p-0'>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
