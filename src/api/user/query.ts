import { queryOptions } from '@tanstack/react-query'

import type { UserParams } from './schema'
import { userService } from './service'

export const USERS_QUERY_KEYS = {
  all: () => ['users'] as const,

  lists: () => [...USERS_QUERY_KEYS.all(), 'list'] as const,
  list: (params: UserParams = {}) => [...USERS_QUERY_KEYS.lists(), params] as const,

  details: () => [...USERS_QUERY_KEYS.all(), 'detail'] as const,
  detail: (id: string) => [...USERS_QUERY_KEYS.details(), id] as const
}

export const getUsersQuery = (params: UserParams = {}) =>
  queryOptions({
    queryKey: USERS_QUERY_KEYS.list(params),
    queryFn: () => userService.get(params)
  })
