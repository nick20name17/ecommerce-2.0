import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

interface ProductImageGalleryProps {
  photos: string[] | undefined
  photoIndex: number
  onPhotoIndexChange: (index: number) => void
  displayName: string
}

export const ProductImageGallery = ({
  photos,
  photoIndex,
  onPhotoIndexChange,
  displayName
}: ProductImageGalleryProps) => {
  return (
    <div className='flex flex-col gap-2'>
      {/* Main image */}
      <div className='group relative'>
        {photos?.length ? (
          <div className='relative aspect-square w-full overflow-hidden rounded-[8px] border border-border bg-bg-secondary/30'>
            <img
              src={photos[photoIndex]}
              alt={displayName}
              className='size-full object-contain p-3'
              loading='lazy'
            />
            {photos.length > 1 && (
              <>
                <button
                  type='button'
                  className='absolute top-1/2 left-1.5 flex size-6 -translate-y-1/2 items-center justify-center rounded-[5px] bg-background/90 text-text-tertiary shadow-sm ring-1 ring-border transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-0'
                  disabled={photoIndex === 0}
                  onClick={() => onPhotoIndexChange(photoIndex - 1)}
                >
                  <ChevronLeft className='size-3' />
                </button>
                <button
                  type='button'
                  className='absolute top-1/2 right-1.5 flex size-6 -translate-y-1/2 items-center justify-center rounded-[5px] bg-background/90 text-text-tertiary shadow-sm ring-1 ring-border transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-0'
                  disabled={photoIndex === photos.length - 1}
                  onClick={() => onPhotoIndexChange(photoIndex + 1)}
                >
                  <ChevronRight className='size-3' />
                </button>
                <span className='absolute right-1.5 bottom-1.5 rounded-[4px] bg-foreground/70 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-background'>
                  {photoIndex + 1}/{photos.length}
                </span>
              </>
            )}
          </div>
        ) : (
          <div className='flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-[8px] border border-border bg-bg-secondary/30'>
            <ImageIcon className='size-8 text-text-tertiary/30' />
            <span className='text-[12px] text-text-tertiary'>No images</span>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {photos && photos.length > 1 && (
        <div className='flex gap-1.5 overflow-x-auto'>
          {photos.map((photo, i) => (
            <button
              key={photo}
              type='button'
              className={cn(
                'relative size-12 shrink-0 overflow-hidden rounded-[5px] border transition-colors',
                i === photoIndex
                  ? 'border-primary'
                  : 'border-border hover:border-text-tertiary/40'
              )}
              onClick={() => onPhotoIndexChange(i)}
            >
              <img
                src={photo}
                alt={`${displayName} - ${i + 1}`}
                className='size-full object-cover'
                loading='lazy'
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
