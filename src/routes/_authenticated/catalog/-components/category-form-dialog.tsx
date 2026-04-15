import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import type { CatalogCategory, CreateCatalogCategoryPayload } from '@/api/catalog/schema'
import { catalogService } from '@/api/catalog/service'
import { CATALOG_QUERY_KEYS } from '@/api/catalog/query'
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

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: CatalogCategory | null
  parentId?: string | null
  projectId: number | null
}

export const CategoryFormDialog = ({
  open,
  onOpenChange,
  category,
  parentId,
  projectId,
}: CategoryFormDialogProps) => {
  const isEditing = !!category
  const [name, setName] = useState(category?.name ?? '')
  const [slug, setSlug] = useState(category?.slug ?? '')
  const [imageUrl, setImageUrl] = useState(category?.image_url ?? '')
  const [sortOrder, setSortOrder] = useState(category?.sort_order ?? 0)

  const resetForm = () => {
    setName(category?.name ?? '')
    setSlug(category?.slug ?? '')
    setImageUrl(category?.image_url ?? '')
    setSortOrder(category?.sort_order ?? 0)
  }

  const createMutation = useMutation({
    mutationFn: (payload: CreateCatalogCategoryPayload) =>
      catalogService.create(payload, { project_id: projectId ?? undefined }),
    meta: {
      successMessage: 'Category created',
      invalidatesQuery: CATALOG_QUERY_KEYS.all(),
    },
    onSuccess: () => onOpenChange(false),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<CreateCatalogCategoryPayload>) =>
      catalogService.update(category!.id, payload, { project_id: projectId ?? undefined }),
    meta: {
      successMessage: 'Category updated',
      invalidatesQuery: CATALOG_QUERY_KEYS.all(),
    },
    onSuccess: () => onOpenChange(false),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: CreateCatalogCategoryPayload = {
      name,
      slug: slug || undefined,
      sort_order: sortOrder,
      parent_id: isEditing ? category.parent_id : (parentId ?? null),
    }

    if (isEditing) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm()
        onOpenChange(v)
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Category' : 'New Category'}</DialogTitle>
          </DialogHeader>
          <DialogBody className='flex flex-col gap-3'>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='cat-name'>Name</Label>
              <Input
                id='cat-name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Category name'
                required
                autoFocus
              />
            </div>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='cat-slug'>Slug</Label>
              <Input
                id='cat-slug'
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder='category-slug (auto-generated if empty)'
              />
            </div>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='cat-sort'>Sort Order</Label>
              <Input
                id='cat-sort'
                type='number'
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type='submit' isPending={isPending}>
              {isEditing ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
