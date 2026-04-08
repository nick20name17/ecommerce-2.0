import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import { CATALOG_QUERY_KEYS } from '@/api/catalog/query'
import { catalogService } from '@/api/catalog/service'
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

interface AddItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoryId: string
  itemType: 'product' | 'variable_product'
  projectId: number | null
}

export const AddItemDialog = ({
  open,
  onOpenChange,
  categoryId,
  itemType,
  projectId,
}: AddItemDialogProps) => {
  const [itemId, setItemId] = useState('')
  const [sortOrder, setSortOrder] = useState(0)

  const addMutation = useMutation({
    mutationFn: () =>
      catalogService.addItem(
        categoryId,
        { item_type: itemType, item_id: itemId, sort_order: sortOrder },
        { project_id: projectId ?? undefined }
      ),
    meta: {
      successMessage: 'Item added to category',
      invalidatesQuery: CATALOG_QUERY_KEYS.detail(categoryId),
    },
    onSuccess: () => {
      setItemId('')
      setSortOrder(0)
      onOpenChange(false)
    },
  })

  const label = itemType === 'product' ? 'Product' : 'Variable Product'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-sm'>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            addMutation.mutate()
          }}
        >
          <DialogHeader>
            <DialogTitle>Add {label}</DialogTitle>
          </DialogHeader>
          <DialogBody className='flex flex-col gap-3'>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='item-id'>{label} ID</Label>
              <Input
                id='item-id'
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                placeholder={
                  itemType === 'product' ? 'INVENTRY_AUTOID' : 'Variable Product ID'
                }
                required
                autoFocus
              />
            </div>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='item-sort'>Sort Order</Label>
              <Input
                id='item-sort'
                type='number'
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type='submit' isPending={addMutation.isPending}>
              Add {label}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
