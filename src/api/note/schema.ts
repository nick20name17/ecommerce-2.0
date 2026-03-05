export type EntityNoteType = 'order' | 'proposal' | 'customer'

export interface EntityNote {
  id: number
  entity_type: EntityNoteType
  entity_autoid: string
  project: number
  text: string
  author: number | null
  author_details: { id: number; full_name?: string } | null
  last_edited_by: number | null
  last_edited_by_details: { id: number; full_name?: string } | null
  created_at: string
  updated_at: string
}

export interface EntityNoteList {
  id: number
  entity_type: EntityNoteType
  entity_autoid: string
  project: number
  text: string
  author: number | null
  author_name: string
  created_at: string
  updated_at: string
}

export interface EntityNoteRequest {
  text: string
}

export interface PaginatedEntityNoteListList {
  count: number
  next: string | null
  previous: string | null
  results: EntityNoteList[]
}

export interface NotesListParams {
  entity_type?: EntityNoteType
  entity_autoid?: string
  ordering?: string
  page?: number
  project_id?: number | null
}
