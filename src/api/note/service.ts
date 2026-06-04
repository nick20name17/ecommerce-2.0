import { api } from '..'

import type {
  EntityNote,
  EntityNoteList,
  EntityNoteRequest,
  EntityNoteType,
  PaginatedEntityNoteListList
} from './schema'

const projectParam = (projectId?: number | null) =>
  projectId != null ? { project_id: projectId } : {}

export const noteService = {
  listEntityNotes: async (
    entityType: EntityNoteType,
    autoid: string,
    projectId?: number | null
  ): Promise<EntityNoteList[]> => {
    const { data } = await api.get<PaginatedEntityNoteListList>('/notes/', {
      params: {
        entity_type: entityType,
        entity_autoid: autoid,
        ordering: '-created_at',
        ...projectParam(projectId)
      }
    })
    return data.results
  },

  createEntityNote: async (
    entityType: EntityNoteType,
    autoid: string,
    payload: EntityNoteRequest,
    projectId?: number | null
  ): Promise<EntityNote> => {
    const entityPath =
      entityType === 'order' ? 'orders' : entityType === 'proposal' ? 'proposals' : 'customers'
    const { data } = await api.post<EntityNote>(`/data/${entityPath}/${autoid}/notes/`, payload, {
      params: projectParam(projectId)
    })
    return data
  },

  deleteNote: async (id: number): Promise<void> => {
    await api.delete(`/notes/${id}/`)
  }
}
