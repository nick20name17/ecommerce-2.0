import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Globe, Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'

import { META_QUERY_KEYS, getMetaQuery } from '@/api/meta/query'
import { metaService } from '@/api/meta/service'
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

interface MetaTagsEditorProps {
  entityType: 'category' | 'vp' | 'product'
  entityId: string
  projectId: number | null
}

export const MetaTagsEditor = ({ entityType, entityId, projectId }: MetaTagsEditorProps) => {
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')

  const { data } = useQuery(getMetaQuery(entityType, entityId, projectId ?? undefined))

  useEffect(() => {
    if (data) {
      setMetaTitle(data.meta_title)
      setMetaDescription(data.meta_description)
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: () =>
      metaService.upsert(
        {
          entity_type: entityType,
          entity_id: entityId,
          meta_title: metaTitle,
          meta_description: metaDescription
        },
        { project_id: projectId ?? undefined }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: META_QUERY_KEYS.entity(entityType, entityId, projectId ?? undefined)
      })
      setEditOpen(false)
    },
    meta: { successMessage: 'Meta tags saved' }
  })

  const hasMeta = !!(data?.meta_title || data?.meta_description)

  return (
    <>
      <div className='flex items-start gap-2'>
        <div className='min-w-0 flex-1'>
          <button
            type='button'
            className='flex items-center gap-1.5 text-[12px] text-text-tertiary transition-colors hover:text-text-secondary'
            onClick={() => setEditOpen(true)}
          >
            <Globe className='size-3 shrink-0' />
            {hasMeta ? (
              <span className='truncate'>{data!.meta_title || 'No title'}</span>
            ) : (
              <span className='italic'>Add SEO meta tags...</span>
            )}
            <Pencil className='size-2.5 shrink-0 opacity-0 group-hover:opacity-100' />
          </button>
          {hasMeta && data!.meta_description && (
            <p className='text-text-quaternary truncate pl-[18px] text-[11px]'>
              {data!.meta_description}
            </p>
          )}
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className='sm:max-w-md'>
          <form
            onSubmit={e => {
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
                  value={metaTitle}
                  onChange={e => setMetaTitle(e.target.value)}
                  placeholder='Page title for search engines...'
                  maxLength={200}
                  autoFocus
                />
                <span className='text-text-quaternary text-right text-[11px]'>
                  {metaTitle.length}/200
                </span>
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='meta-desc'>Meta Description</Label>
                <textarea
                  id='meta-desc'
                  value={metaDescription}
                  onChange={e => setMetaDescription(e.target.value)}
                  placeholder='Brief description for search results...'
                  maxLength={1000}
                  rows={3}
                  className='bg-bg-primary placeholder:text-text-quaternary flex w-full resize-none rounded-md border border-input px-3 py-2 text-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50'
                />
                <span className='text-text-quaternary text-right text-[11px]'>
                  {metaDescription.length}/1000
                </span>
              </div>

              {/* Preview */}
              <div className='rounded-md border border-border bg-bg-secondary p-3'>
                <p className='text-text-quaternary mb-1 text-[11px]'>Search preview</p>
                <p className='truncate text-[14px] text-blue-600 dark:text-blue-400'>
                  {metaTitle || 'Page title'}
                </p>
                <p className='line-clamp-2 text-[12px] text-text-tertiary'>
                  {metaDescription || 'Page description will appear here...'}
                </p>
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
