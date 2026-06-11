export type CalendarWriteMode = 'web' | 'overlay' | 'ebms' | 'config'

export interface CalendarSourceInfo {
  key: string
  label: string
  color: string
  write_mode: CalendarWriteMode
  kind: 'native' | 'ebms'
  available: boolean
  date_label: string
  ebms_table: string | null
}

export interface CalendarApiEvent {
  source: string
  id: string
  title: string
  start: string
  end: string
  color: string
  meta: string | null
  native_start: string | null
  native_end: string | null
  overridden: boolean
  write_mode: CalendarWriteMode
}

export interface CalendarEventsResponse {
  events: CalendarApiEvent[]
  sources: CalendarSourceInfo[]
}

export interface CalendarSourcesResponse {
  sources: CalendarSourceInfo[]
}

export interface CalendarEventsParams {
  date_from: string
  date_to: string
  sources?: string
  project_id?: number
}

export interface CalendarEventPatchPayload {
  start?: string | null
  end?: string | null
  color?: string | null
}
