import { queryOptions } from '@tanstack/react-query'

import { catalogImageService } from './service'

export const CATALOG_IMAGE_QUERY_KEYS = {
  all: () => ['catalog-images'] as const,
  list: (entityType: string, entityId: string, projectId?: number) =>
    [...CATALOG_IMAGE_QUERY_KEYS.all(), entityType, entityId, projectId] as const,
}

export const getCatalogImagesQuery = (
  entityType: string,
  entityId: string,
  projectId?: number
) =>
  queryOptions({
    queryKey: CATALOG_IMAGE_QUERY_KEYS.list(entityType, entityId, projectId),
    queryFn: () =>
      catalogImageService.list({
        entity_type: entityType,
        entity_id: entityId,
        project_id: projectId,
      }),
    enabled: !!entityType && !!entityId,
  })
