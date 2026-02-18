import { queryOptions } from '@tanstack/react-query'

import type { PayloadLogParams } from './schema'
import { payloadLogService } from './service'

export const PAYLOAD_LOG_QUERY_KEYS = {
  all: () => ['payload-logs'] as const,
  lists: () => [...PAYLOAD_LOG_QUERY_KEYS.all(), 'list'] as const,
  list: (params: PayloadLogParams = {}) => [...PAYLOAD_LOG_QUERY_KEYS.lists(), params] as const,
  details: () => [...PAYLOAD_LOG_QUERY_KEYS.all(), 'detail'] as const,
  detail: (id: string) => [...PAYLOAD_LOG_QUERY_KEYS.details(), id] as const
}

export const getPayloadLogsQuery = (params: PayloadLogParams = {}) =>
  queryOptions({
    queryKey: PAYLOAD_LOG_QUERY_KEYS.list(params),
    queryFn: () => payloadLogService.get(params)
  })
