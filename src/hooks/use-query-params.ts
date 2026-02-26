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


const offsetParser = parseAsInteger.withDefault(0)
const limitParser = parseAsInteger.withDefault(DEFAULT_LIMIT)

export function useSearchParam() {
  return useQueryState('search', parseAsString.withDefault(''))
}

export function useOffsetParam() {
  const [offset, setOffsetRaw] = useQueryState('offset', offsetParser)
  const normalized = Math.max(0, offset)
  const setOffset = (value: number | null) => {
    setOffsetRaw(value === null || value === 0 ? null : value)
  }
  return [normalized, setOffset] as const
}

export function useLimitParam() {
  const [limit, setLimitRaw] = useQueryState('limit', limitParser)
  const normalized = Math.max(1, limit)
  const setLimit = (value: number) => {
    setLimitRaw(value === DEFAULT_LIMIT ? null : value)
  }
  return [normalized, setLimit] as const
}

export function useOrderStatusParam() {
  return useQueryState('status', orderStatusParser)
}

export function useStatusParam() {
  return useQueryState('status', parseAsString)
}

export function usePayloadLogCreatedAfter() {
  return useQueryState('created_after', parseAsIsoDate)
}

export function usePayloadLogCreatedBefore() {
  return useQueryState('created_before', parseAsIsoDate)
}

export function usePayloadLogEntity() {
  return useQueryState('entity', parseAsString)
}

export function usePayloadLogMethod() {
  return useQueryState('method', parseAsString)
}

export function usePayloadLogStatusCode() {
  return useQueryState('status_code', parseAsInteger)
}

export function usePayloadLogIsError() {
  return useQueryState('is_error', parseAsStringLiteral(['true', 'false']))
}

export function useTaskStatusParam() {
  return useQueryState('task_status', parseAsInteger)
}

const TASK_PRIORITY_VALUES = ['low', 'medium', 'high', 'urgent'] as [string, ...string[]]

export function useTaskPriorityParam() {
  return useQueryState(
    'task_priority',
    parseAsStringLiteral(TASK_PRIORITY_VALUES).withDefault('')
  )
}

export function useTaskResponsibleParam() {
  return useQueryState('task_responsible', parseAsInteger)
}

export function useTaskDueFromParam() {
  return useQueryState('due_from', parseAsIsoDate)
}

export function useTaskDueToParam() {
  return useQueryState('due_to', parseAsIsoDate)
}

export function useAutoidParam() {
  return useQueryState('autoid', parseAsString)
}

const CUSTOMER_TAB_VALUES = ['orders', 'todos'] as [string, ...string[]]

export function useCustomerTabParam() {
  return useQueryState(
    'tab',
    parseAsStringLiteral(CUSTOMER_TAB_VALUES).withDefault('orders')
  )
}

export function useOrderProjectIdParam() {
  return useQueryState('project_id', parseAsInteger.withOptions({ shallow: false }))
}

export function useDashboardCustomerIdParam() {
  return useQueryState('customer_id', parseAsString.withDefault(''))
}
