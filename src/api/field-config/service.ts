import { api } from '..'

import type {
  FieldConfigPatchPayload,
  FieldConfigPatchResponse,
  FieldConfigResponse
} from './schema'

export const fieldConfigService = {
  getFieldConfig: async (projectId: number) => {
    const { data } = await api.get<FieldConfigResponse>('/data/field-config/', {
      params: { project_id: projectId }
    })
    return data
  },

  patchFieldConfig: async (
    projectId: number,
    payload: FieldConfigPatchPayload
  ) => {
    const { data } = await api.patch<FieldConfigPatchResponse>(
      '/data/field-config/',
      payload,
      { params: { project_id: projectId } }
    )
    return data
  }
}
