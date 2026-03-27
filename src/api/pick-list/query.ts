import { queryOptions } from '@tanstack/react-query'

import type { PickListParams } from './schema'
import { pickListService } from './service'

export const PICK_LIST_QUERY_KEYS = {
  all: () => ['pick-lists'] as const,
  lists: () => [...PICK_LIST_QUERY_KEYS.all(), 'list'] as const,
  list: (params: PickListParams = {}) => [...PICK_LIST_QUERY_KEYS.lists(), params] as const,
  details: () => [...PICK_LIST_QUERY_KEYS.all(), 'detail'] as const,
  detail: (id: number) => [...PICK_LIST_QUERY_KEYS.details(), id] as const,
}

export const getPickListsQuery = (params: PickListParams = {}) =>
  queryOptions({
    queryKey: PICK_LIST_QUERY_KEYS.list(params),
    queryFn: () => pickListService.get(params),
  })

export const getPickListDetailQuery = (id: number) =>
  queryOptions({
    queryKey: PICK_LIST_QUERY_KEYS.detail(id),
    queryFn: () => pickListService.getById(id),
    enabled: !!id,
  })
