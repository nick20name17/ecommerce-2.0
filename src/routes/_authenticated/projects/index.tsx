import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { FolderKanban, Plus } from 'lucide-react'
import { useState } from 'react'

import { ProjectDeleteDialog } from './-components/project-delete-dialog'
import { ProjectModal } from './-components/project-modal'
import { ProjectsDataTable } from './-components/projects-data-table'
import { getProjectHealthQuery, getProjectsQuery } from '@/api/project/query'
import type { Project, ProjectParams, ProjectWithHealthLoading } from '@/api/project/schema'
import { Pagination } from '@/components/common/filters/pagination'
import { SearchFilter } from '@/components/common/filters/search'
import { Button } from '@/components/ui/button'
import { isSuperAdmin } from '@/constants/user'
import type { UserRole } from '@/constants/user'
import { getSession } from '@/helpers/auth'
import { useOrdering } from '@/hooks/use-ordering'
import { useLimitParam, useOffsetParam, useSearchParam } from '@/hooks/use-query-params'

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

function mergeHealthIntoProjects(
  projects: Project[],
  healthResults: Array<{ data?: unknown; isLoading?: boolean }>
): ProjectWithHealthLoading[] {
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

function ProjectsPage() {
  const [search] = useSearchParam()
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
    <div className='flex h-full flex-col gap-5'>
      <header className='flex items-start justify-between'>
        <div className='flex items-center gap-3'>
          <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
            <FolderKanban className='size-5' />
          </div>
          <div>
            <h1 className='text-2xl font-semibold tracking-tight'>Projects</h1>
            <p className='text-sm text-muted-foreground'>{data?.count ?? 0} total</p>
          </div>
        </div>
        <Button onClick={() => setModalProject('create')} className='gap-2'>
          <Plus className='size-4' />
          Add Project
        </Button>
      </header>

      <div className='flex items-center gap-3'>
        <SearchFilter placeholder='Search projects...' />
      </div>

      <ProjectsDataTable
        data={projectsWithHealth}
        isLoading={isLoading || isPlaceholderData}
        sorting={sorting}
        setSorting={setSorting}
        onEdit={(project) => setModalProject(project.id)}
        onDelete={setDeleteProject}
      />

      <Pagination totalCount={data?.count ?? 0} />

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
