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
          {/* Header with gradient accent */}
          <div className='relative shrink-0 overflow-hidden'>
            <div className='relative flex items-center justify-between px-8 py-5'>
              <div className='flex items-center gap-4'>
                <div className='bg-primary/10 flex size-11 items-center justify-center rounded-xl'>
                  <Package className='text-primary size-5' />
                </div>
                <div>
                  <h2 className='text-lg font-semibold tracking-tight'>Configure Product</h2>
                  <p className='text-muted-foreground text-sm'>
                    {mode === 'add' ? 'Add to cart' : 'Update configuration'}
                  </p>
                </div>
              </div>
              <Button
                variant='ghost'
                size='icon'
                className='text-muted-foreground hover:text-foreground hover:bg-muted/60 size-9 rounded-full'
                onClick={handleClose}
              >
                <X className='size-5' />
              </Button>
            </div>
            <div className='from-border h-px bg-linear-to-r to-transparent' />
          </div>

          <ScrollArea className='min-h-0 flex-1'>
            <div className='flex flex-col gap-8 px-8 py-6'>
              <div className='grid grid-cols-1 gap-8 lg:grid-cols-[400px_1fr]'>
                <div className='flex flex-col gap-4'>
                  <div className='group relative'>
                    {photos?.length ? (
                      <div className='bg-muted/40 relative aspect-square w-full overflow-hidden rounded-2xl ring-1 ring-black/5'>
                        <img
                          src={photos[photoIndex]}
                          alt={displayName}
                          className='size-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.02]'
                        />
                        {photos.length > 1 && (
                          <>
                            <button
                              type='button'
                              className='absolute top-1/2 left-4 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg ring-1 ring-black/5 backdrop-blur-sm transition-all hover:scale-105 hover:bg-white disabled:pointer-events-none disabled:opacity-0'
                              disabled={photoIndex === 0}
                              onClick={() => setPhotoIndex((i) => i - 1)}
                            >
                              <ChevronLeft className='size-5' />
                            </button>
                            <button
                              type='button'
                              className='absolute top-1/2 right-4 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg ring-1 ring-black/5 backdrop-blur-sm transition-all hover:scale-105 hover:bg-white disabled:pointer-events-none disabled:opacity-0'
                              disabled={photoIndex === photos.length - 1}
                              onClick={() => setPhotoIndex((i) => i + 1)}
                            >
                              <ChevronRight className='size-5' />
                            </button>
                            {/* Photo counter pill */}
                            <div className='absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm'>
                              {photoIndex + 1} / {photos.length}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className='bg-muted flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-2xl ring-1 ring-black/5'>
                        <ImageIcon className='size-16 text-gray-400 dark:text-gray-500' />
                        <span className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                          No images available
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail strip */}
                  {photos && photos.length > 1 && (
                    <div className='flex gap-2 overflow-x-auto pb-1'>
                      {photos.map((photo, i) => (
                        <button
                          key={i}
                          type='button'
                          className={cn(
                            'relative size-16 shrink-0 overflow-hidden rounded-xl ring-2 transition-all duration-200',
                            i === photoIndex
                              ? 'ring-primary scale-105 shadow-md'
                              : 'hover:ring-primary/40 ring-transparent'
                          )}
                          onClick={() => setPhotoIndex(i)}
                        >
                          <img
                            src={photo}
                            alt={`${displayName} - ${i + 1}`}
                            className='size-full object-cover'
                          />
                          {i === photoIndex && (
                            <div className='from-primary/20 absolute inset-0 bg-linear-to-t to-transparent' />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Title, Price, Quantity only */}
                <div className='flex min-w-0 flex-col gap-6'>
                  {/* Title */}
                  <h1 className='text-2xl leading-tight font-bold tracking-tight wrap-break-word lg:text-3xl'>
                    {displayName}
                  </h1>

                  {/* Price */}
                  {configLoading ? (
                    <div className='space-y-3'>
                      <Skeleton className='h-10 w-40' />
                      <Skeleton className='h-5 w-24' />
                    </div>
                  ) : (
                    (hasConfigs || !hasMultipleUnits) && (
                      <div className='flex items-baseline gap-3'>
                        <span
                          className={cn(
                            'text-3xl font-bold tracking-tight lg:text-4xl',
                            hasDiscount && 'text-emerald-600 dark:text-emerald-400'
                          )}
                        >
                          {formatCurrency(priceDisplay)}
                        </span>
                        {hasDiscount && (
                          <span className='text-muted-foreground text-lg line-through decoration-2'>
                            {formatCurrency(oldPriceDisplay)}
                          </span>
                        )}
                        {hasDiscount && (
                          <span className='rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'>
                            Save {Math.round((1 - priceDisplay / oldPriceDisplay) * 100)}%
                          </span>
                        )}
                      </div>
                    )
                  )}

                  {/* Quantity */}
                  {!configLoading && (
                    <div className='space-y-3'>
                      <label className='text-sm font-semibold tracking-wide uppercase'>
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

              {/* Bottom section: Units, Specifications, Configurations */}
              {!configLoading && (
                <>
                  {/* Units selection */}
                  {hasMultipleUnits && units && (
                    <div className='space-y-3'>
                      <label className='text-sm font-semibold tracking-wide uppercase'>
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
                                'group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm ring-1 transition-all duration-200',
                                isSelected
                                  ? 'bg-primary text-primary-foreground ring-primary shadow-md'
                                  : 'bg-card ring-border hover:ring-primary/50 hover:shadow-sm'
                              )}
                              onClick={() => setSelectedUnit(u.unit)}
                            >
                              <span className='font-bold'>{u.unit}</span>
                              <span
                                className={cn(
                                  'font-medium',
                                  isSelected ? 'opacity-90' : 'text-muted-foreground'
                                )}
                              >
                                {formatCurrency(u.price)}
                              </span>
                              {u.multiplier !== '1.0000' && (
                                <span
                                  className={cn(
                                    'rounded-md px-1.5 py-0.5 text-xs font-medium',
                                    isSelected ? 'bg-white/20' : 'bg-muted'
                                  )}
                                >
                                  ×{parseFloat(u.multiplier)}
                                </span>
                              )}
                              {isSelected && <Check className='ml-1 size-4' />}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Specifications */}
                  {specs.length > 0 && (
                    <div className='space-y-3'>
                      <label className='text-sm font-semibold tracking-wide uppercase'>
                        Specifications
                      </label>
                      <div className='bg-muted/30 divide-border divide-y rounded-xl ring-1 ring-black/5'>
                        {specs.map((spec) => (
                          <div
                            key={spec.descr}
                            className='flex gap-4 px-4 py-3'
                          >
                            <span className='w-2/5 shrink-0 text-sm font-medium wrap-break-word'>
                              {spec.descr}
                            </span>
                            <span className='text-muted-foreground text-sm wrap-break-word'>
                              {spec.info}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Configurations section */}
              {!configLoading && hasConfigs && (
                <div className='space-y-5'>
                  {/* Section header */}
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <div className='bg-primary/10 flex size-9 items-center justify-center rounded-lg'>
                        <Sparkles className='text-primary size-4' />
                      </div>
                      <div>
                        <h3 className='font-semibold'>Configurations</h3>
                        <p className='text-muted-foreground text-sm'>
                          {selectedConfigCount} of {totalConfigCount} selected
                        </p>
                      </div>
                    </div>
                    {hasUncheckedRequired && (
                      <span className='text-destructive flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-sm font-medium dark:bg-red-950/40'>
                        <AlertCircle className='size-4' />
                        Required selections missing
                      </span>
                    )}
                  </div>

                  {/* Config tabs - pill style */}
                  <div className='bg-muted/50 flex flex-wrap gap-1 rounded-xl p-1.5 ring-1 ring-black/5'>
                    {configs.map((c) => {
                      const hasSelected = c.items.some((i) => i.active)
                      const isRequired = !c.allownone
                      const isActive = activeTab === c.name
                      return (
                        <button
                          key={c.name}
                          type='button'
                          className={cn(
                            'relative flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200',
                            isActive
                              ? 'bg-background text-foreground shadow-sm ring-1 ring-black/5'
                              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                          )}
                          onClick={() => setActiveTab(c.name)}
                        >
                          {hasSelected && (
                            <span
                              className={cn(
                                'flex size-5 items-center justify-center rounded-full text-white',
                                isActive ? 'bg-primary' : 'bg-primary/60'
                              )}
                            >
                              <Check className='size-3' />
                            </span>
                          )}
                          <span>{c.name}</span>
                          {isRequired && !hasSelected && (
                            <span className='text-destructive ml-0.5'>*</span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Config items grid */}
                  {configs.map((c) => (
                    <div
                      key={c.name}
                      className={cn(
                        'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
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
                              'group relative flex flex-col overflow-hidden rounded-xl ring-2 transition-all duration-200',
                              isSelected
                                ? 'ring-primary shadow-primary/10 shadow-lg'
                                : 'ring-border hover:ring-primary/40 hover:shadow-md'
                            )}
                            onClick={() => handleSelectConfigItem(c.name, item.id)}
                          >
                            {/* Image */}
                            <div
                              className={cn(
                                'relative aspect-square transition-colors duration-200',
                                isSelected ? 'bg-primary/5' : 'bg-muted/40'
                              )}
                            >
                              {c.photosLoading ? (
                                <div className='flex size-full items-center justify-center'>
                                  <Spinner className='text-muted-foreground size-6' />
                                </div>
                              ) : item.photos?.length ? (
                                <img
                                  src={item.photos[0]}
                                  alt={item.descr_1}
                                  className='size-full object-contain p-2 transition-transform duration-300 group-hover:scale-105'
                                />
                              ) : (
                                <div className='flex size-full items-center justify-center'>
                                  <ImageIcon className='size-10 text-gray-400 dark:text-gray-500' />
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className='bg-card flex flex-1 flex-col gap-1 p-3'>
                              <span className='text-muted-foreground line-clamp-2 text-left text-xs leading-relaxed wrap-break-word'>
                                {item.descr_1}
                              </span>
                              <span
                                className={cn(
                                  'mt-auto text-left text-sm font-bold',
                                  isSelected && 'text-primary'
                                )}
                              >
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

          {/* Footer with summary */}
          <div className='shrink-0 border-t'>
            <div className='flex items-center justify-between gap-6 px-8 py-5'>
              {/* Price summary */}
              <div className='flex items-center gap-6'>
                <div className='space-y-0.5'>
                  <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                    Total
                  </p>
                  <p className='text-2xl font-bold tracking-tight'>
                    {formatCurrency(priceDisplay * quantity)}
                  </p>
                </div>
                {quantity > 1 && (
                  <div className='text-muted-foreground border-l pl-6 text-sm'>
                    {formatCurrency(priceDisplay)} × {quantity}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className='flex items-center gap-3'>
                <Button
                  variant='outline'
                  size='lg'
                  className='px-6'
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button
                  size='lg'
                  className='min-w-[140px] px-8'
                  disabled={
                    hasUncheckedRequired ||
                    configLoading ||
                    saving ||
                    (!ignoreCount && maxCount <= 0)
                  }
                  onClick={handleSave}
                >
                  {saving ? (
                    <>
                      <Spinner className='mr-2 size-4' />
                      Saving...
                    </>
                  ) : mode === 'add' ? (
                    'Add to Cart'
                  ) : (
                    'Update Cart'
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
