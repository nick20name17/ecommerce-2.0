import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Globe, Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'

import { metaService } from '@/api/meta/service'
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
import { cn } from '@/lib/utils'

interface MetaEditorProps {
  entityType: 'category' | 'vp' | 'product'
  entityId: string
  projectId: number | null
  /** If provided, shows inline instead of requiring fetch */
  initialTitle?: string
  initialDescription?: string
}

export const MetaEditor = ({
  entityType,
  entityId,
  projectId,
  initialTitle,
  initialDescription,
}: MetaEditorProps) => {
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const queryKey = ['meta', entityType, entityId, projectId]

  const { data } = useQuery({
    queryKey,
    queryFn: () =>
      metaService.get({
        entity_type: entityType,
        entity_id: entityId,
        project_id: projectId ?? undefined,
      }),
    enabled: initialTitle === undefined, // skip fetch if initial values provided
    staleTime: 5 * 60 * 1000,
  })

  const metaTitle = initialTitle ?? data?.meta_title ?? ''
  const metaDescription = initialDescription ?? data?.meta_description ?? ''
  const hasMeta = metaTitle || metaDescription

  useEffect(() => {
    if (editOpen) {
      setTitle(metaTitle)
      setDescription(metaDescription)
    }
  }, [editOpen, metaTitle, metaDescription])

  const saveMutation = useMutation({
    mutationFn: () =>
      metaService.upsert(
        {
          entity_type: entityType,
          entity_id: entityId,
          meta_title: title,
          meta_description: description,
        },
        { project_id: projectId ?? undefined }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      // Also invalidate parent detail queries
      if (entityType === 'category') {
        queryClient.invalidateQueries({ queryKey: ['catalog', 'detail', entityId] })
      } else if (entityType === 'vp') {
        queryClient.invalidateQueries({ queryKey: ['variable-products', 'detail', entityId] })
      }
      setEditOpen(false)
    },
  })

  return (
    <>
      <div className='flex items-start gap-2'>
        <Globe className='size-3.5 text-text-quaternary mt-0.5 shrink-0' />
        <div className='flex-1 min-w-0'>
          {hasMeta ? (
            <div className='text-[12px]'>
              {metaTitle && (
                <div className='font-medium text-text-secondary truncate'>{metaTitle}</div>
              )}
              {metaDescription && (
                <div className='text-text-tertiary truncate'>{metaDescription}</div>
              )}
            </div>
          ) : (
            <span className='text-[12px] text-text-quaternary'>No meta tags set</span>
          )}
        </div>
        <Button
          variant='ghost'
          size='icon-xs'
          className='shrink-0 text-text-tertiary'
          onClick={() => setEditOpen(true)}
        >
          <Pencil className='size-3' />
        </Button>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className='sm:max-w-md'>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              saveMutation.mutate()
            }}
          >
            <DialogHeader>
              <DialogTitle>SEO Meta Tags</DialogTitle>
            </DialogHeader>
            <DialogBody className='flex flex-col gap-3'>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='meta-title'>Meta Title</Label>
                <Input
                  id='meta-title'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder='Page title for search engines'
                  maxLength={200}
                  autoFocus
                />
                <span className='text-[10px] text-text-quaternary'>{title.length}/200</span>
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='meta-desc'>Meta Description</Label>
                <textarea
                  id='meta-desc'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder='Description shown in search results'
                  maxLength={1000}
                  rows={3}
                  className={cn(
                    'flex w-full rounded-md border border-input bg-background px-3 py-2 text-[13px]',
                    'ring-offset-background placeholder:text-muted-foreground',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    'disabled:cursor-not-allowed disabled:opacity-50'
                  )}
                />
                <span className='text-[10px] text-text-quaternary'>{description.length}/1000</span>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type='submit' isPending={saveMutation.isPending}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
