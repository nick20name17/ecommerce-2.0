import { queryOptions } from '@tanstack/react-query'

import { fieldConfigService } from './service'

export const FIELD_CONFIG_QUERY_KEYS = {
  all: () => ['field-config'] as const,
  fieldConfig: (projectId: number) => [...FIELD_CONFIG_QUERY_KEYS.all(), projectId] as const
}

export const getFieldConfigQuery = (projectId: number | null) =>
  queryOptions({
    queryKey: FIELD_CONFIG_QUERY_KEYS.fieldConfig(projectId!),
    queryFn: () => fieldConfigService.getFieldConfig(projectId!),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 30
  })
