import { queryOptions } from '@tanstack/react-query'

import type { UserParams } from './schema'
import { userService } from './service'

export const USER_QUERY_KEYS = {
  all: () => ['users'] as const,

  lists: () => [...USER_QUERY_KEYS.all(), 'list'] as const,
  list: (params: UserParams = {}) => [...USER_QUERY_KEYS.lists(), params] as const,

  details: () => [...USER_QUERY_KEYS.all(), 'detail'] as const,
  detail: (id: string) => [...USER_QUERY_KEYS.details(), id] as const
}

export const getUsersQuery = (params: UserParams = {}) =>
  queryOptions({
    queryKey: USER_QUERY_KEYS.list(params),
    queryFn: () => userService.get(params)
  })
