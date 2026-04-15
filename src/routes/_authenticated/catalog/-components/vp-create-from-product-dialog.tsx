import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import type { CatalogCategoryProduct } from '@/api/catalog/schema'
import { VP_QUERY_KEYS } from '@/api/variable-product/query'
import { variableProductService } from '@/api/variable-product/service'
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

interface VPCreateFromProductDialogProps {
  product: CatalogCategoryProduct | null
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: number | null
}

export const VPCreateFromProductDialog = ({
  product,
  open,
  onOpenChange,
  projectId,
}: VPCreateFromProductDialogProps) => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (open && product) {
      setName(product.descr_1 || product.product_id || '')
      setDescription('')
    }
  }, [open, product])

  const createMutation = useMutation({
    mutationFn: async () => {
      // 1. Create VP
      const vp = await variableProductService.create(
        { name, description: description || undefined },
        { project_id: projectId ?? undefined }
      )
      // 2. Add the product as first item
      if (product) {
        await variableProductService.addItem(
          vp.id,
          { product_autoid: product.product_autoid, is_default: true },
          { project_id: projectId ?? undefined }
        )
      }
      return vp
    },
    meta: {
      successMessage: 'Variable product created',
      invalidatesQuery: VP_QUERY_KEYS.lists(),
    },
    onSuccess: (vp) => {
      onOpenChange(false)
      navigate({ to: `/catalog/vp/${vp.id}` })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate()
          }}
        >
          <DialogHeader>
            <DialogTitle>Create VP from Product</DialogTitle>
          </DialogHeader>
          <DialogBody className='flex flex-col gap-3'>
            {product && (
              <div className='rounded-md bg-bg-secondary px-3 py-2 text-[12px] text-text-tertiary'>
                Product: <span className='font-mono'>{product.product_id || product.product_autoid}</span>
                {product.descr_1 && <> — {product.descr_1}</>}
              </div>
            )}
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='vp-from-name'>VP Name</Label>
              <Input
                id='vp-from-name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Variable product name'
                required
                autoFocus
              />
              <p className='text-[11px] text-text-quaternary'>
                Edit to remove color/size from the name if needed
              </p>
            </div>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='vp-from-desc'>Description</Label>
              <Input
                id='vp-from-desc'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='Optional description'
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type='submit' isPending={createMutation.isPending}>
              Create VP
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
