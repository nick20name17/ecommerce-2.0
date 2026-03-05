import { queryOptions } from '@tanstack/react-query'

import type { EntityNoteType } from './schema'
import { noteService } from './service'

export const NOTE_QUERY_KEYS = {
  all: () => ['notes'] as const,
  lists: () => [...NOTE_QUERY_KEYS.all(), 'list'] as const,
  list: (params: {
    entityType?: EntityNoteType
    entityAutoid?: string
    projectId?: number | null
  }) => [...NOTE_QUERY_KEYS.lists(), params] as const,
  entityNotes: (entityType: EntityNoteType, autoid: string, projectId?: number | null) =>
    [...NOTE_QUERY_KEYS.all(), 'entity', entityType, autoid, projectId ?? ''] as const,
  summary: (entityType: EntityNoteType, autoid: string, projectId?: number | null) =>
    [...NOTE_QUERY_KEYS.all(), 'summary', entityType, autoid, projectId ?? ''] as const
}

export const getEntityNotesQuery = (
  entityType: EntityNoteType,
  autoid: string,
  projectId?: number | null
) =>
  queryOptions({
    queryKey: NOTE_QUERY_KEYS.entityNotes(entityType, autoid, projectId),
    queryFn: () => noteService.listEntityNotes(entityType, autoid, projectId),
    enabled: !!autoid
  })

export const getEntityNotesSummaryQuery = (
  entityType: EntityNoteType,
  autoid: string,
  projectId?: number | null
) =>
  queryOptions({
    queryKey: NOTE_QUERY_KEYS.summary(entityType, autoid, projectId),
    queryFn: () =>
      noteService.listNotes({
        entity_type: entityType,
        entity_autoid: autoid,
        ordering: '-created_at',
        page: 1,
        project_id: projectId ?? undefined
      }),
    enabled: !!autoid
  })
