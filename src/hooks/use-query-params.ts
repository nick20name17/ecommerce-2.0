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

const parseAsDateOnly = createParser<Date | null>({
  parse: (v) => {
    if (!v) return null
    const d = new Date(v + 'T00:00:00')
    return isNaN(d.getTime()) ? null : d
  },
  serialize: (v) =>
    v instanceof Date ? v.toISOString().slice(0, 10) : '',
  eq: (a, b) => (a?.getTime() ?? null) === (b?.getTime() ?? null)
})

const offsetParser = parseAsInteger.withDefault(0)
const limitParser = parseAsInteger.withDefault(DEFAULT_LIMIT)

export const useSearchParam = () => {
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

export const useOrderStatusParam = () => useQueryState('status', orderStatusParser)

export const useStatusParam = () => useQueryState('status', parseAsString)

export const usePayloadLogCreatedAfter = () => useQueryState('created_after', parseAsIsoDate)
export const usePayloadLogCreatedBefore = () => useQueryState('created_before', parseAsIsoDate)
export const usePayloadLogEntity = () => useQueryState('entity', parseAsString)
export const usePayloadLogMethod = () => useQueryState('method', parseAsString)
export const usePayloadLogStatusCode = () => useQueryState('status_code', parseAsInteger)
export const usePayloadLogIsError = () =>
  useQueryState('is_error', parseAsStringLiteral(['true', 'false']))

export const useTaskStatusParam = () => useQueryState('task_status', parseAsInteger)

const TASK_PRIORITY_VALUES = ['low', 'medium', 'high', 'urgent'] as [string, ...string[]]
export const useTaskPriorityParam = () =>
  useQueryState(
    'task_priority',
    parseAsStringLiteral(TASK_PRIORITY_VALUES).withDefault('')
  )
export const useTaskResponsibleParam = () =>
  useQueryState('task_responsible', parseAsInteger)
export const useTaskDueFromParam = () => useQueryState('due_from', parseAsDateOnly)
export const useTaskDueToParam = () => useQueryState('due_to', parseAsDateOnly)

export const useOrderAutoidParam = () => useQueryState('autoid', parseAsString)
export const useProposalAutoidParam = () => useQueryState('autoid', parseAsString)
export const useOrderProjectIdParam = () =>
  useQueryState('project_id', parseAsInteger.withOptions({ shallow: false }))
