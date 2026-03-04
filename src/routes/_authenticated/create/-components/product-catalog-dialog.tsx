import { Package, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { CatalogCategorySidebar } from './catalog-category-sidebar'
import { CatalogMiniCart } from './catalog-mini-cart'
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
  onRemoveItem?: (itemId: number) => void
  disabled?: boolean
  addingProductAutoid?: string | null
  removingItemId?: number | null
}

export const ProductCatalogDialog = ({
  open,
  onOpenChange,
  customerId,
  projectId,
  onSelect,
  onRemoveItem,
  disabled,
  addingProductAutoid,
  removingItemId
}: ProductCatalogDialogProps) => {
  const [category, setCategory] = useState<{ treeId: string | null; treeDescr: string }>({
    treeId: null,
    treeDescr: 'All categories'
  })

  useEffect(() => {
    if (!open) {
      setCategory({ treeId: null, treeDescr: 'All categories' })
    }
  }, [open])

  const isDisabled = disabled === true

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => (!v ? onOpenChange(false) : onOpenChange(true))}
    >
      <DialogContent
        showCloseButton={false}
        className={cn(
          'flex h-[92vh] w-[95vw] max-w-[1600px]! flex-col gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl'
        )}
      >
        <div className='bg-muted/30 relative shrink-0 border-b'>
          <div className='flex items-center justify-between gap-4 px-6 py-4'>
            <div className='flex min-w-0 items-center gap-3'>
              <div className='bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-xl shadow-sm'>
                <Package className='size-5' />
              </div>
              <div className='min-w-0'>
                <h2 className='truncate font-semibold'>Product catalog</h2>
                <p
                  className='text-muted-foreground truncate text-xs'
                  title={category.treeDescr}
                >
                  Filtered by: {category.treeDescr}
                </p>
              </div>
            </div>

            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='text-muted-foreground hover:bg-muted hover:text-foreground size-8 shrink-0 rounded-full'
              onClick={() => onOpenChange(false)}
            >
              <X className='size-4' />
            </Button>
          </div>
        </div>

        <div
          className={cn(
            'grid min-h-0 flex-1 grid-cols-1',
            customerId ? 'lg:grid-cols-[360px_1fr_280px]' : 'lg:grid-cols-[360px_1fr]'
          )}
        >
          <div className='min-h-0 border-b lg:border-r lg:border-b-0'>
            <CatalogCategorySidebar
              projectId={projectId}
              value={category.treeId}
              onChange={(next) => setCategory(next)}
            />
          </div>

          <div className='min-h-0'>
            {customerId ? (
              <CatalogProductGrid
                customerId={customerId}
                projectId={projectId}
                categoryId={category.treeId}
                onSelect={onSelect}
                addingProductAutoid={addingProductAutoid ?? null}
                cartUpdating={isDisabled}
              />
            ) : (
              <div className='flex h-full items-center justify-center p-6 text-center'>
                <div className='max-w-sm'>
                  <p className='text-sm font-semibold'>Select a customer first</p>
                  <p className='text-muted-foreground mt-1 text-xs'>
                    Prices and availability depend on the customer. Pick a customer on the Create
                    page to browse products.
                  </p>
                </div>
              </div>
            )}
          </div>

          {customerId && (
            <div className='hidden min-h-0 lg:block'>
              <CatalogMiniCart
                customerId={customerId}
                projectId={projectId}
                onRemove={onRemoveItem}
                removingItemId={removingItemId ?? null}
                className='h-full'
              />
            </div>
          )}
        </div>

        <div className='bg-muted/30 shrink-0 border-t px-6 py-3'>
          <div className='flex items-center justify-between gap-3'>
            <p className='text-muted-foreground text-xs'>
              Tip: configurable products will open a configuration dialog before adding to cart.
            </p>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
