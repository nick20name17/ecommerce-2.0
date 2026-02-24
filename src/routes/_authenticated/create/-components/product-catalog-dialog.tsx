import { Package, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { CatalogCategorySidebar } from './catalog-category-sidebar'
import { CatalogProductGrid } from './catalog-product-grid'
import type { Product } from '@/api/product/schema'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface ProductCatalogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerId: string | null
  projectId?: number | null
  onSelect: (product: Product) => void
  disabled?: boolean
}

export function ProductCatalogDialog({
  open,
  onOpenChange,
  customerId,
  projectId,
  onSelect,
  disabled,
}: ProductCatalogDialogProps) {
  const [category, setCategory] = useState<{ treeId: string | null; treeDescr: string }>({
    treeId: null,
    treeDescr: 'All categories',
  })

  useEffect(() => {
    if (!open) {
      setCategory({ treeId: null, treeDescr: 'All categories' })
    }
  }, [open])

  const isDisabled = disabled === true

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onOpenChange(false) : onOpenChange(true))}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'flex h-[92vh] w-[95vw] max-w-[1600px]! flex-col gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl'
        )}
      >
        <div className='relative shrink-0 border-b bg-muted/30'>
          <div className='flex items-center justify-between gap-4 px-6 py-4'>
            <div className='flex min-w-0 items-center gap-3'>
              <div className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm'>
                <Package className='size-5' />
              </div>
              <div className='min-w-0'>
                <h2 className='truncate font-semibold'>Product catalog</h2>
                <p className='truncate text-xs text-muted-foreground' title={category.treeDescr}>
                  Filtered by: {category.treeDescr}
                </p>
              </div>
            </div>

            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='size-8 shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground'
              onClick={() => onOpenChange(false)}
            >
              <X className='size-4' />
            </Button>
          </div>
        </div>

        <div className='grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[360px_1fr]'>
          <div className='min-h-0 border-b lg:border-b-0 lg:border-r'>
            <CatalogCategorySidebar
              projectId={projectId}
              value={category.treeId}
              onChange={(next) => setCategory(next)}
            />
          </div>

          <div className='min-h-0'>
            {customerId && !isDisabled ? (
              <CatalogProductGrid
                customerId={customerId}
                projectId={projectId}
                categoryId={category.treeId}
                onSelect={onSelect}
                onClose={() => onOpenChange(false)}
              />
            ) : customerId ? (
              <div className='flex h-full items-center justify-center p-6 text-center'>
                <div className='max-w-sm'>
                  <p className='text-sm font-semibold'>Please wait</p>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    The cart is updating. You can browse again in a moment.
                  </p>
                </div>
              </div>
            ) : (
              <div className='flex h-full items-center justify-center p-6 text-center'>
                <div className='max-w-sm'>
                  <p className='text-sm font-semibold'>Select a customer first</p>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    Prices and availability depend on the customer. Pick a customer on the Create page to browse products.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className='shrink-0 border-t bg-muted/30 px-6 py-3'>
          <div className='flex items-center justify-between gap-3'>
            <p className='text-xs text-muted-foreground'>
              Tip: configurable products will open a configuration dialog before adding to cart.
            </p>
            <Button type='button' variant='outline' size='sm' onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

