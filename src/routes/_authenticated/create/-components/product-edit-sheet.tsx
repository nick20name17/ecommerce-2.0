import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Package,
  Sparkles,
  X
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { AddToCartPayload, UpdateCartItemPayload } from '@/api/cart/schema'
import { cartService } from '@/api/cart/service'
import type { CartItem, Configuration, ConfigurationProduct, Product } from '@/api/product/schema'
import { productService } from '@/api/product/service'
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
import { NumberInput } from '@/components/ui/number-input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { getErrorMessage } from '@/helpers/error'
import { formatCurrency } from '@/helpers/formatters'
import { cn } from '@/lib/utils'

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

function isCartItem(p: Product | CartItem): p is CartItem {
  return 'id' in p && typeof (p as CartItem).id === 'number' && 'product_autoid' in p
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
  const [quantity, setQuantity] = useState(1)
  const [saving, setSaving] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [selectedUnit, setSelectedUnit] = useState('')
  const [configs, setConfigs] = useState<Configuration[]>([])
  const [activeTab, setActiveTab] = useState('')
  const [initialQuantity, setInitialQuantity] = useState(1)
  const [initialConfigIds, setInitialConfigIds] = useState<Set<string | number>>(new Set())
  const requestedTabsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!product || !open) return
    const qty = mode === 'edit' && isCartItem(product) ? product.quantity : 1
    queueMicrotask(() => {
      setQuantity(qty)
      setInitialQuantity(qty)
      setPhotoIndex(0)
      setSelectedUnit(product.unit || (isCartItem(product) ? '' : product.def_unit) || '')
      setConfirmClose(false)
      setInitialConfigIds(new Set())
    })
  }, [product, mode, open])

  useEffect(() => {
    if (!configData?.configurations?.length) {
      queueMicrotask(() => {
        setConfigs([])
        setActiveTab('')
        requestedTabsRef.current.clear()
      })
      return
    }
    requestedTabsRef.current.clear()
    const cloned = configData.configurations.map((c) => ({
      ...c,
      items: c.items.map((item) => ({ ...item })),
      photosRequested: false,
      photosLoading: false
    }))
    cloned.forEach((config) => {
      const hasActive = config.items.some((i) => i.active)
      if (!hasActive && config.default) {
        const def = config.items.find((i) => i.id === config.default)
        if (def) def.active = true
      }
    })
    const ids = new Set<string | number>()
    cloned.forEach((c) =>
      c.items.forEach((i) => {
        if (i.active) ids.add(i.id)
      })
    )
    queueMicrotask(() => {
      setConfigs(cloned)
      setActiveTab(cloned[0]?.name ?? '')
      setInitialConfigIds(ids)
    })
  }, [configData])

  useEffect(() => {
    if (!activeTab || !product) return
    if (requestedTabsRef.current.has(activeTab)) return

    const configurationId = configData?.id || configData?.autoid
    if (!configurationId) return

    requestedTabsRef.current.add(activeTab)

    const tabToFetch = activeTab
    const fetchPhotos = async () => {
      try {
        const photos = await productService.getConfigurationPhotos({
          configuration_id: configurationId,
          category_name: tabToFetch,
          project_id: projectId ?? undefined
        })
        const photosMap = new Map(photos.map((p) => [p.id, p.photos]))
        setConfigs((prev) =>
          prev.map((c) => {
            if (c.name !== tabToFetch) return c
            return {
              ...c,
              photosLoading: false,
              items: c.items.map((item) => ({
                ...item,
                photos: photosMap.get(item.id) ?? item.photos
              }))
            }
          })
        )
      } catch {
        setConfigs((prev) =>
          prev.map((c) => (c.name === tabToFetch ? { ...c, photosLoading: false } : c))
        )
      }
    }

    queueMicrotask(() => {
      setConfigs((prev) =>
        prev.map((c) =>
          c.name === tabToFetch ? { ...c, photosLoading: true } : c
        )
      )
      fetchPhotos()
    })
  }, [activeTab, product, projectId, configData])

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
    const v = product?.max_count
    if (typeof v === 'number') return v
    if (typeof v === 'string') return parseInt(v) || 9999
    return 9999
  })()

  const ignoreCount = product
    ? isCartItem(product)
      ? product.ignore_count
      : product.ignoreCount
    : false

  const hasConfigs = configs.length > 0

  const activeConfigurations = (() => {
    const result: { name: string; id: string | number }[] = []
    configs.forEach((c) => {
      c.items.forEach((i) => {
        if (i.active) result.push({ name: c.name, id: i.id })
      })
    })
    return result
  })()

  const hasUncheckedRequired = configs.some((c) => !c.allownone && !c.items.some((i) => i.active))

  const totalPrice = (() => {
    let total = Number(configData?.base_price) || 0
    configs.forEach((c) =>
      c.items.forEach((i) => {
        if (i.active) total += Number(i.price) || 0
      })
    )
    return total
  })()

  const totalOldPrice = (() => {
    let total = Number(configData?.base_old_price) || 0
    configs.forEach((c) =>
      c.items.forEach((i) => {
        if (i.active) total += Number(i.old_price) || 0
      })
    )
    return total
  })()

  const hasChanges = (() => {
    if (quantity !== initialQuantity) return true
    const currentIds = new Set(activeConfigurations.map((c) => c.id))
    if (currentIds.size !== initialConfigIds.size) return true
    for (const id of currentIds) {
      if (!initialConfigIds.has(id)) return true
    }
    return false
  })()

  const handleSelectConfigItem = (configName: string, itemId: string) => {
    setConfigs((prev) =>
      prev.map((c) => {
        if (c.name !== configName) return c
        return {
          ...c,
          items: c.items.map((i) => ({
            ...i,
            active: i.id === itemId ? !i.active : false
          }))
        }
      })
    )
  }

  const handleClose = () => {
    if (hasChanges) {
      setConfirmClose(true)
    } else {
      onOpenChange(false)
    }
  }

  const handleSave = async () => {
    if (!product || !customerId) return
    setSaving(true)
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
    setSaving(false)
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
                <div className='flex flex-col gap-3'>
                  <div className='group relative'>
                    {photos?.length ? (
                      <div className='relative aspect-square w-full overflow-hidden rounded-xl border bg-muted/30'>
                        <img
                          src={photos[photoIndex]}
                          alt={displayName}
                          className='size-full object-contain p-4 transition-transform duration-300 group-hover:scale-[1.02]'
                        />
                        {photos.length > 1 && (
                          <>
                            <button
                              type='button'
                              className='absolute top-1/2 left-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-md ring-1 ring-border backdrop-blur-sm transition-all hover:bg-background disabled:pointer-events-none disabled:opacity-0'
                              disabled={photoIndex === 0}
                              onClick={() => setPhotoIndex((i) => i - 1)}
                            >
                              <ChevronLeft className='size-4' />
                            </button>
                            <button
                              type='button'
                              className='absolute top-1/2 right-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-md ring-1 ring-border backdrop-blur-sm transition-all hover:bg-background disabled:pointer-events-none disabled:opacity-0'
                              disabled={photoIndex === photos.length - 1}
                              onClick={() => setPhotoIndex((i) => i + 1)}
                            >
                              <ChevronRight className='size-4' />
                            </button>
                            <div className='absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-foreground/80 px-2.5 py-1 text-[10px] font-medium text-background backdrop-blur-sm'>
                              {photoIndex + 1} / {photos.length}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className='flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-xl border bg-muted/30'>
                        <ImageIcon className='size-12 text-muted-foreground/40' />
                        <span className='text-xs text-muted-foreground'>No images</span>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail strip */}
                  {photos && photos.length > 1 && (
                    <div className='flex gap-2 overflow-x-auto'>
                      {photos.map((photo, i) => (
                        <button
                          key={i}
                          type='button'
                          className={cn(
                            'relative size-14 shrink-0 overflow-hidden rounded-lg ring-2 transition-all',
                            i === photoIndex
                              ? 'ring-primary'
                              : 'ring-transparent hover:ring-muted-foreground/30'
                          )}
                          onClick={() => setPhotoIndex(i)}
                        >
                          <img
                            src={photo}
                            alt={`${displayName} - ${i + 1}`}
                            className='size-full object-cover'
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Product Info */}
                <div className='flex min-w-0 flex-col gap-5'>
                  {/* Title */}
                  <h1 className='text-xl font-bold leading-tight tracking-tight wrap-break-word lg:text-2xl'>
                    {displayName}
                  </h1>

                  {/* Price */}
                  {configLoading ? (
                    <div className='space-y-2'>
                      <Skeleton className='h-8 w-32' />
                      <Skeleton className='h-4 w-20' />
                    </div>
                  ) : (
                    (hasConfigs || !hasMultipleUnits) && (
                      <div className='flex flex-wrap items-baseline gap-2'>
                        <span
                          className={cn(
                            'text-2xl font-bold tracking-tight lg:text-3xl',
                            hasDiscount && 'text-green-600 dark:text-green-500'
                          )}
                        >
                          {formatCurrency(priceDisplay)}
                        </span>
                        {hasDiscount && (
                          <span className='text-base text-muted-foreground line-through'>
                            {formatCurrency(oldPriceDisplay)}
                          </span>
                        )}
                        {hasDiscount && (
                          <span className='rounded-md bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-400'>
                            -{Math.round((1 - priceDisplay / oldPriceDisplay) * 100)}%
                          </span>
                        )}
                      </div>
                    )
                  )}

                  {/* Quantity */}
                  {!configLoading && (
                    <div className='space-y-2'>
                      <label className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                        Quantity
                      </label>
                      <div className='w-fit'>
                        <NumberInput
                          value={quantity}
                          onChange={setQuantity}
                          min={1}
                          max={ignoreCount ? undefined : maxCount}
                          disabled={!ignoreCount && maxCount <= 0}
                          showMaxMessage
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Units, Specifications */}
              {!configLoading && (
                <>
                  {/* Units selection */}
                  {hasMultipleUnits && units && (
                    <div className='space-y-2'>
                      <label className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                        Unit of Measure
                      </label>
                      <div className='flex flex-wrap gap-2'>
                        {units.map((u) => {
                          const isSelected = selectedUnit === u.unit
                          return (
                            <button
                              key={u.autoid}
                              type='button'
                              className={cn(
                                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm ring-1 transition-all',
                                isSelected
                                  ? 'bg-primary text-primary-foreground ring-primary'
                                  : 'bg-card ring-border hover:ring-primary/50'
                              )}
                              onClick={() => setSelectedUnit(u.unit)}
                            >
                              <span className='font-semibold'>{u.unit}</span>
                              <span className={cn('text-xs', isSelected ? 'opacity-80' : 'text-muted-foreground')}>
                                {formatCurrency(u.price)}
                              </span>
                              {u.multiplier !== '1.0000' && (
                                <span className={cn('rounded px-1 py-0.5 text-[10px] font-medium', isSelected ? 'bg-white/20' : 'bg-muted')}>
                                  ×{parseFloat(u.multiplier)}
                                </span>
                              )}
                              {isSelected && <Check className='size-3.5' />}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Specifications */}
                  {specs.length > 0 && (
                    <div className='space-y-2'>
                      <label className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                        Specifications
                      </label>
                      <div className='divide-y rounded-lg border bg-muted/20'>
                        {specs.map((spec) => (
                          <div key={spec.descr} className='flex gap-3 px-3 py-2.5 text-sm'>
                            <span className='w-2/5 shrink-0 font-medium wrap-break-word'>{spec.descr}</span>
                            <span className='text-muted-foreground wrap-break-word'>{spec.info}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Configurations section */}
              {!configLoading && hasConfigs && (
                <div className='space-y-4 rounded-xl border bg-muted/20 p-4'>
                  {/* Section header */}
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <Sparkles className='size-4 text-primary' />
                      <h3 className='text-sm font-semibold'>Configurations</h3>
                      <span className='text-xs text-muted-foreground'>
                        ({selectedConfigCount}/{totalConfigCount})
                      </span>
                    </div>
                    {hasUncheckedRequired && (
                      <span className='flex items-center gap-1.5 rounded-md bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive'>
                        <AlertCircle className='size-3' />
                        Required
                      </span>
                    )}
                  </div>

                  {/* Config tabs */}
                  <div className='flex flex-wrap gap-1 rounded-lg bg-muted p-1'>
                    {configs.map((c) => {
                      const hasSelected = c.items.some((i) => i.active)
                      const isRequired = !c.allownone
                      const isActive = activeTab === c.name
                      return (
                        <button
                          key={c.name}
                          type='button'
                          className={cn(
                            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                            isActive
                              ? 'bg-background text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                          onClick={() => setActiveTab(c.name)}
                        >
                          {hasSelected && (
                            <span className={cn('flex size-4 items-center justify-center rounded-full bg-primary text-white')}>
                              <Check className='size-2.5' />
                            </span>
                          )}
                          <span>{c.name}</span>
                          {isRequired && !hasSelected && <span className='text-destructive'>*</span>}
                        </button>
                      )
                    })}
                  </div>

                  {/* Config items grid */}
                  {configs.map((c) => (
                    <div
                      key={c.name}
                      className={cn(
                        'grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
                        activeTab !== c.name && 'hidden'
                      )}
                    >
                      {c.items.map((item) => {
                        const isSelected = item.active
                        return (
                          <button
                            key={item.id}
                            type='button'
                            className={cn(
                              'group relative flex flex-col overflow-hidden rounded-lg border transition-all',
                              isSelected
                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                : 'border-border hover:border-primary/50'
                            )}
                            onClick={() => handleSelectConfigItem(c.name, item.id)}
                          >
                            {/* Selection indicator */}
                            {isSelected && (
                              <div className='absolute top-1.5 right-1.5 z-10 flex size-5 items-center justify-center rounded-full bg-primary text-white'>
                                <Check className='size-3' />
                              </div>
                            )}

                            {/* Image */}
                            <div className='relative aspect-square bg-muted/30'>
                              {c.photosLoading ? (
                                <div className='flex size-full items-center justify-center'>
                                  <Spinner className='size-5 text-muted-foreground' />
                                </div>
                              ) : item.photos?.length ? (
                                <img
                                  src={item.photos[0]}
                                  alt={item.descr_1}
                                  className='size-full object-contain p-2 transition-transform group-hover:scale-105'
                                />
                              ) : (
                                <div className='flex size-full items-center justify-center'>
                                  <ImageIcon className='size-8 text-muted-foreground/40' />
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className='flex flex-1 flex-col gap-0.5 p-2'>
                              <span className='line-clamp-2 text-left text-[11px] leading-tight text-muted-foreground wrap-break-word'>
                                {item.descr_1}
                              </span>
                              <span className={cn('mt-auto text-left text-xs font-semibold', isSelected && 'text-primary')}>
                                +{formatCurrency(item.price)}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>
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
                  disabled={hasUncheckedRequired || configLoading || saving || (!ignoreCount && maxCount <= 0)}
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
        onOpenChange={setConfirmClose}
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
                setConfirmClose(false)
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
