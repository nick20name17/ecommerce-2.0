import { api } from '..'

import type {
  EditableFieldsResponse,
  FieldAliasesResponse,
  FieldTypesResponse,
} from './schema'

export const dataService = {
  getEditableFields: async (projectId?: number | null) => {
    const { data } = await api.get<EditableFieldsResponse>('/data/editable-fields/', {
      params: projectId ? { project_id: projectId } : undefined,
    })
    return data
  },

  getFieldTypes: async (projectId?: number | null) => {
    const { data } = await api.get<FieldTypesResponse>('/data/field-types/', {
      params: projectId ? { project_id: projectId } : undefined,
    })
    return data
  },

  getFieldAliases: async (projectId?: number | null) => {
    const { data } = await api.get<FieldAliasesResponse>('/data/field-aliases/', {
      params: projectId ? { project_id: projectId } : undefined,
    })
    return data
  },
}
