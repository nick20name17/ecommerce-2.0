import { useQuery } from '@tanstack/react-query'
import { Check, ChevronDown } from 'lucide-react'
import { useEffect } from 'react'
import { useLocalStorage } from 'usehooks-ts'

import { DEFAULT_LIMIT } from '@/api/constants'
import { getProjectsQuery } from '@/api/project/query'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSidebar } from '@/components/ui/sidebar'
import { Spinner } from '@/components/ui/spinner'
import { NotificationBell } from './notifications'
import { isSuperAdmin } from '@/constants/user'
import { STORAGE_KEYS } from '@/constants/storage'
import { useProjectId } from '@/hooks/use-project-id'
import { useAuth } from '@/providers/auth'

const PROJECT_COLORS = [
  { bg: 'bg-violet-500', text: 'text-white' },
  { bg: 'bg-blue-500', text: 'text-white' },
  { bg: 'bg-emerald-500', text: 'text-white' },
  { bg: 'bg-amber-500', text: 'text-white' },
  { bg: 'bg-rose-500', text: 'text-white' },
  { bg: 'bg-cyan-500', text: 'text-white' },
  { bg: 'bg-pink-500', text: 'text-white' },
  { bg: 'bg-orange-500', text: 'text-white' },
  { bg: 'bg-teal-500', text: 'text-white' },
  { bg: 'bg-indigo-500', text: 'text-white' },
]

const DROPDOWN_COLORS = [
  { bg: 'bg-violet-500/15', text: 'text-violet-600' },
  { bg: 'bg-blue-500/15', text: 'text-blue-600' },
  { bg: 'bg-emerald-500/15', text: 'text-emerald-600' },
  { bg: 'bg-amber-500/15', text: 'text-amber-600' },
  { bg: 'bg-rose-500/15', text: 'text-rose-600' },
  { bg: 'bg-cyan-500/15', text: 'text-cyan-600' },
  { bg: 'bg-pink-500/15', text: 'text-pink-600' },
  { bg: 'bg-orange-500/15', text: 'text-orange-600' },
  { bg: 'bg-teal-500/15', text: 'text-teal-600' },
  { bg: 'bg-indigo-500/15', text: 'text-indigo-600' },
]

function getProjectColor(id: number) {
  return PROJECT_COLORS[id % PROJECT_COLORS.length]
}

function getDropdownColor(id: number) {
  return DROPDOWN_COLORS[id % DROPDOWN_COLORS.length]
}

export const NavProjects = () => {
  const { isMobile } = useSidebar()
  const { user } = useAuth()
  const isSuperAdminUser = !!user?.role && isSuperAdmin(user.role)

  const [projectId, setProjectId] = useProjectId()
  const [cachedName, setCachedName] = useLocalStorage<string>(STORAGE_KEYS.projectName, '')

  const { data, isLoading } = useQuery({
    ...getProjectsQuery({ limit: DEFAULT_LIMIT, offset: 0 }),
    enabled: isSuperAdminUser,
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
    if (!isSuperAdminUser && user?.project_id != null && projectId !== user.project_id) {
      setProjectId(user.project_id)
    }
  }, [isSuperAdminUser, user?.project_id, projectId, setProjectId])

  const selectedProject = projects.find((p) => p.id === effectiveProjectId) ?? null
  const resolvedName = selectedProject?.name || user?.project_name || ''

  // Cache the project name so it persists across reloads
  useEffect(() => {
    if (resolvedName && resolvedName !== cachedName) {
      setCachedName(resolvedName)
    }
  }, [resolvedName, cachedName, setCachedName])

  const projectName = resolvedName || cachedName || 'Project'
  const projectInitial = projectName[0].toUpperCase()
  const selectedColor = selectedProject ? getProjectColor(selectedProject.id) : PROJECT_COLORS[0]

  if (!isSuperAdminUser) {
    return (
      <div className='mx-3 mt-3 flex h-[36px] items-center gap-2.5 rounded-[8px] bg-background/70 px-2.5 shadow-[0_0_0_1px_rgba(0,0,0,0.04)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06)]'>
        <div className={`flex size-[20px] shrink-0 items-center justify-center rounded-[5px] text-[10px] font-bold ${selectedColor.bg} ${selectedColor.text}`}>
          {projectInitial}
        </div>
        <span className='min-w-0 flex-1 truncate text-[13px] font-semibold text-foreground'>
          {projectName}
        </span>
        <NotificationBell />
      </div>
    )
  }

  return (
    <div className='mx-3 mt-3 flex h-[36px] items-center gap-1.5'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type='button'
            className='flex h-[36px] min-w-0 flex-1 items-center gap-2.5 rounded-[8px] bg-background/70 px-2.5 text-left shadow-[0_0_0_1px_rgba(0,0,0,0.04)] transition-all duration-100 hover:bg-background hover:shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] active:scale-[0.98] focus-visible:outline-none dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06)] dark:hover:bg-background/90'
          >
            <div className={`flex size-[20px] shrink-0 items-center justify-center rounded-[5px] text-[10px] font-bold ${selectedColor.bg} ${selectedColor.text}`}>
              {isLoading ? <Spinner className='size-3' /> : projectInitial}
            </div>
            <span className='min-w-0 flex-1 truncate text-[13px] font-semibold text-foreground'>
              {projectName}
            </span>
            <ChevronDown className='size-3 shrink-0 text-text-tertiary' />
          </button>
        </DropdownMenuTrigger>
      <DropdownMenuContent
        className='w-[200px] rounded-[10px] p-1'
        align='start'
        side={isMobile ? 'bottom' : 'right'}
        sideOffset={6}
        style={{ boxShadow: 'var(--dropdown-shadow)' }}
      >
        <div className='px-2 pb-1 pt-1.5 text-[13px] font-medium text-text-tertiary'>
          Switch project
        </div>
        {isLoading ? (
          <div className='flex items-center justify-center py-4'>
            <Spinner className='size-4' />
          </div>
        ) : projects.length === 0 ? (
          <div className='px-2 py-4 text-center text-[13px] text-text-tertiary'>
            No projects found
          </div>
        ) : (
          projects.map((project) => {
            const isActive = project.id === effectiveProjectId
            const color = getDropdownColor(project.id)
            return (
              <DropdownMenuItem
                key={project.id}
                onClick={() => setProjectId(project.id)}
                className='flex cursor-pointer items-center gap-2 rounded-[6px] px-2 py-1.5 text-[13px]'
              >
                <div className={`flex size-[18px] items-center justify-center rounded-[4px] text-[9px] font-bold ${color.bg} ${color.text}`}>
                  {project.name[0].toUpperCase()}
                </div>
                <span className='flex-1 truncate'>{project.name}</span>
                {isActive && <Check className='size-3.5 shrink-0 text-primary' />}
              </DropdownMenuItem>
            )
          })
        )}
      </DropdownMenuContent>
      </DropdownMenu>
      <NotificationBell />
    </div>
  )
}
