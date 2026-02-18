import { parseAsInteger, parseAsString, useQueryState } from 'nuqs'

import { DEFAULT_LIMIT } from '@/api/constants'

export const useSearchParam = () => {
  return useQueryState('search', parseAsString.withDefault(''))
}

export const useOffsetParam = () => {
  return useQueryState('offset', parseAsInteger.withDefault(0))
}

export const useLimitParam = () => {
  return useQueryState('limit', parseAsInteger.withDefault(DEFAULT_LIMIT))
}
