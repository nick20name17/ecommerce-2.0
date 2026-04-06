import {
  createParser,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState
} from 'nuqs'

import { DEFAULT_LIMIT } from '@/api/constants'
import { CUSTOMER_TAB_VALUES } from '@/constants/customer'
import { ORDER_STATUS } from '@/constants/order'
import { dateToLocalDateTimeString } from '@/helpers/date'

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

const parseAsLocalDateTime = createParser<Date | null>({
  parse: (v) => {
    if (!v) return null
    const d = new Date(v)
    return isNaN(d.getTime()) ? null : d
  },
  serialize: (v) => (v instanceof Date ? dateToLocalDateTimeString(v) : ''),
  eq: (a, b) => (a?.getTime() ?? null) === (b?.getTime() ?? null)
})

const parseAsCommaSeparatedStrings = createParser<string[]>({
  parse: (v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []),
  serialize: (v) => (v?.length ? v.join(',') : ''),
  eq: (a, b) =>
    (a?.length ?? 0) === (b?.length ?? 0) &&
    (a ?? []).every((x, i) => (b ?? [])[i] === x)
})

const parseAsCommaSeparatedNumbers = createParser<number[]>({
  parse: (v) =>
    v
      ? v
          .split(',')
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !Number.isNaN(n))
      : [],
  serialize: (v) => (v?.length ? v.join(',') : ''),
  eq: (a, b) =>
    (a?.length ?? 0) === (b?.length ?? 0) &&
    (a ?? []).every((x, i) => (b ?? [])[i] === x)
})

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

export const useLimitParam = () => {
  const [limit, setLimitRaw] = useQueryState('limit', limitParser)
  const normalized = Math.max(1, limit)
  const setLimit = (value: number) => {
    setLimitRaw(value === DEFAULT_LIMIT ? null : value)
  }
  return [normalized, setLimit] as const
}

export const useOrderStatusParam = () => useQueryState('status', orderStatusParser)

export const useStatusParam = () => useQueryState('status', parseAsString)

export const usePayloadLogCreatedAfter = () => useQueryState('created_after', parseAsIsoDate)

export const usePayloadLogCreatedBefore = () => useQueryState('created_before', parseAsIsoDate)

export const usePayloadLogEntity = () => useQueryState('entity', parseAsString)

export const usePayloadLogMethod = () => useQueryState('method', parseAsString)

export const usePayloadLogStatusCode = () => useQueryState('status_code', parseAsInteger)

export const usePayloadLogIsError = () =>
  useQueryState('is_error', parseAsStringLiteral(['true', 'false']))

export const useTaskStatusesParam = () =>
  useQueryState('task_status', parseAsCommaSeparatedNumbers.withDefault([]))

export const useTaskPrioritiesParam = () =>
  useQueryState('task_priority', parseAsCommaSeparatedStrings.withDefault([]))

export const useTaskResponsibleParam = () => useQueryState('task_responsible', parseAsInteger)

export const useTaskDueFromParam = () => useQueryState('due_from', parseAsLocalDateTime)

export const useTaskDueToParam = () => useQueryState('due_to', parseAsLocalDateTime)

export const useAutoidParam = () => useQueryState('autoid', parseAsString)

export const useCustomerTabParam = () =>
  useQueryState('tab', parseAsStringLiteral(CUSTOMER_TAB_VALUES).withDefault('orders'))

export const useOrderProjectIdParam = () =>
  useQueryState('project_id', parseAsInteger.withOptions({ shallow: false }))

export const useDashboardCustomerIdParam = () =>
  useQueryState('customer_id', parseAsString.withDefault(''))

export const usePresetParam = () => useQueryState('preset', parseAsInteger)
