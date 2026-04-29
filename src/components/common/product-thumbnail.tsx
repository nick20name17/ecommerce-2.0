import { useQuery } from '@tanstack/react-query'
import { Package } from 'lucide-react'

import { getCatalogImagesQuery } from '@/api/catalog-image/query'
import { cn } from '@/lib/utils'

interface ProductThumbnailProps {
  entityType: 'product' | 'category' | 'vp'
  entityId: string
  projectId: number | null
  className?: string
  /** If true, don't fetch images — just show a colored placeholder. Good for lists. */
  lazy?: boolean
}

// Generate a stable color from entity ID
const COLORS = [
  'bg-blue-100 text-blue-600',
  'bg-purple-100 text-purple-600',
  'bg-amber-100 text-amber-600',
  'bg-emerald-100 text-emerald-600',
  'bg-rose-100 text-rose-600',
  'bg-cyan-100 text-cyan-600',
  'bg-orange-100 text-orange-600',
  'bg-violet-100 text-violet-600',
]

function getColorForId(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0
  return COLORS[Math.abs(hash) % COLORS.length]
}

function getInitial(entityType: string, entityId: string) {
  // Use first letter of the ID, or entity type initial
  const char = entityId.charAt(0).toUpperCase()
  return /[A-Z0-9]/.test(char) ? char : entityType.charAt(0).toUpperCase()
}

export const ProductThumbnail = ({
  entityType,
  entityId,
  projectId,
  className,
  lazy,
}: ProductThumbnailProps) => {
  const { data } = useQuery({
    ...getCatalogImagesQuery(entityType, entityId, projectId ?? undefined),
    enabled: !lazy,
  })

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

  // Colored initial placeholder — instant, no API call needed
  const color = getColorForId(entityId)
  const initial = getInitial(entityType, entityId)

  return (
    <div className={cn('flex items-center justify-center rounded font-medium text-[11px]', color, className)}>
      {initial}
    </div>
  )
}
