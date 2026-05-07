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
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface MetaTagsEditorProps {
  entityType: 'category' | 'vp' | 'product'
  entityId: string
  projectId: number | null
}

export const MetaTagsEditor = ({
  entityType,
  entityId,
  projectId,
}: MetaTagsEditorProps) => {
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')

  const { data } = useQuery(
    getMetaQuery(entityType, entityId, projectId ?? undefined)
  )

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
          meta_description: metaDescription,
        },
        { project_id: projectId ?? undefined }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: META_QUERY_KEYS.entity(
          entityType,
          entityId,
          projectId ?? undefined
        ),
      })
      setEditOpen(false)
    },
    meta: { successMessage: 'Meta tags saved' },
  })

  const hasMeta = !!(data?.meta_title || data?.meta_description)

  return (
    <>
      <div className='flex items-start gap-2'>
        <div className='flex-1 min-w-0'>
          <button
            type='button'
            className='flex items-center gap-1.5 text-[12px] text-text-tertiary hover:text-text-secondary transition-colors'
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
            <p className='text-[11px] text-text-quaternary truncate pl-[18px]'>
              {data!.meta_description}
            </p>
          )}
        </div>
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
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder='Page title for search engines...'
                  maxLength={200}
                  autoFocus
                />
                <span className='text-[11px] text-text-quaternary text-right'>
                  {metaTitle.length}/200
                </span>
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='meta-desc'>Meta Description</Label>
                <textarea
                  id='meta-desc'
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder='Brief description for search results...'
                  maxLength={1000}
                  rows={3}
                  className='flex w-full rounded-md border border-input bg-bg-primary px-3 py-2 text-sm placeholder:text-text-quaternary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 resize-none'
                />
                <span className='text-[11px] text-text-quaternary text-right'>
                  {metaDescription.length}/1000
                </span>
              </div>

              {/* Preview */}
              <div className='rounded-md border border-border p-3 bg-bg-secondary'>
                <p className='text-[11px] text-text-quaternary mb-1'>Search preview</p>
                <p className='text-[14px] text-blue-600 dark:text-blue-400 truncate'>
                  {metaTitle || 'Page title'}
                </p>
                <p className='text-[12px] text-text-tertiary line-clamp-2'>
                  {metaDescription || 'Page description will appear here...'}
                </p>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setEditOpen(false)}
              >
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
