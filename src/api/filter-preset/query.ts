import { queryOptions } from '@tanstack/react-query'

import type { FilterPresetEntityType, FilterPresetParams } from './schema'
import { filterPresetService } from './service'

export const FILTER_PRESET_QUERY_KEYS = {
  all: () => ['filter-presets'] as const,
  lists: () => [...FILTER_PRESET_QUERY_KEYS.all(), 'list'] as const,
  list: (params?: FilterPresetParams) =>
    [...FILTER_PRESET_QUERY_KEYS.lists(), params] as const,
  byEntity: (entityType: FilterPresetEntityType) =>
    [...FILTER_PRESET_QUERY_KEYS.lists(), { entity_type: entityType }] as const,
}

export const getFilterPresetsQuery = (params?: FilterPresetParams) =>
  queryOptions({
    queryKey: FILTER_PRESET_QUERY_KEYS.list(params),
    queryFn: () => filterPresetService.get(params),
  })

export const getFilterPresetsByEntityQuery = (entityType: FilterPresetEntityType) =>
  queryOptions({
    queryKey: FILTER_PRESET_QUERY_KEYS.byEntity(entityType),
    queryFn: () => filterPresetService.get({ entity_type: entityType }),
  })
