import { queryOptions } from '@tanstack/react-query'

import type { ProjectParams } from './schema'
import { projectService } from './service'

export const PROJECT_QUERY_KEYS = {
  all: () => ['projects'] as const,
  lists: () => [...PROJECT_QUERY_KEYS.all(), 'list'] as const,
  list: (params: ProjectParams = {}) => [...PROJECT_QUERY_KEYS.lists(), params] as const,
  details: () => [...PROJECT_QUERY_KEYS.all(), 'detail'] as const,
  detail: (id: number) => [...PROJECT_QUERY_KEYS.details(), id] as const,
  health: (id: number) => [...PROJECT_QUERY_KEYS.detail(id), 'health'] as const
}

export const getProjectsQuery = (params: ProjectParams = {}) =>
  queryOptions({
    queryKey: PROJECT_QUERY_KEYS.list(params),
    queryFn: () => projectService.get(params)
  })

export const getProjectHealthQuery = (id: number) =>
  queryOptions({
    queryKey: PROJECT_QUERY_KEYS.health(id),
    queryFn: () => projectService.getHealth(id)
  })

