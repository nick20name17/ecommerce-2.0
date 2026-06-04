import { queryOptions } from '@tanstack/react-query'

import type { EntityNoteType } from './schema'
import { noteService } from './service'

export const NOTE_QUERY_KEYS = {
  all: () => ['notes'] as const,
  entityNotes: (entityType: EntityNoteType, autoid: string, projectId?: number | null) =>
    [...NOTE_QUERY_KEYS.all(), 'entity', entityType, autoid, projectId ?? ''] as const
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
