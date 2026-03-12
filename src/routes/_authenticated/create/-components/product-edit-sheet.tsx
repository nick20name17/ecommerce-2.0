import { useMutation } from '@tanstack/react-query'
import { X } from 'lucide-react'

import { ProductConfigurations } from './product-configurations'
import { ProductImageGallery } from './product-image-gallery'
import { ProductInfoSection } from './product-info-section'
import { useProductEditSheet } from './use-product-edit-sheet'
import { CART_QUERY_KEYS } from '@/api/cart/query'
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
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
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

export const ProductEditSheet = ({
  open,
  onOpenChange,
  product,
  mode,
  configData,
  configLoading,
  customerId,
  projectId,
  onSaved
}: ProductEditSheetProps) => {
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

  const { quantity, confirmClose, photoIndex, selectedUnit, configs, activeTab } = state

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!product || !customerId) return
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
      if (isAdd && addPayload) {
        return cartService.addItem(addPayload, customerId, projectId)
      }
      if (!isAdd && editPayload) {
        return cartService.updateItem(itemId, editPayload, customerId, projectId)
      }
    },
    meta: {
      successMessage: mode === 'add' ? 'Added to cart' : 'Cart updated',
      errorMessage: 'Failed to save',
      invalidatesQuery: CART_QUERY_KEYS.detail(customerId, projectId)
    },
    onSuccess: () => {
      onOpenChange(false)
      onSaved()
    }
  })

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
        : Boolean(
            (product as Product & { ignore_count?: boolean }).ignore_count ??
            (product as Product).ignoreCount
          )
      : false

  const hasConfigs = configs.length > 0
  const selectedConfigCount = activeConfigurations.length

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

  const handleSave = () => {
    if (!product || !customerId) return
    saveMutation.mutate()
  }

  const priceDisplay = hasConfigs
    ? selectedConfigCount > 0
      ? totalPrice
      : Number(configData?.base_price) || 0
    : Number(product?.price || (product && !isCartItem(product) ? product.cost : 0) || 0)
  const oldPriceDisplay = hasConfigs
    ? selectedConfigCount > 0
      ? totalOldPrice
      : Number(configData?.base_old_price) || 0
    : Number((product && !isCartItem(product) ? product.old_price : 0) || 0)
  const hasDiscount = oldPriceDisplay > priceDisplay

  const totalConfigCount = configs.length

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => (!v ? handleClose() : onOpenChange(v))}
      >
        <DialogContent
          showCloseButton={false}
          className='flex h-[92vh] w-[94vw] max-w-[1200px]! flex-col gap-0 overflow-hidden rounded-[12px] border p-0 shadow-2xl'
        >
          {/* Header */}
          <div className='flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-5'>
            <h2 className='text-[14px] font-semibold tracking-[-0.01em]'>
              {mode === 'add' ? 'Add Product' : 'Edit Product'}
            </h2>
            <span className='text-[13px] text-text-tertiary'>
              {displayName}
            </span>
            <div className='flex-1' />
            <button
              type='button'
              className='inline-flex size-7 items-center justify-center rounded-[5px] text-text-tertiary transition-colors duration-[80ms] hover:bg-bg-hover hover:text-foreground'
              onClick={handleClose}
            >
              <X className='size-4' />
            </button>
          </div>

          {/* Body — two-panel layout */}
          <div className='flex min-h-0 flex-1'>
            {/* Left panel: image + info */}
            <div className='flex w-[380px] shrink-0 flex-col overflow-y-auto border-r border-border bg-bg-secondary/30 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'>
              <div className='p-4'>
                <ProductImageGallery
                  photos={photos}
                  photoIndex={photoIndex}
                  onPhotoIndexChange={(i) => dispatch({ type: 'SET_PHOTO_INDEX', value: i })}
                  displayName={displayName}
                />
              </div>

              <div className='border-t border-border p-4'>
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
            </div>

            {/* Right panel: configurations */}
            <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
              {!configLoading && hasConfigs ? (
                <ProductConfigurations
                  configs={configs}
                  activeTab={activeTab}
                  onActiveTabChange={(tab) => dispatch({ type: 'SET_ACTIVE_TAB', value: tab })}
                  onSelectConfigItem={handleSelectConfigItem}
                  onResetConfigurations={() => dispatch({ type: 'DESELECT_ALL_CONFIGS' })}
                  hasUncheckedRequired={hasUncheckedRequired}
                  selectedConfigCount={selectedConfigCount}
                  totalConfigCount={totalConfigCount}
                />
              ) : configLoading ? (
                <div className='flex flex-1 items-center justify-center'>
                  <Spinner className='size-5 text-text-tertiary' />
                </div>
              ) : (
                <div className='flex flex-1 items-center justify-center text-[13px] text-text-tertiary'>
                  No configurations available
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className='flex shrink-0 items-center justify-between gap-4 border-t border-border px-5 py-3'>
            <div className='flex items-center gap-3'>
              <div>
                <span className='text-[12px] font-medium uppercase tracking-[0.04em] text-text-tertiary'>
                  Total
                </span>
                <p className='text-[18px] font-bold tabular-nums leading-tight'>
                  {formatCurrency(priceDisplay * quantity)}
                </p>
              </div>
              {quantity > 1 && (
                <span className='text-[12px] tabular-nums text-text-tertiary'>
                  {formatCurrency(priceDisplay)} × {quantity}
                </span>
              )}
            </div>

            <div className='flex items-center gap-2'>
              <button
                type='button'
                className='inline-flex h-8 items-center rounded-[6px] px-3 text-[13px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-bg-hover hover:text-foreground'
                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                type='button'
                className='inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-primary px-4 text-[13px] font-medium text-primary-foreground transition-opacity duration-[80ms] hover:opacity-90 disabled:pointer-events-none disabled:opacity-50'
                disabled={
                  hasUncheckedRequired ||
                  configLoading ||
                  saveMutation.isPending ||
                  (!ignoreCount && maxCount < 0)
                }
                onClick={handleSave}
              >
                {saveMutation.isPending ? (
                  <>
                    <Spinner className='size-3.5' />
                    Saving…
                  </>
                ) : mode === 'add' ? (
                  'Add to Cart'
                ) : (
                  'Update'
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmClose}
        onOpenChange={(v) => dispatch({ type: 'SET_CONFIRM_CLOSE', value: v })}
      >
        <AlertDialogContent className='rounded-[12px]'>
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
