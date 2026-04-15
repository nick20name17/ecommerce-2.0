import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Pencil, Star, Trash2, Upload } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

import {
  CATALOG_IMAGE_QUERY_KEYS,
  getCatalogImagesQuery,
} from '@/api/catalog-image/query'
import type { CatalogImageItem } from '@/api/catalog-image/schema'
import { catalogImageService } from '@/api/catalog-image/service'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

export const ImageGallery = ({
  entityType,
  entityId,
  projectId,
}: ImageGalleryProps) => {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [editImage, setEditImage] = useState<CatalogImageItem | null>(null)
  const [editAlt, setEditAlt] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const queryKey = CATALOG_IMAGE_QUERY_KEYS.list(
    entityType,
    entityId,
    projectId ?? undefined
  )

  const { data, isLoading } = useQuery(
    getCatalogImagesQuery(entityType, entityId, projectId ?? undefined)
  )

  const images = data?.results ?? []

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey })

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      setUploading(true)
      try {
        for (const file of Array.from(files)) {
          // 1. Get presigned URL
          const presigned = await catalogImageService.getPresignedUrl(
            {
              entity_type: entityType,
              entity_id: entityId,
              filename: file.name,
              content_type: file.type,
            },
            { project_id: projectId ?? undefined }
          )

          // 2. Upload directly to S3
          await fetch(presigned.upload_url, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type },
          })

          // 3. Confirm upload
          await catalogImageService.confirmUpload(
            {
              entity_type: entityType,
              entity_id: entityId,
              s3_key: presigned.s3_key,
              original_filename: file.name,
              content_type: file.type,
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
    },
    [entityType, entityId, projectId]
  )

  const deleteMutation = useMutation({
    mutationFn: (imageId: number) =>
      catalogImageService.delete(imageId, {
        project_id: projectId ?? undefined,
      }),
    onSuccess: invalidate,
  })

  const setPrimaryMutation = useMutation({
    mutationFn: (imageId: number) =>
      catalogImageService.update(
        imageId,
        { is_primary: true },
        { project_id: projectId ?? undefined }
      ),
    onSuccess: invalidate,
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
    },
  })

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const files = e.dataTransfer.files
      if (files.length > 0) uploadFiles(files)
    },
    [uploadFiles]
  )

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      uploadFiles(files)
      e.target.value = ''
    }
  }

  return (
    <div>
      <div className='flex items-center gap-2 mb-2'>
        <h3 className='text-[13px] font-semibold text-text-secondary'>
          Images ({images.length})
        </h3>
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
          type='file'
          accept='image/jpeg,image/png,image/webp'
          multiple
          className='hidden'
          onChange={handleFileInput}
        />
      </div>

      {isLoading ? (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className='aspect-square rounded-lg' />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div
          className={cn(
            'rounded-lg border-2 border-dashed py-8 text-center transition-colors',
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-border-hover'
          )}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <ImagePlus className='mx-auto size-8 text-text-quaternary mb-2' />
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
          <p className='text-[11px] text-text-quaternary mt-1'>
            JPG, PNG, WebP · Max 10MB
          </p>
        </div>
      ) : (
        <div
          className={cn(
            'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 rounded-lg p-1 transition-colors',
            dragOver && 'bg-primary/5 ring-2 ring-primary/20'
          )}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {images.map((img) => (
            <div
              key={img.id}
              className='group relative aspect-square rounded-lg overflow-hidden border border-border bg-bg-secondary'
            >
              <img
                src={img.thumbnail_url}
                alt={img.alt || img.original_filename}
                className='size-full object-cover'
                loading='lazy'
              />

              {/* Primary badge */}
              {img.is_primary && (
                <div className='absolute top-1 left-1 rounded-full bg-amber-400 p-0.5'>
                  <Star className='size-3 fill-white text-white' />
                </div>
              )}

              {/* Alt text indicator */}
              {img.alt && (
                <div className='absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-0.5 text-[10px] text-white truncate'>
                  {img.alt}
                </div>
              )}

              {/* Actions overlay */}
              <div className='absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100'>
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
                  className='size-7 hover:bg-destructive hover:text-destructive-foreground'
                  onClick={() => deleteMutation.mutate(img.id)}
                  title='Delete'
                >
                  <Trash2 className='size-3.5' />
                </Button>
              </div>
            </div>
          ))}

          {/* Upload placeholder tile */}
          <button
            type='button'
            className='aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center text-text-quaternary hover:text-primary/50 transition-colors'
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className='size-6 mb-1' />
            <span className='text-[11px]'>Add</span>
          </button>
        </div>
      )}

      {/* Edit alt dialog */}
      <Dialog
        open={!!editImage}
        onOpenChange={(v) => !v && setEditImage(null)}
      >
        <DialogContent className='sm:max-w-sm'>
          <form
            onSubmit={(e) => {
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
                  className='w-full max-h-48 object-contain rounded-md bg-bg-secondary'
                />
              )}
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='img-alt'>Alt Text</Label>
                <Input
                  id='img-alt'
                  value={editAlt}
                  onChange={(e) => setEditAlt(e.target.value)}
                  placeholder='Describe the image...'
                  autoFocus
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setEditImage(null)}
              >
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
