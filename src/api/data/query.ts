import { queryOptions } from '@tanstack/react-query'

import { dataService } from './service'

export const DATA_QUERY_KEYS = {
  editableFields: (projectId?: number | null) => ['editable-fields', projectId] as const,
  fieldTypes: (projectId?: number | null) => ['field-types', projectId] as const,
  fieldAliases: (projectId?: number | null) => ['field-aliases', projectId] as const,
}

export const getEditableFieldsQuery = (projectId?: number | null) =>
  queryOptions({
    queryKey: DATA_QUERY_KEYS.editableFields(projectId),
    queryFn: () => dataService.getEditableFields(projectId),
    staleTime: 30 * 60 * 1000,
  })

export const getFieldTypesQuery = (projectId?: number | null) =>
  queryOptions({
    queryKey: DATA_QUERY_KEYS.fieldTypes(projectId),
    queryFn: () => dataService.getFieldTypes(projectId),
    staleTime: 30 * 60 * 1000,
  })

export const getFieldAliasesQuery = (projectId?: number | null) =>
  queryOptions({
    queryKey: DATA_QUERY_KEYS.fieldAliases(projectId),
    queryFn: () => dataService.getFieldAliases(projectId),
    staleTime: 30 * 60 * 1000,
  })
