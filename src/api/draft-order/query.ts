import { queryOptions } from '@tanstack/react-query'

import type { DraftOrderListParams } from './schema'
import { draftOrderService } from './service'

export const DRAFT_ORDER_QUERY_KEYS = {
  all: () => ['draft-orders'] as const,
  lists: () => [...DRAFT_ORDER_QUERY_KEYS.all(), 'list'] as const,
  list: (params: DraftOrderListParams = {}, projectId?: number | null) =>
    [...DRAFT_ORDER_QUERY_KEYS.lists(), { params, projectId }] as const,
  details: () => [...DRAFT_ORDER_QUERY_KEYS.all(), 'detail'] as const,
  detail: (id: number, projectId?: number | null) =>
    [...DRAFT_ORDER_QUERY_KEYS.details(), id, projectId] as const
}

export const getDraftOrdersQuery = (params: DraftOrderListParams = {}, projectId?: number | null) =>
  queryOptions({
    queryKey: DRAFT_ORDER_QUERY_KEYS.list(params, projectId),
    queryFn: () => draftOrderService.list(params, projectId)
  })

export const getDraftOrderQuery = (id: number, projectId?: number | null) =>
  queryOptions({
    queryKey: DRAFT_ORDER_QUERY_KEYS.detail(id, projectId),
    queryFn: () => draftOrderService.getById(id, projectId),
    enabled: !!id
  })
