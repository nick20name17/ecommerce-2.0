import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

interface ProductImageGalleryProps {
  photos: string[] | undefined
  photoIndex: number
  onPhotoIndexChange: (index: number) => void
  displayName: string
}

export function ProductImageGallery({
  photos,
  photoIndex,
  onPhotoIndexChange,
  displayName
}: ProductImageGalleryProps) {
  return (
    <div className='flex flex-col gap-3'>
      <div className='group relative'>
        {photos?.length ? (
          <div className='bg-muted/30 relative aspect-square w-full overflow-hidden rounded-xl border'>
            <img
              src={photos[photoIndex]}
              alt={displayName}
              className='size-full object-contain p-2 transition-transform duration-150 group-hover:scale-[1.02]'
            />
            {photos.length > 1 && (
              <>
                <button
                  type='button'
                  className='bg-background/90 ring-border hover:bg-background absolute top-1/2 left-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full shadow-md ring-1 backdrop-blur-sm transition-all disabled:pointer-events-none disabled:opacity-0'
                  disabled={photoIndex === 0}
                  onClick={() => onPhotoIndexChange(photoIndex - 1)}
                >
                  <ChevronLeft className='size-3.5' />
                </button>
                <button
                  type='button'
                  className='bg-background/90 ring-border hover:bg-background absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full shadow-md ring-1 backdrop-blur-sm transition-all disabled:pointer-events-none disabled:opacity-0'
                  disabled={photoIndex === photos.length - 1}
                  onClick={() => onPhotoIndexChange(photoIndex + 1)}
                >
                  <ChevronRight className='size-3.5' />
                </button>
                <div className='bg-foreground/80 text-background absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium backdrop-blur-sm'>
                  {photoIndex + 1} / {photos.length}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className='bg-muted/30 flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-xl border'>
            <ImageIcon className='text-muted-foreground/40 size-12' />
            <span className='text-muted-foreground text-xs'>No images</span>
          </div>
        )}
      </div>

      {photos && photos.length > 1 && (
        <div className='flex gap-2 overflow-x-auto p-1'>
          {photos.map((photo, i) => (
            <button
              key={photo}
              type='button'
              className={cn(
                'relative size-14 shrink-0 overflow-hidden rounded-lg ring-2 transition-all',
                i === photoIndex
                  ? 'ring-primary'
                  : 'hover:ring-muted-foreground/30 ring-transparent'
              )}
              onClick={() => onPhotoIndexChange(i)}
            >
              <img
                src={photo}
                alt={`${displayName} - ${i + 1}`}
                className='size-full object-cover'
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
