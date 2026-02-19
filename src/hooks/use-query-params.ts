import { useNavigate, useSearch } from '@tanstack/react-router'
import {
  createParser,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState
} from 'nuqs'

import { DEFAULT_LIMIT } from '@/api/constants'
import { ORDER_STATUS } from '@/constants/order'

const ORDER_STATUS_VALUES = ['all', ...Object.values(ORDER_STATUS)] as [string, ...string[]]
const orderStatusParser = parseAsStringLiteral(ORDER_STATUS_VALUES)

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

export function useOffsetParam() {
  const navigate = useNavigate()
  const search = useSearch({ from: '__root__' }) as { offset?: number } & Record<string, unknown>
  const raw = search?.offset
  const offset =
    raw !== undefined && raw !== null && raw !== ''
      ? Math.max(0, Math.floor(Number(raw)))
      : 0

  const setOffset = (value: number | null) => {
    const next = value === null || value === 0 ? undefined : value
    navigate({
      to: '.',
      search: (prev: Record<string, unknown>) => ({ ...prev, offset: next }),
      replace: true
    })
  }
  return [offset, setOffset] as const
}

export function useLimitParam() {
  const navigate = useNavigate()
  const search = useSearch({ from: '__root__' }) as { limit?: number } & Record<string, unknown>
  const raw = search?.limit
  const limit =
    raw !== undefined && raw !== null && raw !== ''
      ? Math.max(1, Math.floor(Number(raw)))
      : DEFAULT_LIMIT

  const setLimit = (value: number) => {
    const next = value === DEFAULT_LIMIT ? undefined : value
    navigate({
      to: '.',
      search: (prev: Record<string, unknown>) => ({ ...prev, limit: next }),
      replace: true
    })
  }
  return [limit, setLimit] as const
}

export { useProjectIdParam } from './use-project-id-param'

export const useOrderStatusParam = () => useQueryState('status', orderStatusParser)

export const usePayloadLogCreatedAfter = () => useQueryState('created_after', parseAsIsoDate)
export const usePayloadLogCreatedBefore = () => useQueryState('created_before', parseAsIsoDate)
export const usePayloadLogEntity = () => useQueryState('entity', parseAsString)
export const usePayloadLogMethod = () => useQueryState('method', parseAsString)
export const usePayloadLogStatusCode = () => useQueryState('status_code', parseAsInteger)
export const usePayloadLogIsError = () =>
  useQueryState('is_error', parseAsStringLiteral(['true', 'false']))

