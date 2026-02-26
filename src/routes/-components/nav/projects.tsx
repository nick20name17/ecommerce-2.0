import { useQuery } from '@tanstack/react-query'
import { ChevronsUpDown, FolderKanban } from 'lucide-react'
import { useEffect } from 'react'

import { DEFAULT_LIMIT } from '@/api/constants'
import { getProjectsQuery } from '@/api/project/query'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar'
import { Spinner } from '@/components/ui/spinner'
import { isSuperAdmin } from '@/constants/user'
import { useProjectId } from '@/hooks/use-project-id'
import { useAuth } from '@/providers/auth'

export function NavProjects() {
  const { isMobile } = useSidebar()
  const { user } = useAuth()
  const isSuperAdminUser = !!user?.role && isSuperAdmin(user.role)

  const [projectId, setProjectId] = useProjectId()

  const { data, isLoading } = useQuery({
    ...getProjectsQuery({ limit: DEFAULT_LIMIT, offset: 0 }),
    enabled: isSuperAdminUser
  })

  const projects = data?.results ?? []
  const firstProjectId = projects[0]?.id ?? null
  const effectiveProjectId = projectId ?? firstProjectId

  useEffect(() => {
    if (projectId == null && firstProjectId != null) {
      setProjectId(firstProjectId)
    }
  }, [projectId, firstProjectId, setProjectId])

  useEffect(() => {
    if (!isSuperAdminUser && user?.project != null && projectId !== user.project) {
      setProjectId(user.project)
    }
  }, [isSuperAdminUser, user?.project, projectId, setProjectId])

  const selectedProject = projects.find((p) => p.id === effectiveProjectId) ?? null

  if (!isSuperAdminUser) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size='lg'>
            <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
              <FolderKanban className='size-4' />
            </div>
            <div className='grid flex-1 text-left text-sm leading-tight'>
              <span className='truncate font-medium' title={user?.project_name ?? undefined}>
                {user?.project_name ?? 'Project'}
              </span>
              <span className='truncate text-xs'>Dashboard</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                {isLoading ? <Spinner className='size-4' /> : <FolderKanban className='size-4' />}
              </div>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-medium'>
                  {selectedProject?.name ?? 'Select Project'}
                </span>
              </div>
              <ChevronsUpDown className='ml-auto' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            align='start'
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className='text-muted-foreground text-xs'>
              Projects
            </DropdownMenuLabel>
            {isLoading ? (
              <div className='flex items-center justify-center py-4'>
                <Spinner className='size-4' />
              </div>
            ) : projects.length === 0 ? (
              <div className='text-muted-foreground px-2 py-4 text-center text-sm'>
                No projects found
              </div>
            ) : (
              projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => setProjectId(project.id)}
                  className='gap-2 p-2'
                >
                  <div className='flex size-6 items-center justify-center rounded-md border'>
                    <FolderKanban className='size-3.5 shrink-0' />
                  </div>
                  <span className='truncate'>{project.name}</span>
                  {project.id === effectiveProjectId && (
                    <span className='bg-primary ml-auto size-2 rounded-full' />
                  )}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
