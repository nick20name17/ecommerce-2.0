import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import type { CreateVariableProductPayload } from '@/api/variable-product/schema'
import { variableProductService } from '@/api/variable-product/service'
import { VP_QUERY_KEYS } from '@/api/variable-product/query'
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

interface VPCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: number | null
  categoryId?: string | null
  categoryName?: string | null
}

export const VPCreateDialog = ({ open, onOpenChange, projectId, categoryId, categoryName }: VPCreateDialogProps) => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [slug, setSlug] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  const createMutation = useMutation({
    mutationFn: (payload: CreateVariableProductPayload) =>
      variableProductService.create(payload, { project_id: projectId ?? undefined }),
    meta: {
      successMessage: 'Variable product created',
      invalidatesQuery: VP_QUERY_KEYS.lists(),
    },
    onSuccess: (data) => {
      onOpenChange(false)
      setName('')
      setDescription('')
      setSlug('')
      setImageUrl('')
      navigate({
        to: `/catalog/vp/${data.id}`,
      })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate({
              name,
              description: description || undefined,
              slug: slug || undefined,
              image_url: imageUrl || undefined,
              category_id: categoryId || undefined,
            })
          }}
        >
          <DialogHeader>
            <DialogTitle>New Variable Product</DialogTitle>
          </DialogHeader>
          <DialogBody className='flex flex-col gap-3'>
            {categoryName && (
              <div className='rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground'>
                Category: <span className='font-medium text-foreground'>{categoryName}</span>
              </div>
            )}
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='vp-name'>Name</Label>
              <Input
                id='vp-name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Product name'
                required
                autoFocus
              />
            </div>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='vp-desc'>Description</Label>
              <Input
                id='vp-desc'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='Available in multiple colors'
              />
            </div>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='vp-slug'>Slug</Label>
              <Input
                id='vp-slug'
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder='product-slug (auto-generated if empty)'
              />
            </div>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='vp-image'>Image URL</Label>
              <Input
                id='vp-image'
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder='https://...'
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type='submit' isPending={createMutation.isPending}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}