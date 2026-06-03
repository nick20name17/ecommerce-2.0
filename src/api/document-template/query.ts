import { queryOptions } from '@tanstack/react-query'

import type { DocumentTemplateListParams } from './schema'
import { documentTemplateService } from './service'

export const DOCUMENT_TEMPLATE_QUERY_KEYS = {
  all: () => ['document-templates'] as const,
  lists: () => [...DOCUMENT_TEMPLATE_QUERY_KEYS.all(), 'list'] as const,
  list: (filters: DocumentTemplateListParams = {}, projectId?: number | null) =>
    [...DOCUMENT_TEMPLATE_QUERY_KEYS.lists(), { filters, projectId }] as const,
  details: () => [...DOCUMENT_TEMPLATE_QUERY_KEYS.all(), 'detail'] as const,
  detail: (id: number, projectId?: number | null) =>
    [...DOCUMENT_TEMPLATE_QUERY_KEYS.details(), id, projectId] as const
}

export const getDocumentTemplatesQuery = (
  filters: DocumentTemplateListParams = {},
  projectId?: number | null
) =>
  queryOptions({
    queryKey: DOCUMENT_TEMPLATE_QUERY_KEYS.list(filters, projectId),
    queryFn: () => documentTemplateService.list(filters, projectId)
  })

export const getDocumentTemplateQuery = (id: number, projectId?: number | null) =>
  queryOptions({
    queryKey: DOCUMENT_TEMPLATE_QUERY_KEYS.detail(id, projectId),
    queryFn: () => documentTemplateService.getById(id, projectId),
    enabled: !!id
  })
