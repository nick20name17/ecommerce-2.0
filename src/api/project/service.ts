import { api } from '..'

import type { Project, ProjectParams, ProjectResponse } from './schema'

export const projectService = {
  get: async (params: ProjectParams = {}) => {
    const { data } = await api.get<ProjectResponse>('/projects/', { params })
    return data
  },

  getById: async (id: number) => {
    const { data } = await api.get<Project>(`/projects/${id}/`)
    return data
  },
}
