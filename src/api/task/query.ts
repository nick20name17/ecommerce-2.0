import { queryOptions } from '@tanstack/react-query'

import type { TaskParams } from './schema'
import { taskService } from './service'

export const TASK_QUERY_KEYS = {
  all: () => ['tasks'] as const,
  lists: () => [...TASK_QUERY_KEYS.all(), 'list'] as const,
  list: (params: TaskParams = {}) => [...TASK_QUERY_KEYS.lists(), params] as const,
  details: () => [...TASK_QUERY_KEYS.all(), 'detail'] as const,
  detail: (id: number) => [...TASK_QUERY_KEYS.details(), id] as const,
  statuses: (projectId?: number | null) =>
    [...TASK_QUERY_KEYS.all(), 'statuses', projectId] as const
}

export const getTasksQuery = (params: TaskParams = {}) =>
  queryOptions({
    queryKey: TASK_QUERY_KEYS.list(params),
    queryFn: () => taskService.get(params)
  })

export const getTaskDetailQuery = (id: number) =>
  queryOptions({
    queryKey: TASK_QUERY_KEYS.detail(id),
    queryFn: () => taskService.getById(id),
    enabled: !!id
  })

export const getTaskStatusesQuery = (projectId?: number | null) =>
  queryOptions({
    queryKey: TASK_QUERY_KEYS.statuses(projectId),
    queryFn: () => taskService.getStatuses(projectId)
  })
