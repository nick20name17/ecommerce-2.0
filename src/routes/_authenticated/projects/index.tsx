import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { Plus, Search } from 'lucide-react'

import { IProjects, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useState } from 'react'

import { ProjectDeleteDialog } from './-components/project-delete-dialog'
import { ProjectModal } from './-components/project-modal'
import { ProjectsDataTable } from './-components/projects-data-table'
import { getProjectHealthQuery, getProjectsQuery } from '@/api/project/query'
import type { Project, ProjectParams, ProjectWithHealthLoading } from '@/api/project/schema'
import { Pagination } from '@/components/common/filters/pagination'
import { isSuperAdmin } from '@/constants/user'
import type { UserRole } from '@/constants/user'
import { getSession } from '@/helpers/auth'
import { useOrdering } from '@/hooks/use-ordering'
import { useLimitParam, useOffsetParam, useSearchParam } from '@/hooks/use-query-params'
import { useDebouncedCallback } from 'use-debounce'

const mergeHealthIntoProjects = (
  projects: Project[],
  healthResults: Array<{ data?: unknown; isLoading?: boolean }>
): ProjectWithHealthLoading[] => {
  return projects.map((project, index) => {
    const result = healthResults[index]
    const health = result?.data as
      | {
          website_status?: 'healthy' | 'unhealthy'
          website_response_ms?: number
          website_last_checked?: string
          backend_status?: 'healthy' | 'unhealthy'
          backend_response_ms?: number
          backend_last_checked?: string
          ebms_status?: 'healthy' | 'unhealthy'
          ebms_response_ms?: number
          ebms_last_checked?: string
          sync_status?: 'healthy' | 'unhealthy'
          sync_response_ms?: number
          sync_last_checked?: string
          db_status?: 'healthy' | 'unhealthy'
          overall_status?: 'healthy' | 'unhealthy'
          has_ebms_config?: boolean
          has_sync_config?: boolean
        }
      | undefined

    return {
      ...project,
      _healthLoading: result?.isLoading ?? false,
      website_status: health?.website_status,
      website_response_ms: health?.website_response_ms,
      website_last_checked: health?.website_last_checked,
      backend_status: health?.backend_status,
      backend_response_ms: health?.backend_response_ms,
      backend_last_checked: health?.backend_last_checked,
      ebms_status: health?.ebms_status,
      ebms_response_ms: health?.ebms_response_ms,
      ebms_last_checked: health?.ebms_last_checked,
      sync_status: health?.sync_status,
      sync_response_ms: health?.sync_response_ms,
      sync_last_checked: health?.sync_last_checked,
      db_status: health?.db_status,
      overall_status: health?.overall_status,
      has_ebms_config: health?.has_ebms_config,
      has_sync_config: health?.has_sync_config
    }
  })
}

const ProjectsPage = () => {
  const [search, setSearch] = useSearchParam()
  const handleSearch = useDebouncedCallback((value: string) => setSearch(value || null), 300)
  const [offset] = useOffsetParam()
  const [limit] = useLimitParam()
  const { sorting, setSorting, ordering } = useOrdering()

  const [modalProject, setModalProject] = useState<number | 'create' | null>(null)
  const [deleteProject, setDeleteProject] = useState<Project | null>(null)

  const params: ProjectParams = {
    search: search || undefined,
    offset,
    limit,
    ordering
  }

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getProjectsQuery(params),
    placeholderData: keepPreviousData
  })

  const projects = data?.results ?? []

  const healthQueries = useQueries({
    queries:
      projects.length > 0
        ? projects.map((p) => ({
            ...getProjectHealthQuery(p.id),
            meta: { suppressErrorToast: true }
          }))
        : []
  })

  const projectsWithHealth = mergeHealthIntoProjects(
    projects,
    healthQueries?.map((q) => ({ data: q.data, isLoading: q.isLoading }))
  )

  const editingProjectId = typeof modalProject === 'number' ? modalProject : null

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      <header className='flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-6'>
        <SidebarTrigger className='-ml-1' />
        <div className='flex items-center gap-1.5'>
          <PageHeaderIcon icon={IProjects} color={PAGE_COLORS.projects} />
          <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>Projects</h1>
        </div>

        <div className='flex-1' />

        <div className='hidden h-7 w-full max-w-[260px] items-center gap-1.5 rounded-[5px] border border-border bg-background px-2 transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50 sm:flex'>
          <Search className='size-3 shrink-0 text-text-tertiary' />
          <input
            defaultValue={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder='Search projects...'
            className='flex-1 bg-transparent text-[13px] outline-none placeholder:text-text-tertiary'
          />
        </div>

        <button
          type='button'
          className='inline-flex h-7 items-center gap-1 rounded-[5px] bg-primary px-2 text-[13px] font-semibold text-primary-foreground transition-colors duration-[80ms] hover:opacity-90 sm:px-2.5'
          onClick={() => setModalProject('create')}
        >
          <Plus className='size-3.5' />
          <span className='hidden sm:inline'>Add Project</span>
        </button>
      </header>

      <div className='flex-1 overflow-auto'>
        <ProjectsDataTable
          data={projectsWithHealth}
          isLoading={isLoading || isPlaceholderData}
          sorting={sorting}
          setSorting={setSorting}
          onEdit={(project) => setModalProject(project.id)}
          onDelete={setDeleteProject}
        />
      </div>

      <div className='shrink-0 border-t border-border px-6 py-2'>
        <Pagination totalCount={data?.count ?? 0} />
      </div>

      <ProjectModal
        key={editingProjectId ?? 'create'}
        open={modalProject !== null}
        onOpenChange={(open) => !open && setModalProject(null)}
        projectId={editingProjectId}
      />
      <ProjectDeleteDialog
        project={deleteProject}
        open={!!deleteProject}
        onOpenChange={(open) => !open && setDeleteProject(null)}
      />
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/projects/')({
  beforeLoad: () => {
    const session = getSession()
    const role = session?.user?.role as UserRole | undefined
    if (!role || !isSuperAdmin(role)) {
      throw redirect({ to: '/', replace: true })
    }
  },
  component: ProjectsPage,
  head: () => ({
    meta: [{ title: 'Projects' }]
  })
})
