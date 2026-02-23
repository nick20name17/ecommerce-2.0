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
          <div className='relative aspect-square w-full overflow-hidden rounded-xl border bg-muted/30'>
            <img
              src={photos[photoIndex]}
              alt={displayName}
              className='size-full object-contain p-4 transition-transform duration-300 group-hover:scale-[1.02]'
            />
            {photos.length > 1 && (
              <>
                <button
                  type='button'
                  className='absolute top-1/2 left-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-md ring-1 ring-border backdrop-blur-sm transition-all hover:bg-background disabled:pointer-events-none disabled:opacity-0'
                  disabled={photoIndex === 0}
                  onClick={() => onPhotoIndexChange(photoIndex - 1)}
                >
                  <ChevronLeft className='size-4' />
                </button>
                <button
                  type='button'
                  className='absolute top-1/2 right-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-md ring-1 ring-border backdrop-blur-sm transition-all hover:bg-background disabled:pointer-events-none disabled:opacity-0'
                  disabled={photoIndex === photos.length - 1}
                  onClick={() => onPhotoIndexChange(photoIndex + 1)}
                >
                  <ChevronRight className='size-4' />
                </button>
                <div className='absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-foreground/80 px-2.5 py-1 text-[10px] font-medium text-background backdrop-blur-sm'>
                  {photoIndex + 1} / {photos.length}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className='flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-xl border bg-muted/30'>
            <ImageIcon className='size-12 text-muted-foreground/40' />
            <span className='text-xs text-muted-foreground'>No images</span>
          </div>
        )}
      </div>

      {photos && photos.length > 1 && (
        <div className='flex gap-2 overflow-x-auto'>
          {photos.map((photo, i) => (
            <button
              key={photo}
              type='button'
              className={cn(
                'relative size-14 shrink-0 overflow-hidden rounded-lg ring-2 transition-all',
                i === photoIndex
                  ? 'ring-primary'
                  : 'ring-transparent hover:ring-muted-foreground/30'
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
