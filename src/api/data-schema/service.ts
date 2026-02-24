import { api } from '..'

import type { ProjectSchema, UpdateFieldsPayload } from './schema'

export const dataSchemaService = {
  getSchema: async (projectId: number) => {
    const { data } = await api.get<ProjectSchema>('/data/schema/', {
      params: { project_id: projectId }
    })
    return data
  },

  updateFields: async (payload: UpdateFieldsPayload) => {
    const { data } = await api.patch<ProjectSchema>('/data/schema/', payload)
    return data
  }
}
