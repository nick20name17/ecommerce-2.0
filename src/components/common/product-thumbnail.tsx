import { useQuery } from '@tanstack/react-query'

import { getCatalogImagesQuery } from '@/api/catalog-image/query'
import { cn } from '@/lib/utils'

interface ProductThumbnailProps {
  entityType: 'product' | 'category' | 'vp'
  entityId: string
  projectId: number | null
  className?: string
}

export const ProductThumbnail = ({
  entityType,
  entityId,
  projectId,
  className,
}: ProductThumbnailProps) => {
  const { data } = useQuery({
    ...getCatalogImagesQuery(entityType, entityId, projectId ?? undefined),
    staleTime: 5 * 60 * 1000,
  })

  const primary = data?.results?.find((img) => img.is_primary) ?? data?.results?.[0]
  if (!primary) return <div className={cn('bg-bg-secondary rounded', className)} />

  return (
    <img
      src={primary.thumbnail_url}
      alt={primary.alt || ''}
      className={cn('rounded object-cover', className)}
      loading='lazy'
    />
  )
}
