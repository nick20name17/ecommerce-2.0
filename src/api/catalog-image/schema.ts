export interface CatalogImageItem {
  id: number
  entity_type: 'product' | 'category' | 'vp'
  entity_id: string
  url: string
  thumbnail_url: string
  alt: string
  sort_order: number
  is_primary: boolean
  original_filename: string
  file_size: number
  content_type: string
  created_at: string
}

export interface CatalogImageListResponse {
  results: CatalogImageItem[]
}

export interface PresignedUploadResponse {
  upload_url: string
  s3_key: string
  filename: string
}