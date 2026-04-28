import { useQuery } from '@tanstack/react-query'
import { Plus, Star } from 'lucide-react'
import { useState } from 'react'

import { getCatalogImagesQuery } from '@/api/catalog-image/query'
import { ImageGallery } from '@/components/common/image-gallery'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface ImageStripProps {
  entityType: 'product' | 'category' | 'vp'
  entityId: string
  projectId: number | null
  label?: string
  className?: string
}

export const ImageStrip = ({
  entityType,
  entityId,
  projectId,
  label,
  className,
}: ImageStripProps) => {
  const [galleryOpen, setGalleryOpen] = useState(false)

  const { data, isLoading } = useQuery(
    getCatalogImagesQuery(entityType, entityId, projectId ?? undefined)
  )

  const images = data?.results ?? []

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className='size-10 shrink-0 rounded-md' />
        ))}
      </div>
    )
  }

  return (
    <>
      <div className={cn('flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]', className)}>
        {images.map((img) => (
          <button
            key={img.id}
            type='button'
            className='group relative size-10 shrink-0 overflow-hidden rounded-md border border-border bg-bg-secondary transition-colors hover:border-primary/40'
            onClick={() => setGalleryOpen(true)}
          >
            <img
              src={img.thumbnail_url}
              alt={img.alt || ''}
              className='size-full object-cover'
              loading='lazy'
            />
            {img.is_primary && (
              <div className='absolute left-0.5 top-0.5'>
                <Star className='size-2.5 fill-amber-400 text-amber-400 drop-shadow-sm' />
              </div>
            )}
          </button>
        ))}
        <button
          type='button'
          className='flex size-10 shrink-0 items-center justify-center rounded-md border border-dashed border-border text-text-quaternary transition-colors hover:border-primary/40 hover:text-primary/60'
          onClick={() => setGalleryOpen(true)}
        >
          <Plus className='size-3.5' />
        </button>
      </div>

      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>{label || 'Manage Images'}</DialogTitle>
          </DialogHeader>
          <DialogBody className='max-h-[60vh] overflow-y-auto'>
            <ImageGallery
              entityType={entityType}
              entityId={entityId}
              projectId={projectId}
            />
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  )
}
