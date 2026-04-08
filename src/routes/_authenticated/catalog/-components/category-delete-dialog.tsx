import { useMutation } from '@tanstack/react-query'

import type { CatalogCategory } from '@/api/catalog/schema'
import { catalogService } from '@/api/catalog/service'
import { CATALOG_QUERY_KEYS } from '@/api/catalog/query'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface CategoryDeleteDialogProps {
  category: CatalogCategory | null
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: number | null
  onDeleted?: () => void
}

export const CategoryDeleteDialog = ({
  category,
  open,
  onOpenChange,
  projectId,
  onDeleted,
}: CategoryDeleteDialogProps) => {
  const deleteMutation = useMutation({
    mutationFn: () =>
      catalogService.delete(category!.id, { project_id: projectId ?? undefined }),
    meta: {
      successMessage: 'Category deleted',
      invalidatesQuery: CATALOG_QUERY_KEYS.all(),
    },
    onSuccess: () => {
      onOpenChange(false)
      onDeleted?.()
    },
  })

  const hasChildren = category?.children && category.children.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle>Delete Category</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{category?.name}</strong>?
            {hasChildren && (
              <span className='text-destructive block mt-1'>
                This will also delete all subcategories and their items.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant='destructive'
            onClick={() => deleteMutation.mutate()}
            isPending={deleteMutation.isPending}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
