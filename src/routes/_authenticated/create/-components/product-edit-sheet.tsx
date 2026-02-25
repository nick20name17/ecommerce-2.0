import { Package, X } from 'lucide-react'

import { ProductConfigurations } from './product-configurations'
import { ProductImageGallery } from './product-image-gallery'
import { ProductInfoSection } from './product-info-section'
import { useProductEditSheet } from './use-product-edit-sheet'
import type { AddToCartPayload, UpdateCartItemPayload } from '@/api/cart/schema'
import { cartService } from '@/api/cart/service'
import type { CartItem, ConfigurationProduct, Product } from '@/api/product/schema'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Spinner } from '@/components/ui/spinner'
import { getErrorMessage } from '@/helpers/error'
import { formatCurrency } from '@/helpers/formatters'

interface ProductEditSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | CartItem | null
  mode: 'add' | 'edit'
  configData: ConfigurationProduct | null
  configLoading: boolean
  customerId: string
  projectId?: number | null
  onSaved: () => void
}

export function ProductEditSheet({
  open,
  onOpenChange,
  product,
  mode,
  configData,
  configLoading,
  customerId,
  projectId,
  onSaved
}: ProductEditSheetProps) {
  const {
    state,
    dispatch,
    activeConfigurations,
    hasUncheckedRequired,
    totalPrice,
    totalOldPrice,
    hasChanges,
    isCartItem
  } = useProductEditSheet(product, mode, open, configData, projectId)

  const { quantity, saving, confirmClose, photoIndex, selectedUnit, configs, activeTab } = state

  const displayName = product ? (isCartItem(product) ? product.name : product.descr_1) : ''

  const photos = product?.photos as string[] | undefined
  const specs =
    product && !isCartItem(product)
      ? ((product.product_specs as Array<{ descr: string; info: string }>) ?? [])
      : []

  const units = (product && !isCartItem(product) ? product.units : undefined) as
    | Array<{ autoid: string; unit: string; multiplier: string; price: string; old_price: string }>
    | undefined
  const hasMultipleUnits = (units?.length ?? 0) > 1

  const maxCount = (() => {
    const v = configData?.max_count ?? product?.max_count
    if (typeof v === 'number') return v
    if (typeof v === 'string') return parseInt(String(v), 10) || 9999
    return 9999
  })()

  const ignoreCount = configData
    ? configData.ignore_count
    : product
      ? isCartItem(product)
        ? product.ignore_count
        : Boolean((product as Product & { ignore_count?: boolean }).ignore_count ?? (product as Product).ignoreCount)
      : false

  const hasConfigs = configs.length > 0

  const handleSelectConfigItem = (configName: string, itemId: string) => {
    dispatch({ type: 'SELECT_CONFIG_ITEM', configName, itemId })
  }

  const handleClose = () => {
    if (hasChanges) {
      dispatch({ type: 'SET_CONFIRM_CLOSE', value: true })
    } else {
      onOpenChange(false)
    }
  }

  const handleSave = async () => {
    if (!product || !customerId) return
    dispatch({ type: 'SET_SAVING', value: true })
    const isAdd = mode === 'add'
    const addPayload: AddToCartPayload | null = isAdd
      ? {
          product_autoid: isCartItem(product) ? product.product_autoid : product.autoid,
          quantity,
          unit: selectedUnit || (isCartItem(product) ? '' : product.def_unit) || '',
          configurations:
            activeConfigurations.length > 0
              ? (activeConfigurations as AddToCartPayload['configurations'])
              : undefined
        }
      : null
    const editPayload: UpdateCartItemPayload | null = !isAdd
      ? {
          quantity,
          configurations: activeConfigurations as UpdateCartItemPayload['configurations']
        }
      : null
    const itemId = !isAdd && isCartItem(product) ? product.id : 0
    const savePromise =
      isAdd && addPayload
        ? cartService.addItem(addPayload, customerId, projectId)
        : !isAdd && editPayload
          ? cartService.updateItem(itemId, editPayload, customerId, projectId)
          : Promise.resolve()
    try {
      await savePromise
      onOpenChange(false)
      onSaved()
    } catch (error) {
      console.error('Failed to save:', getErrorMessage(error))
    }
    dispatch({ type: 'SET_SAVING', value: false })
  }

  const priceDisplay = hasConfigs
    ? totalPrice
    : Number(product?.price || (product && !isCartItem(product) ? product.cost : 0) || 0)
  const oldPriceDisplay = hasConfigs
    ? totalOldPrice
    : Number((product && !isCartItem(product) ? product.old_price : 0) || 0)
  const hasDiscount = oldPriceDisplay > priceDisplay

  const selectedConfigCount = activeConfigurations.length
  const totalConfigCount = configs.length

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => (!v ? handleClose() : onOpenChange(v))}
      >
        <DialogContent
          showCloseButton={false}
          className='flex h-[92vh] w-[94vw] max-w-[1400px]! flex-col gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl'
        >
          {/* Header */}
          <div className='relative shrink-0 border-b bg-muted/30'>
            <div className='flex items-center justify-between px-6 py-4'>
              <div className='flex items-center gap-3'>
                <div className='flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm'>
                  <Package className='size-5' />
                </div>
                <div>
                  <h2 className='font-semibold'>Configure Product</h2>
                  <p className='text-xs text-muted-foreground'>
                    {mode === 'add' ? 'Add to cart' : 'Update configuration'}
                  </p>
                </div>
              </div>
              <Button
                variant='ghost'
                size='icon'
                className='size-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground'
                onClick={handleClose}
              >
                <X className='size-4' />
              </Button>
            </div>
          </div>

          <ScrollArea className='min-h-0 flex-1'>
            <div className='flex flex-col gap-6 p-6'>
              <div className='grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]'>
                {/* Left: Image Gallery */}
                <ProductImageGallery
                  photos={photos}
                  photoIndex={photoIndex}
                  onPhotoIndexChange={(i) => dispatch({ type: 'SET_PHOTO_INDEX', value: i })}
                  displayName={displayName}
                />

                {/* Right: Product Info */}
                <ProductInfoSection
                  displayName={displayName}
                  configLoading={configLoading}
                  hasConfigs={hasConfigs}
                  hasMultipleUnits={hasMultipleUnits}
                  priceDisplay={priceDisplay}
                  oldPriceDisplay={oldPriceDisplay}
                  hasDiscount={hasDiscount}
                  quantity={quantity}
                  onQuantityChange={(v) => dispatch({ type: 'SET_QUANTITY', value: v })}
                  ignoreCount={ignoreCount}
                  maxCount={maxCount}
                  selectedUnit={selectedUnit}
                  onSelectedUnitChange={(u) => dispatch({ type: 'SET_SELECTED_UNIT', value: u })}
                  units={units}
                  specs={specs}
                />
              </div>

              {/* Configurations section */}
              {!configLoading && hasConfigs && (
                <ProductConfigurations
                  configs={configs}
                  activeTab={activeTab}
                  onActiveTabChange={(tab) => dispatch({ type: 'SET_ACTIVE_TAB', value: tab })}
                  onSelectConfigItem={handleSelectConfigItem}
                  hasUncheckedRequired={hasUncheckedRequired}
                  selectedConfigCount={selectedConfigCount}
                  totalConfigCount={totalConfigCount}
                />
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className='shrink-0 border-t bg-muted/30'>
            <div className='flex items-center justify-between gap-4 px-6 py-4'>
              {/* Price summary */}
              <div className='flex items-center gap-4'>
                <div>
                  <p className='text-[10px] font-medium text-muted-foreground uppercase tracking-wider'>Total</p>
                  <p className='text-xl font-bold tabular-nums'>{formatCurrency(priceDisplay * quantity)}</p>
                </div>
                {quantity > 1 && (
                  <span className='text-xs text-muted-foreground'>
                    {formatCurrency(priceDisplay)} × {quantity}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className='flex items-center gap-2'>
                <Button variant='ghost' size='sm' onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  size='sm'
                  disabled={hasUncheckedRequired || configLoading || saving || (!ignoreCount && maxCount < 0)}
                  onClick={handleSave}
                >
                  {saving ? (
                    <>
                      <Spinner className='mr-1.5 size-3.5' />
                      Saving...
                    </>
                  ) : mode === 'add' ? (
                    'Add to Cart'
                  ) : (
                    'Update'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmClose}
        onOpenChange={(v) => dispatch({ type: 'SET_CONFIRM_CLOSE', value: v })}
      >
        <AlertDialogContent className='rounded-2xl'>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to close? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={() => {
                dispatch({ type: 'SET_CONFIRM_CLOSE', value: false })
                onOpenChange(false)
              }}
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
