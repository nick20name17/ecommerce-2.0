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
    enabled: initialTitle === undefined,
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
      <button
        type='button'
        className={cn(
          'group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors',
          hasMeta ? 'bg-bg-secondary/50 hover:bg-bg-secondary' : 'hover:bg-bg-hover'
        )}
        onClick={() => setEditOpen(true)}
      >
        <Globe className={cn('size-3.5 shrink-0', hasMeta ? 'text-emerald-500' : 'text-text-quaternary')} />
        {hasMeta ? (
          <div className='min-w-0 flex-1'>
            {metaTitle && (
              <span className='block truncate text-[12px] font-medium text-text-secondary'>{metaTitle}</span>
            )}
            {metaDescription && (
              <span className='block truncate text-[11px] text-text-tertiary'>{metaDescription}</span>
            )}
          </div>
        ) : (
          <span className='flex-1 text-[12px] text-text-quaternary'>Add SEO meta tags</span>
        )}
        <Pencil className='size-3 shrink-0 text-text-quaternary opacity-0 transition-opacity group-hover:opacity-100' />
      </button>

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
              <p className='text-[12px] text-text-tertiary'>
                Help search engines understand this page
              </p>
            </DialogHeader>
            <DialogBody className='flex flex-col gap-3'>
              {/* Google preview */}
              <div className='rounded-lg border border-border bg-bg-secondary/40 p-3'>
                <div className='truncate text-[14px] font-medium text-blue-700'>
                  {title || 'Page Title'}
                </div>
                <div className='truncate text-[12px] text-emerald-700'>
                  example.com/{entityType}/{entityId}
                </div>
                <div className='mt-0.5 line-clamp-2 text-[12px] text-text-tertiary'>
                  {description || 'Add a description to help people find this page in search results.'}
                </div>
              </div>

              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='meta-title' className='text-[12px]'>Title</Label>
                <Input
                  id='meta-title'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder='Page title for search engines'
                  maxLength={200}
                  autoFocus
                />
                <div className='flex justify-between'>
                  <span className='text-[10px] text-text-quaternary'>Recommended: 50–60 characters</span>
                  <span className={cn('text-[10px] tabular-nums', title.length > 60 ? 'text-amber-500' : 'text-text-quaternary')}>{title.length}/200</span>
                </div>
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='meta-desc' className='text-[12px]'>Description</Label>
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
                <div className='flex justify-between'>
                  <span className='text-[10px] text-text-quaternary'>Recommended: 120–160 characters</span>
                  <span className={cn('text-[10px] tabular-nums', description.length > 160 ? 'text-amber-500' : 'text-text-quaternary')}>{description.length}/1000</span>
                </div>
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
