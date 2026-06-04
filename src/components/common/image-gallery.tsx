import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { GripVertical, ImagePlus, Pencil, Star, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'

import { CATALOG_IMAGE_QUERY_KEYS, getCatalogImagesQuery } from '@/api/catalog-image/query'
import type { CatalogImageItem } from '@/api/catalog-image/schema'
import { catalogImageService } from '@/api/catalog-image/service'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface ImageGalleryProps {
  entityType: 'product' | 'category' | 'vp'
  entityId: string
  projectId: number | null
}

export const ImageGallery = ({ entityType, entityId, projectId }: ImageGalleryProps) => {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [editImage, setEditImage] = useState<CatalogImageItem | null>(null)
  const [editAlt, setEditAlt] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [dragImageId, setDragImageId] = useState<number | null>(null)
  const [dropTargetId, setDropTargetId] = useState<number | null>(null)

  const queryKey = CATALOG_IMAGE_QUERY_KEYS.list(entityType, entityId, projectId ?? undefined)

  const { data, isLoading } = useQuery(
    getCatalogImagesQuery(entityType, entityId, projectId ?? undefined)
  )

  const images = data?.results ?? []

  const invalidate = () => queryClient.invalidateQueries({ queryKey })

  const uploadFiles = async (files: FileList | File[]) => {
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const presigned = await catalogImageService.getPresignedUrl(
          {
            entity_type: entityType,
            entity_id: entityId,
            filename: file.name,
            content_type: file.type
          },
          { project_id: projectId ?? undefined }
        )

        await fetch(presigned.upload_url, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type }
        })

        await catalogImageService.confirmUpload(
          {
            entity_type: entityType,
            entity_id: entityId,
            s3_key: presigned.s3_key,
            original_filename: file.name,
            content_type: file.type
          },
          { project_id: projectId ?? undefined }
        )
      }
      invalidate()
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  const deleteMutation = useMutation({
    mutationFn: (imageId: number) =>
      catalogImageService.delete(imageId, {
        project_id: projectId ?? undefined
      }),
    onSuccess: invalidate
  })

  const setPrimaryMutation = useMutation({
    mutationFn: (imageId: number) =>
      catalogImageService.update(
        imageId,
        { is_primary: true },
        { project_id: projectId ?? undefined }
      ),
    onSuccess: invalidate
  })

  const updateAltMutation = useMutation({
    mutationFn: () =>
      catalogImageService.update(
        editImage!.id,
        { alt: editAlt },
        { project_id: projectId ?? undefined }
      ),
    onSuccess: () => {
      setEditImage(null)
      invalidate()
    }
  })

  const reorderMutation = useMutation({
    mutationFn: ({ imageId, newSortOrder }: { imageId: number; newSortOrder: number }) =>
      catalogImageService.update(
        imageId,
        { sort_order: newSortOrder },
        { project_id: projectId ?? undefined }
      ),
    onSuccess: invalidate
  })

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) uploadFiles(files)
  }

  const handleImageDragStart = (e: React.DragEvent, imageId: number) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('image-reorder', String(imageId))
    setDragImageId(imageId)
  }

  const handleImageDragOver = (e: React.DragEvent, targetId: number) => {
    if (!e.dataTransfer.types.includes('image-reorder')) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTargetId(targetId)
  }

  const handleImageDrop = (e: React.DragEvent, targetId: number) => {
    e.preventDefault()
    e.stopPropagation()
    const sourceId = Number(e.dataTransfer.getData('image-reorder'))
    setDragImageId(null)
    setDropTargetId(null)
    if (!sourceId || sourceId === targetId) return

    const targetImage = images.find(img => img.id === targetId)
    if (targetImage) {
      reorderMutation.mutate({
        imageId: sourceId,
        newSortOrder: targetImage.sort_order
      })
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('image-reorder')) {
      setDragImageId(null)
      setDropTargetId(null)
      return
    }
    handleFileDrop(e)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      uploadFiles(files)
      e.target.value = ''
    }
  }

  return (
    <div>
      <div className='mb-2 flex items-center gap-2'>
        <h3 className='text-[13px] font-semibold text-text-secondary'>Images ({images.length})</h3>
        <div className='flex-1' />
        <Button
          variant='outline'
          size='xs'
          onClick={() => fileInputRef.current?.click()}
          isPending={uploading}
        >
          <Upload className='size-3' />
          Upload
        </Button>
        <input
          ref={fileInputRef}
          aria-label='Upload images'
          type='file'
          accept='image/jpeg,image/png,image/webp'
          multiple
          className='hidden'
          onChange={handleFileInput}
        />
      </div>

      {isLoading ? (
        <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className='aspect-square rounded-lg' />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div
          className={cn(
            'rounded-lg border-2 border-dashed py-8 text-center transition-colors',
            dragOver ? 'border-primary bg-primary/5' : 'hover:border-border-hover border-border'
          )}
          onDragOver={e => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
        >
          <ImagePlus className='text-text-quaternary mx-auto mb-2 size-8' />
          <p className='text-[13px] text-text-tertiary'>
            Drag & drop images here or{' '}
            <button
              type='button'
              className='text-primary hover:underline'
              onClick={() => fileInputRef.current?.click()}
            >
              browse
            </button>
          </p>
          <p className='text-text-quaternary mt-1 text-[11px]'>JPG, PNG, WebP · Max 10MB</p>
        </div>
      ) : (
        <div
          className={cn(
            'grid grid-cols-2 gap-2 rounded-lg p-1 transition-colors sm:grid-cols-3 md:grid-cols-4',
            dragOver && 'bg-primary/5 ring-2 ring-primary/20'
          )}
          onDragOver={e => {
            e.preventDefault()
            if (!e.dataTransfer.types.includes('image-reorder')) setDragOver(true)
          }}
          onDragLeave={() => {
            setDragOver(false)
            setDropTargetId(null)
          }}
          onDrop={handleDrop}
        >
          {images.map(img => (
            <div
              key={img.id}
              draggable
              onDragStart={e => handleImageDragStart(e, img.id)}
              onDragEnd={() => {
                setDragImageId(null)
                setDropTargetId(null)
              }}
              onDragOver={e => handleImageDragOver(e, img.id)}
              onDrop={e => handleImageDrop(e, img.id)}
              className={cn(
                'group relative aspect-square cursor-grab overflow-hidden rounded-lg border bg-bg-secondary transition-all active:cursor-grabbing',
                dragImageId === img.id
                  ? 'border-border opacity-40'
                  : dropTargetId === img.id
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-border'
              )}
            >
              <img
                src={img.thumbnail_url}
                alt={img.alt || img.original_filename}
                className='pointer-events-none size-full object-cover'
                loading='lazy'
              />

              <div className='absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100'>
                <div className='rounded bg-black/50 p-0.5'>
                  <GripVertical className='size-3 text-white' />
                </div>
              </div>

              {img.is_primary && (
                <div className='absolute top-1 left-1 rounded-full bg-amber-400 p-0.5'>
                  <Star className='size-3 fill-white text-white' />
                </div>
              )}

              {img.alt && (
                <div className='absolute right-0 bottom-0 left-0 truncate bg-black/60 px-1.5 py-0.5 text-[10px] text-white'>
                  {img.alt}
                </div>
              )}

              <div className='absolute inset-0 flex items-center justify-center gap-1 bg-black/0 opacity-0 transition-colors group-hover:bg-black/30 group-hover:opacity-100'>
                {!img.is_primary && (
                  <Button
                    variant='secondary'
                    size='icon-xs'
                    className='size-7'
                    onClick={() => setPrimaryMutation.mutate(img.id)}
                    title='Set as primary'
                  >
                    <Star className='size-3.5' />
                  </Button>
                )}
                <Button
                  variant='secondary'
                  size='icon-xs'
                  className='size-7'
                  onClick={() => {
                    setEditImage(img)
                    setEditAlt(img.alt)
                  }}
                  title='Edit alt text'
                >
                  <Pencil className='size-3.5' />
                </Button>
                <Button
                  variant='secondary'
                  size='icon-xs'
                  className='hover:text-destructive-foreground size-7 hover:bg-destructive'
                  onClick={() => deleteMutation.mutate(img.id)}
                  title='Delete'
                >
                  <Trash2 className='size-3.5' />
                </Button>
              </div>
            </div>
          ))}

          <button
            type='button'
            className='text-text-quaternary flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-dashed border-border transition-colors hover:border-primary/50 hover:text-primary/50'
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className='mb-1 size-6' />
            <span className='text-[11px]'>Add</span>
          </button>
        </div>
      )}

      <Dialog open={!!editImage} onOpenChange={v => !v && setEditImage(null)}>
        <DialogContent className='sm:max-w-sm'>
          <form
            onSubmit={e => {
              e.preventDefault()
              updateAltMutation.mutate()
            }}
          >
            <DialogHeader>
              <DialogTitle>Edit Image</DialogTitle>
            </DialogHeader>
            <DialogBody className='flex flex-col gap-3'>
              {editImage && (
                <img
                  src={editImage.thumbnail_url}
                  alt={editImage.alt}
                  className='max-h-48 w-full rounded-md bg-bg-secondary object-contain'
                />
              )}
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='img-alt'>Alt Text</Label>
                <Input
                  id='img-alt'
                  value={editAlt}
                  onChange={e => setEditAlt(e.target.value)}
                  placeholder='Describe the image...'
                  autoFocus
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => setEditImage(null)}>
                Cancel
              </Button>
              <Button type='submit' isPending={updateAltMutation.isPending}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
