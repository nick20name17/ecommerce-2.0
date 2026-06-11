import { queryOptions } from '@tanstack/react-query'

import type { CalendarEventsParams } from './schema'
import { calendarService } from './service'

export const CALENDAR_QUERY_KEYS = {
  all: () => ['calendar'] as const,
  sources: (projectId?: number | null) =>
    [...CALENDAR_QUERY_KEYS.all(), 'sources', projectId] as const,
  events: () => [...CALENDAR_QUERY_KEYS.all(), 'events'] as const,
  eventsRange: (params: CalendarEventsParams) => [...CALENDAR_QUERY_KEYS.events(), params] as const
}

export const getCalendarSourcesQuery = (projectId?: number | null) =>
  queryOptions({
    queryKey: CALENDAR_QUERY_KEYS.sources(projectId),
    queryFn: () => calendarService.getSources(projectId),
    staleTime: 1000 * 60 * 30
  })

export const getCalendarEventsQuery = (params: CalendarEventsParams) =>
  queryOptions({
    queryKey: CALENDAR_QUERY_KEYS.eventsRange(params),
    queryFn: () => calendarService.getEvents(params)
  })
