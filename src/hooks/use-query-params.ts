import {
  createParser,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState
} from 'nuqs'

import { DEFAULT_LIMIT } from '@/api/constants'

const parseAsIsoDate = createParser<Date | null>({
  parse: (v) => {
    if (!v) return null
    const d = new Date(v)
    return isNaN(d.getTime()) ? null : d
  },
  serialize: (v) => (v instanceof Date ? v.toISOString() : ''),
  eq: (a, b) => (a?.getTime() ?? null) === (b?.getTime() ?? null)
})

export const useSearchParam = () => {
  return useQueryState('search', parseAsString.withDefault(''))
}

export const useOffsetParam = () => {
  return useQueryState('offset', parseAsInteger.withDefault(0))
}

export const useLimitParam = () => {
  return useQueryState('limit', parseAsInteger.withDefault(DEFAULT_LIMIT))
}

export const usePayloadLogCreatedAfter = () =>
  useQueryState('created_after', parseAsIsoDate)
export const usePayloadLogCreatedBefore = () =>
  useQueryState('created_before', parseAsIsoDate)
export const usePayloadLogEntity = () => useQueryState('entity', parseAsString)
export const usePayloadLogMethod = () =>
  useQueryState('method', parseAsString)
export const usePayloadLogStatusCode = () =>
  useQueryState('status_code', parseAsInteger)
export const usePayloadLogIsError = () =>
  useQueryState('is_error', parseAsStringLiteral(['true', 'false']))
