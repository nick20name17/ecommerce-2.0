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
    [...TASK_QUERY_KEYS.all(), 'statuses', projectId] as const,
  attachments: (taskId: number) =>
    [...TASK_QUERY_KEYS.all(), 'attachments', taskId] as const,
  attachment: (taskId: number, attachmentId: number) =>
    [...TASK_QUERY_KEYS.attachments(taskId), attachmentId] as const
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

export const getTaskAttachmentsQuery = (taskId: number) =>
  queryOptions({
    queryKey: TASK_QUERY_KEYS.attachments(taskId),
    queryFn: () => taskService.getAttachments(taskId),
    enabled: !!taskId
  })

export const getTaskAttachmentQuery = (taskId: number, attachmentId: number) =>
  queryOptions({
    queryKey: TASK_QUERY_KEYS.attachment(taskId, attachmentId),
    queryFn: () => taskService.getAttachment(taskId, attachmentId),
    enabled: !!taskId && !!attachmentId
  })
