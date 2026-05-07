import { queryOptions } from '@tanstack/react-query'

import { metaService } from './service'

export const META_QUERY_KEYS = {
  all: () => ['meta'] as const,
  entity: (entityType: string, entityId: string, projectId?: number) =>
    [...META_QUERY_KEYS.all(), entityType, entityId, projectId] as const,
}

export const getMetaQuery = (
  entityType: string,
  entityId: string,
  projectId?: number
) =>
  queryOptions({
    queryKey: META_QUERY_KEYS.entity(entityType, entityId, projectId),
    queryFn: () =>
      metaService.get({
        entity_type: entityType,
        entity_id: entityId,
        project_id: projectId,
      }),
    enabled: !!entityType && !!entityId,
    staleTime: 60_000,
    gcTime: 30 * 60 * 1000,
  })
