import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon, XIcon } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { useCallback, useEffect } from 'react'

import type { TaskAttachment } from '@/api/task/schema'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AttachmentLightboxProps {
  images: TaskAttachment[]
  currentIndex: number
  onIndexChange: (index: number) => void
  onClose: () => void
}

export function AttachmentLightbox({
  images,
  currentIndex,
  onIndexChange,
  onClose
}: AttachmentLightboxProps) {
  const current = images[currentIndex]
  const hasMultiple = images.length > 1

  const goNext = useCallback(() => {
    onIndexChange((currentIndex + 1) % images.length)
  }, [currentIndex, images.length, onIndexChange])

  const goPrev = useCallback(() => {
    onIndexChange((currentIndex - 1 + images.length) % images.length)
  }, [currentIndex, images.length, onIndexChange])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goNext, goPrev])

  if (!current) return null

  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className='fixed inset-0 z-50 bg-black/80 data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 duration-100' />
        <DialogPrimitive.Content
          className='fixed inset-0 z-50 flex flex-col outline-none'
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          {/* Header */}
          <div className='flex items-center justify-between px-4 py-3'>
            <div className='flex items-center gap-3 min-w-0'>
              <p className='truncate text-sm font-medium text-white/90'>
                {current.file_name}
              </p>
              {hasMultiple && (
                <span className='shrink-0 text-[13px] text-white/50'>
                  {currentIndex + 1} / {images.length}
                </span>
              )}
            </div>
            <div className='flex items-center gap-1'>
              <Button
                variant='ghost'
                size='icon-sm'
                className='text-white/70 hover:text-white hover:bg-white/10'
                asChild
              >
                <a
                  href={current.download_url}
                  download={current.file_name}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <DownloadIcon className='size-4' />
                </a>
              </Button>
              <DialogPrimitive.Close asChild>
                <Button
                  variant='ghost'
                  size='icon-sm'
                  className='text-white/70 hover:text-white hover:bg-white/10'
                >
                  <XIcon className='size-4' />
                </Button>
              </DialogPrimitive.Close>
            </div>
          </div>

          {/* Image area */}
          <div
            className='flex min-h-0 flex-1 items-center justify-center px-16 pb-6'
            onClick={onClose}
          >
            <img
              src={current.download_url}
              alt={current.file_name}
              className='max-h-full max-w-full rounded-lg object-contain'
              onClick={(e) => e.stopPropagation()}
              draggable={false}
            />
          </div>

          {/* Navigation arrows — fixed to viewport center so they don't shift with image size */}
          {hasMultiple && (
            <>
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation()
                  goPrev()
                }}
                className={cn(
                  'fixed left-3 top-1/2 z-10 -translate-y-1/2 flex size-10 items-center justify-center rounded-full',
                  'bg-white/10 text-white/70 backdrop-blur-sm transition-colors duration-[80ms]',
                  'hover:bg-white/20 hover:text-white'
                )}
              >
                <ChevronLeftIcon className='size-5' />
              </button>
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation()
                  goNext()
                }}
                className={cn(
                  'fixed right-3 top-1/2 z-10 -translate-y-1/2 flex size-10 items-center justify-center rounded-full',
                  'bg-white/10 text-white/70 backdrop-blur-sm transition-colors duration-[80ms]',
                  'hover:bg-white/20 hover:text-white'
                )}
              >
                <ChevronRightIcon className='size-5' />
              </button>
            </>
          )}

          {/* Hidden title for accessibility */}
          <DialogPrimitive.Title className='sr-only'>
            {current.file_name}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className='sr-only'>
            Image preview
          </DialogPrimitive.Description>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
