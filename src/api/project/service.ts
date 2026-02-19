import { api } from '..'

import type {
  CreateProjectPayload,
  Project,
  ProjectHealth,
  ProjectParams,
  ProjectResponse,
  UpdateProjectPayload,
} from './schema'

export const projectService = {
  get: async (params: ProjectParams = {}) => {
    const { data } = await api.get<ProjectResponse>('/projects/', { params })
    return data
  },

  getById: async (id: number) => {
    const { data } = await api.get<Project>(`/projects/${id}/`)
    return data
  },

  getHealth: async (projectId: number) => {
    const { data } = await api.get<ProjectHealth>('/projects/my-health/', {
      params: { project_id: projectId },
    })
    return data
  },

  create: async (payload: CreateProjectPayload) => {
    const { data } = await api.post<Project>('/projects/', payload)
    return data
  },

  update: async ({ id, payload }: UpdateProjectPayload) => {
    const { data } = await api.patch<Project>(`/projects/${id}/`, payload)
    return data
  },

  delete: async (id: number) => {
    const { data } = await api.delete<Project>(`/projects/${id}/`)
    return data
  },
}
