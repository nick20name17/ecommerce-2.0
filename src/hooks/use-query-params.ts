import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs'

import { DEFAULT_LIMIT } from '@/api/constants'
import { CUSTOMER_TAB_VALUES } from '@/constants/customer'

const offsetParser = parseAsInteger.withDefault(0)
const limitParser = parseAsInteger.withDefault(DEFAULT_LIMIT)

export const useSearchParam = () => useQueryState('search', parseAsString.withDefault(''))

export const useOffsetParam = () => {
  const [offset, setOffsetRaw] = useQueryState('offset', offsetParser)
  const normalized = Math.max(0, offset)
  const setOffset = (value: number | null) => {
    setOffsetRaw(value === null || value === 0 ? null : value)
  }
  return [normalized, setOffset] as const
}

export const useLimitParam = (customDefault?: number) => {
  const def = customDefault ?? DEFAULT_LIMIT
  // Reuse the shared parser when no override given to keep behaviour identical.
  const parser = customDefault != null ? parseAsInteger.withDefault(def) : limitParser
  const [limit, setLimitRaw] = useQueryState('limit', parser)
  const normalized = Math.max(1, limit)
  const setLimit = (value: number) => {
    setLimitRaw(value === def ? null : value)
  }
  return [normalized, setLimit] as const
}

export const useAutoidParam = () => useQueryState('autoid', parseAsString)

export const useCustomerTabParam = () =>
  useQueryState('tab', parseAsStringLiteral(CUSTOMER_TAB_VALUES).withDefault('orders'))

export const useOrderProjectIdParam = () =>
  useQueryState('project_id', parseAsInteger.withOptions({ shallow: false }))

export const useDashboardCustomerIdParam = () =>
  useQueryState('customer_id', parseAsString.withDefault(''))

export const usePresetParam = () => useQueryState('preset', parseAsInteger)
