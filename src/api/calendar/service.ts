import { api } from '..'

import type {
  CalendarEventPatchPayload,
  CalendarEventsParams,
  CalendarEventsResponse,
  CalendarSourcesResponse
} from './schema'

const projectParams = (projectId?: number | null) =>
  projectId != null ? { project_id: projectId } : {}

export const calendarService = {
  getSources: async (projectId?: number | null) => {
    const { data } = await api.get<CalendarSourcesResponse>('/calendar/sources/', {
      params: projectParams(projectId)
    })
    return data
  },

  getEvents: async (params: CalendarEventsParams) => {
    const { data } = await api.get<CalendarEventsResponse>('/calendar/events/', { params })
    return data
  },

  patchEvent: async (
    source: string,
    entityId: string,
    payload: CalendarEventPatchPayload,
    projectId?: number | null
  ) => {
    const { data } = await api.patch<{ success: boolean }>(
      `/calendar/events/${source}/${entityId}/`,
      payload,
      { params: projectParams(projectId) }
    )
    return data
  }
}
