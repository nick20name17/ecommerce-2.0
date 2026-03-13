import { Package as PackageFill } from '@phosphor-icons/react'
import { ChevronRight, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { CatalogCategorySidebar } from './catalog-category-sidebar'
import { CatalogMiniCart } from './catalog-mini-cart'
import { CatalogProductGrid } from './catalog-product-grid'
import type { Crumb } from './catalog-category-sidebar'
import type { Product } from '@/api/product/schema'
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
  const [path, setPath] = useState<Crumb[]>([])

  useEffect(() => {
    if (!open) {
      setCategory({ treeId: null, treeDescr: 'All categories' })
      setPath([])
    }
  }, [open])

  const handleGoRoot = () => {
    setPath([])
    setCategory({ treeId: null, treeDescr: 'All categories' })
  }

  const handleGoToCrumb = (index: number) => {
    const nextPath = path.slice(0, index + 1)
    setPath(nextPath)
    const last = nextPath[nextPath.length - 1]
    if (!last) return handleGoRoot()
    setCategory({ treeId: last.tree_id, treeDescr: last.tree_descr })
  }

  const isDisabled = disabled === true

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => (!v ? onOpenChange(false) : onOpenChange(true))}
    >
      <DialogContent
        showCloseButton={false}
        className={cn(
          'flex h-[95vh] w-[98vw] max-w-none! flex-col gap-0 overflow-hidden rounded-[12px] border p-0 shadow-2xl'
        )}
      >
        {/* Header */}
        <div className='shrink-0 border-b border-border'>
          <div className='flex h-12 items-center gap-2.5 px-5'>
            <div className='flex size-6 items-center justify-center rounded-[6px] bg-primary text-white'>
              <PackageFill className='size-3.5' weight='fill' />
            </div>
            <h2 className='text-[14px] font-semibold tracking-[-0.01em]'>Product Catalog</h2>

            <div className='flex-1' />

            <button
              type='button'
              className='inline-flex size-7 items-center justify-center rounded-[5px] text-text-tertiary transition-colors duration-[80ms] hover:bg-bg-hover hover:text-foreground'
              onClick={() => onOpenChange(false)}
            >
              <X className='size-4' />
            </button>
          </div>

          {/* Breadcrumbs */}
          <div className='flex items-center gap-0.5 px-5 pb-2.5'>
            <button
              type='button'
              className={cn(
                'shrink-0 rounded-[5px] px-1.5 py-0.5 text-[12px] font-medium transition-colors duration-[80ms]',
                path.length === 0
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-tertiary hover:bg-bg-hover hover:text-foreground'
              )}
              onClick={handleGoRoot}
            >
              All Categories
            </button>

            {path.map((crumb, index) => (
              <div key={crumb.tree_id} className='flex shrink-0 items-center gap-0.5'>
                <ChevronRight className='size-3 shrink-0 text-text-quaternary' />
                <button
                  type='button'
                  className={cn(
                    'shrink-0 rounded-[5px] px-1.5 py-0.5 text-[12px] font-medium transition-colors duration-[80ms]',
                    index === path.length - 1
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-tertiary hover:bg-bg-hover hover:text-foreground'
                  )}
                  onClick={() => handleGoToCrumb(index)}
                >
                  {crumb.tree_descr}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div
          className={cn(
            'grid min-h-0 flex-1 grid-cols-1',
            customerId ? 'lg:grid-cols-[320px_1fr_340px]' : 'lg:grid-cols-[320px_1fr]'
          )}
        >
          <div className='min-h-0 border-b lg:border-r lg:border-b-0'>
            <CatalogCategorySidebar
              projectId={projectId}
              value={category.treeId}
              onChange={(next) => setCategory(next)}
              path={path}
              onPathChange={setPath}
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
                  <p className='text-[13px] font-semibold'>Select a customer first</p>
                  <p className='text-text-tertiary mt-1 text-[13px]'>
                    Prices and availability depend on the customer.
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
      </DialogContent>
    </Dialog>
  )
}
