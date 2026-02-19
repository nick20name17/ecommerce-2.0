import { api } from '..'

import type {
  CreateTaskPayload,
  CreateTaskStatusPayload,
  Task,
  TaskListItem,
  TaskParams,
  TaskListResponse,
  TaskStatus,
  UpdateTaskPayload,
  UpdateTaskStatusPayload
} from './schema'

export const taskService = {
  get: async (params: TaskParams) => {
    const { data } = await api.get<TaskListResponse>('/tasks/', { params })
    return data
  },

  getById: async (id: number) => {
    const { data } = await api.get<Task>(`/tasks/${id}/`)
    return data
  },

  create: async (payload: CreateTaskPayload) => {
    const { data } = await api.post<TaskListItem | Task>('/tasks/', payload)
    return data
  },

  update: async (id: number, payload: UpdateTaskPayload) => {
    const { data } = await api.patch<Task>(`/tasks/${id}/`, payload)
    return data
  },

  delete: async (id: number) => {
    await api.delete(`/tasks/${id}/`)
  },

  getStatuses: async (projectId?: number | null) => {
    const params = {
      limit: 100,
      offset: 0,
      ordering: 'order',
      ...(projectId != null ? { project_id: projectId } : {})
    }
    const { data } = await api.get<{ results: TaskStatus[] }>('/tasks/statuses/', { params })
    return data
  },

  createStatus: async (payload: CreateTaskStatusPayload) => {
    const { data } = await api.post<TaskStatus>('/tasks/statuses/', payload)
    return data
  },

  updateStatus: async (id: number, payload: UpdateTaskStatusPayload) => {
    const { data } = await api.patch<TaskStatus>(`/tasks/statuses/${id}/`, payload)
    return data
  },

  deleteStatus: async (id: number) => {
    await api.delete(`/tasks/statuses/${id}/`)
  }
}
