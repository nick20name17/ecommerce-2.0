import { queryOptions } from '@tanstack/react-query'

import { dataSchemaService } from './service'

export const DATA_SCHEMA_QUERY_KEYS = {
  all: () => ['data-schema'] as const,
  schema: (projectId: number) => [...DATA_SCHEMA_QUERY_KEYS.all(), projectId] as const
}

export const getDataSchemaQuery = (projectId: number | null) =>
  queryOptions({
    queryKey: DATA_SCHEMA_QUERY_KEYS.schema(projectId!),
    queryFn: () => dataSchemaService.getSchema(projectId!),
    enabled: !!projectId
  })
