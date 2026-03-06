import { api } from '..'

import type {
  EntityNote,
  EntityNoteList,
  EntityNoteRequest,
  EntityNoteType,
  NotesListParams,
  PaginatedEntityNoteListList
} from './schema'

const ENTITY_PATHS: Record<EntityNoteType, string> = {
  customer: 'customers',
  order: 'orders',
  proposal: 'proposals'
}

const projectParam = (projectId?: number | null) =>
  projectId != null ? { project_id: projectId } : {}

export const noteService = {
  listEntityNotes: async (
    entityType: EntityNoteType,
    autoid: string,
    projectId?: number | null
  ): Promise<EntityNoteList[]> => {
    const path = ENTITY_PATHS[entityType]
    const { data } = await api.get<EntityNoteList[]>(`/data/${path}/${autoid}/notes/`, {
      params: projectParam(projectId)
    })
    return data
  },

  createEntityNote: async (
    entityType: EntityNoteType,
    autoid: string,
    payload: EntityNoteRequest,
    projectId?: number | null
  ): Promise<EntityNote> => {
    const path = ENTITY_PATHS[entityType]
    const { data } = await api.post<EntityNote>(`/data/${path}/${autoid}/notes/`, payload, {
      params: projectParam(projectId)
    })
    return data
  },

  listNotes: async (params: NotesListParams): Promise<PaginatedEntityNoteListList> => {
    const { data } = await api.get<PaginatedEntityNoteListList>('/notes/', {
      params: params.project_id != null ? { ...params, project_id: params.project_id } : params
    })
    return data
  },

  deleteNote: async (id: number): Promise<void> => {
    await api.delete(`/notes/${id}/`)
  }
}
