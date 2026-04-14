import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, Package, Plus, Star, Trash2 } from 'lucide-react'
import { useState } from 'react'

import type { VariableProduct, VariableProductItem } from '@/api/variable-product/schema'
import { variableProductService } from '@/api/variable-product/service'
import { VP_QUERY_KEYS } from '@/api/variable-product/query'
import { ProductBrowserDialog } from '@/components/common/product-browser-dialog'
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

interface VPItemsSectionProps {
  vp: VariableProduct
  projectId: number | null
  isMobile?: boolean
  isTablet?: boolean
}

export const VPItemsSection = ({ vp, projectId, isMobile, isTablet }: VPItemsSectionProps) => {
  const [addOpen, setAddOpen] = useState(false)
  const [productBrowserOpen, setProductBrowserOpen] = useState(false)
  const [productAutoid, setProductAutoid] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [sortOrder, setSortOrder] = useState(0)

  const addItemMutation = useMutation({
    mutationFn: () =>
      variableProductService.addItem(
        vp.id,
        { product_autoid: productAutoid, is_default: isDefault, sort_order: sortOrder },
        { project_id: projectId ?? undefined }
      ),
    meta: {
      successMessage: 'Product added',
      invalidatesQuery: VP_QUERY_KEYS.detail(vp.id),
    },
    onSuccess: () => {
      setProductAutoid('')
      setIsDefault(false)
      setSortOrder(0)
      setAddOpen(false)
    },
  })

  const queryClient = useQueryClient()

  const toggleItemActiveMutation = useMutation({
    mutationFn: ({ itemId, active }: { itemId: string; active: boolean }) =>
      variableProductService.updateItem(vp.id, itemId, { active }, {
        project_id: projectId ?? undefined,
      }),
    onMutate: async ({ itemId, active }) => {
      // Optimistic update — find and patch the VP detail in cache
      const queries = queryClient.getQueriesData<VariableProduct>({
        queryKey: VP_QUERY_KEYS.detail(vp.id),
      })
      for (const [key, data] of queries) {
        if (data) {
          queryClient.setQueryData<VariableProduct>(key, {
            ...data,
            items: data.items.map((item: VariableProductItem) =>
              item.id === itemId ? { ...item, active } : item
            ),
          })
        }
      }
    },
  })

  const addProductsMutation = useMutation({
    mutationFn: async (products: { autoid: string }[]) => {
      const params = { project_id: projectId ?? undefined }
      for (const p of products) {
        await variableProductService.addItem(vp.id, { product_autoid: p.autoid }, params)
      }
    },
    meta: {
      successMessage: 'Products added',
      invalidatesQuery: VP_QUERY_KEYS.detail(vp.id),
    },
  })

  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) =>
      variableProductService.removeItem(vp.id, itemId, {
        project_id: projectId ?? undefined,
      }),
    meta: {
      successMessage: 'Product removed',
      invalidatesQuery: VP_QUERY_KEYS.detail(vp.id),
    },
  })

  return (
    <div>
      <div className='flex items-center gap-2 mb-2'>
        <h3 className='text-[13px] font-semibold text-text-secondary'>
          Items ({vp.items.length})
        </h3>
        <div className='flex-1' />
        <Button variant='outline' size='xs' onClick={() => setProductBrowserOpen(true)} isPending={addProductsMutation.isPending}>
          <Plus className='size-3' />
          Browse
        </Button>
        <Button variant='ghost' size='xs' onClick={() => setAddOpen(true)} title='Add by autoid'>
          <Plus className='size-3' />
          Manual
        </Button>
      </div>

      {vp.items.length === 0 ? (
        <div className='rounded-lg border border-dashed border-border py-6 text-center text-[13px] text-text-tertiary'>
          No products added yet
        </div>
      ) : isMobile ? (
        /* Mobile: card layout */
        <div className='flex flex-col gap-2'>
          {vp.items.map((item) => (
            <div
              key={item.id}
              className={cn('rounded-lg border border-border p-3', item.active === false && 'opacity-40')}
            >
              <div className='flex items-start gap-2'>
                <Package className='size-4 text-amber-500 shrink-0 mt-0.5' />
                <div className='flex-1 min-w-0'>
                  <div className='text-[13px] font-medium truncate'>{item.descr_1 || item.product_id}</div>
                  <div className='text-[11px] font-mono text-text-tertiary'>{item.product_id}</div>
                </div>
                {item.is_default && (
                  <Star className='size-3.5 fill-amber-400 text-amber-400 shrink-0' />
                )}
                <Button
                  variant='ghost'
                  size='icon-xs'
                  className={cn('shrink-0', item.active !== false ? 'text-text-tertiary' : 'text-text-quaternary')}
                  onClick={() => toggleItemActiveMutation.mutate({ itemId: item.id, active: item.active === false })}
                >
                  {item.active !== false ? <Eye className='size-3.5' /> : <EyeOff className='size-3.5' />}
                </Button>
                <Button
                  variant='ghost'
                  size='icon-xs'
                  className='text-text-tertiary hover:text-destructive shrink-0'
                  onClick={() => removeItemMutation.mutate(item.id)}
                >
                  <Trash2 className='size-3.5' />
                </Button>
              </div>
              <div className='flex items-center gap-4 mt-1.5 pl-6 text-[12px] text-text-secondary'>
                <span>Price: {item.price ? `$${item.price}` : '—'}</span>
                <span>Stock: {item.available_stock ?? '—'}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Desktop/tablet: table layout */
        <div className='rounded-lg border border-border overflow-hidden'>
          <div className={cn(
            'bg-bg-secondary text-text-tertiary flex items-center py-1.5 text-[12px] font-medium',
            isTablet ? 'gap-3 px-3' : 'gap-4 px-4'
          )}>
            <div className='w-5 shrink-0' />
            <div className={cn(isTablet ? 'w-[80px]' : 'w-[100px]', 'shrink-0')}>Product ID</div>
            <div className='flex-1 min-w-0'>Description</div>
            <div className='w-[70px] shrink-0 text-right'>Price</div>
            {!isTablet && <div className='w-[70px] shrink-0 text-right'>Stock</div>}
            {!isTablet && <div className='w-[50px] shrink-0 text-center'>Default</div>}
            <div className='w-[28px] shrink-0' />
            <div className='w-[28px] shrink-0' />
          </div>

          {vp.items.map((item) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center border-t border-border-light py-1.5 hover:bg-bg-hover transition-colors',
                isTablet ? 'gap-3 px-3' : 'gap-4 px-4',
                item.active === false && 'opacity-40'
              )}
            >
              <Package className='size-4 text-amber-500 shrink-0' />
              <div className={cn(isTablet ? 'w-[80px]' : 'w-[100px]', 'shrink-0 text-[12px] font-mono text-text-secondary truncate')}>
                {item.product_id}
              </div>
              <div className='flex-1 min-w-0 text-[13px] truncate'>
                {item.descr_1}
                {isTablet && item.is_default && (
                  <Star className='ml-1 inline size-3 fill-amber-400 text-amber-400' />
                )}
              </div>
              <div className='w-[70px] shrink-0 text-right text-[13px] tabular-nums'>
                {item.price ? `$${item.price}` : '—'}
              </div>
              {!isTablet && (
                <div className='w-[70px] shrink-0 text-right text-[13px] tabular-nums'>
                  {item.available_stock ?? '—'}
                </div>
              )}
              {!isTablet && (
                <div className='w-[50px] shrink-0 flex justify-center'>
                  {item.is_default && (
                    <Star className='size-3.5 fill-amber-400 text-amber-400' />
                  )}
                </div>
              )}
              <Button
                variant='ghost'
                size='icon-xs'
                className={cn(
                  'shrink-0',
                  item.active !== false
                    ? 'text-text-tertiary hover:text-amber-500'
                    : 'text-text-quaternary hover:text-emerald-500'
                )}
                onClick={() => toggleItemActiveMutation.mutate({ itemId: item.id, active: item.active === false })}
                title={item.active !== false ? 'Hide from site' : 'Show on site'}
              >
                {item.active !== false ? <Eye className='size-3.5' /> : <EyeOff className='size-3.5' />}
              </Button>
              <Button
                variant='ghost'
                size='icon-xs'
                className='text-text-tertiary hover:text-destructive'
                onClick={() => removeItemMutation.mutate(item.id)}
              >
                <Trash2 className='size-3.5' />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add item dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className='sm:max-w-sm'>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              addItemMutation.mutate()
            }}
          >
            <DialogHeader>
              <DialogTitle>Add Product</DialogTitle>
            </DialogHeader>
            <DialogBody className='flex flex-col gap-3'>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='vpi-autoid'>Product Autoid</Label>
                <Input
                  id='vpi-autoid'
                  value={productAutoid}
                  onChange={(e) => setProductAutoid(e.target.value)}
                  placeholder='INVENTRY_AUTOID'
                  required
                  autoFocus
                />
              </div>
              <div className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  id='vpi-default'
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className='size-4 rounded border-border'
                />
                <Label htmlFor='vpi-default'>Default variant</Label>
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='vpi-sort'>Sort Order</Label>
                <Input
                  id='vpi-sort'
                  type='number'
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type='submit' isPending={addItemMutation.isPending}>
                Add Product
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ProductBrowserDialog
        open={productBrowserOpen}
        onOpenChange={setProductBrowserOpen}
        projectId={projectId}
        title='Add Products to Variable Product'
        onSelect={(products) => addProductsMutation.mutate(products)}
      />
    </div>
  )
}
