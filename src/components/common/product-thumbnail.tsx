import { useQuery } from '@tanstack/react-query'
import { Package } from 'lucide-react'

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
  const { data, isLoading } = useQuery(
    getCatalogImagesQuery(entityType, entityId, projectId ?? undefined)
  )

  const primary = data?.results?.find((img) => img.is_primary) ?? data?.results?.[0]

  if (primary) {
    return (
      <img
        src={primary.thumbnail_url}
        alt={primary.alt || ''}
        className={cn('rounded object-cover', className)}
        loading='lazy'
      />
    )
  }

  // Loading or no image — show a subtle icon placeholder
  return (
    <div className={cn('flex items-center justify-center rounded bg-bg-secondary/60', className)}>
      {!isLoading && <Package className='size-3.5 text-text-quaternary/50' />}
    </div>
  )
}
