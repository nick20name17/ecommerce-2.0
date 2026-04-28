import { useQuery } from '@tanstack/react-query'
import { Folder, FolderOpen } from 'lucide-react'
import { useState } from 'react'

import { getCatalogImagesQuery } from '@/api/catalog-image/query'
import { cn } from '@/lib/utils'

interface CategoryIconProps {
  categoryId: string
  projectId: number | null
  expanded: boolean
  hasChildren: boolean
  depthStyle: string
}

export const CategoryIcon = ({
  categoryId,
  projectId,
  expanded,
  hasChildren,
  depthStyle,
}: CategoryIconProps) => {
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)

  const { data, isLoading } = useQuery(
    getCatalogImagesQuery('category', categoryId, projectId ?? undefined)
  )

  const primary = data?.results?.find((img) => img.is_primary) ?? data?.results?.[0]
  const url = primary?.thumbnail_url
  const hasImage = !!url && !imgError

  const FolderIcon = expanded && hasChildren ? FolderOpen : Folder

  // Still fetching image list — show a small neutral placeholder to avoid folder→image flash
  if (isLoading) {
    return <div className='size-5 shrink-0 rounded-[4px] bg-bg-secondary/60' />
  }

  // No images for this category — show folder icon
  if (!hasImage) {
    return <FolderIcon className={cn('size-4 shrink-0', depthStyle)} />
  }

  // Has image — show thumbnail with fade-in
  return (
    <div className='size-5 shrink-0 overflow-hidden rounded-[4px] border border-border/50 bg-bg-secondary shadow-sm'>
      <img
        src={url}
        alt=''
        className={cn('size-full object-cover transition-opacity duration-150', imgLoaded ? 'opacity-100' : 'opacity-0')}
        onLoad={() => setImgLoaded(true)}
        onError={() => setImgError(true)}
      />
    </div>
  )
}
