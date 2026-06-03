import { queryOptions } from '@tanstack/react-query'

import type { PushStatusParams } from './schema'
import { pushStatusService } from './service'

const PUSH_STATUS_QUERY_KEYS = {
  all: () => ['push-status'] as const,
  lists: () => [...PUSH_STATUS_QUERY_KEYS.all(), 'list'] as const,
  list: (params: PushStatusParams = {}) => [...PUSH_STATUS_QUERY_KEYS.lists(), params] as const
}

export const getPushStatusQuery = (params: PushStatusParams = {}) =>
  queryOptions({
    queryKey: PUSH_STATUS_QUERY_KEYS.list(params),
    queryFn: () => pushStatusService.get(params),
    staleTime: 0,
    refetchInterval: 10_000
  })
