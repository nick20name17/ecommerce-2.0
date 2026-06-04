import { queryOptions } from '@tanstack/react-query'

import type { PushStatusParams } from './schema'
import { pushStatusService } from './service'

export const PUSH_STATUS_QUERY_KEYS = {
  all: () => ['push-status'] as const,
  lists: () => [...PUSH_STATUS_QUERY_KEYS.all(), 'list'] as const,
  list: (params: PushStatusParams = {}) => [...PUSH_STATUS_QUERY_KEYS.lists(), params] as const,
  overview: () => [...PUSH_STATUS_QUERY_KEYS.all(), 'overview'] as const
}

export const getPushStatusQuery = (params: PushStatusParams = {}) =>
  queryOptions({
    queryKey: PUSH_STATUS_QUERY_KEYS.list(params),
    queryFn: () => pushStatusService.get(params),
    staleTime: 0,
    // Real-time updates arrive via the notifications WebSocket
    // (storefront_push_logged -> invalidate). This poll is a fallback that
    // also surfaces brand-new before-process orders that haven't logged a
    // push yet, so it can be relaxed from the old 10s now that WS is primary.
    refetchInterval: 30_000
  })

// Cross-project admin overview. The notifications WS is per-project, so this
// view can't subscribe to every project's events — it polls instead. The
// backend caches the live fan-out ~45s, so a 30s poll is cheap.
export const getPushStatusOverviewQuery = () =>
  queryOptions({
    queryKey: PUSH_STATUS_QUERY_KEYS.overview(),
    queryFn: () => pushStatusService.getOverview(),
    staleTime: 0,
    refetchInterval: 30_000
  })
