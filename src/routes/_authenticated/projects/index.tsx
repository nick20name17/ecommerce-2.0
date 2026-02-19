import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useState } from 'react'

import { ProjectDeleteDialog } from './-components/project-delete-dialog'
import { ProjectModal } from './-components/project-modal'
import { ProjectsDataTable } from './-components/projects-data-table'
import { getProjectHealthQuery, getProjectsQuery } from '@/api/project/query'
import type { Project, ProjectParams } from '@/api/project/schema'
import { Pagination } from '@/components/common/filters/pagination'
import { SearchFilter } from '@/components/common/filters/search'
import { Button } from '@/components/ui/button'
import { useOrdering } from '@/hooks/use-ordering'
import { useLimitParam, useOffsetParam, useSearchParam } from '@/hooks/use-query-params'

export const Route = createFileRoute('/_authenticated/projects/')({
  component: ProjectsPage
})

function mergeHealthIntoProjects(
  projects: Project[],
  healthResults: Array<{ data?: unknown }>
): Project[] {
  return projects.map((project, index) => {
    const health = healthResults[index]?.data as
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
    if (!health) return project
    return {
      ...project,
      website_status: health.website_status,
      website_response_ms: health.website_response_ms,
      website_last_checked: health.website_last_checked,
      backend_status: health.backend_status,
      backend_response_ms: health.backend_response_ms,
      backend_last_checked: health.backend_last_checked,
      ebms_status: health.ebms_status,
      ebms_response_ms: health.ebms_response_ms,
      ebms_last_checked: health.ebms_last_checked,
      sync_status: health.sync_status,
      sync_response_ms: health.sync_response_ms,
      sync_last_checked: health.sync_last_checked,
      db_status: health.db_status,
      overall_status: health.overall_status,
      has_ebms_config: health.has_ebms_config,
      has_sync_config: health.has_sync_config
    }
  })
}

function ProjectsPage() {
  const [search] = useSearchParam()
  const [offset] = useOffsetParam()
  const [limit] = useLimitParam()
  const { sorting, setSorting, ordering } = useOrdering()

  const [modalProject, setModalProject] = useState<Project | 'create' | null>(null)
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
    queries: projects?.map((p) => getProjectHealthQuery(p.id)),
    enabled: projects.length > 0
  })

  const projectsWithHealth = mergeHealthIntoProjects(
    projects,
    healthQueries?.map((q) => ({ data: q.data }))
  )

  const healthLoading = healthQueries.some((q) => q.isLoading)

  const editingProject = typeof modalProject === 'object' ? modalProject : null

  return (
    <div className='flex h-full flex-col gap-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Projects</h1>
        <Button onClick={() => setModalProject('create')}>
          <Plus />
          Add Project
        </Button>
      </div>

      <SearchFilter placeholder='Search projects...' />

      <ProjectsDataTable
        data={projectsWithHealth}
        isLoading={isLoading || isPlaceholderData || healthLoading}
        sorting={sorting}
        setSorting={setSorting}
        onEdit={setModalProject}
        onDelete={setDeleteProject}
      />

      <Pagination totalCount={data?.count ?? 0} />

      <ProjectModal
        key={editingProject?.id ?? 'create'}
        open={modalProject !== null}
        onOpenChange={(open) => !open && setModalProject(null)}
        project={editingProject}
      />
      <ProjectDeleteDialog
        project={deleteProject}
        open={!!deleteProject}
        onOpenChange={(open) => !open && setDeleteProject(null)}
      />
    </div>
  )
}
