import { useEffect, useState } from 'react'
import { AlertCircle, ChevronLeft, ChevronRight, Image } from 'lucide-react'

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
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { NumberInput } from '@/components/ui/number-input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { formatCurrency } from '@/helpers/formatters'
import { getErrorMessage } from '@/helpers/error'
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
  onSaved,
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
      })
      return
    }
    const cloned = configData.configurations.map((c) => ({
      ...c,
      items: c.items.map((item) => ({ ...item })),
      photosRequested: false,
      photosLoading: false,
    }))
    cloned.forEach((config) => {
      const hasActive = config.items.some((i) => i.active)
      if (!hasActive && config.default) {
        const def = config.items.find((i) => i.id === config.default)
        if (def) def.active = true
      }
    })
    const ids = new Set<string | number>()
    cloned.forEach((c) => c.items.forEach((i) => { if (i.active) ids.add(i.id) }))
    queueMicrotask(() => {
      setConfigs(cloned)
      setActiveTab(cloned[0]?.name ?? '')
      setInitialConfigIds(ids)
    })
  }, [configData])

  useEffect(() => {
    if (!activeTab || !configs.length || !product) return
    const config = configs.find((c) => c.name === activeTab)
    if (!config || config.photosRequested || !config.id) return

    let cancelled = false
    const fetchPhotos = async () => {
      try {
        const photos = await productService.getConfigurationPhotos({
          configuration_id: config.id,
          category_name: activeTab,
          project_id: projectId ?? undefined,
        })
        if (cancelled) return
        const photosMap = new Map(photos.map((p) => [p.id, p.photos]))
        setConfigs((prev) =>
          prev.map((c) => {
            if (c.name !== activeTab) return c
            return {
              ...c,
              photosLoading: false,
              items: c.items.map((item) => ({
                ...item,
                photos: photosMap.get(item.id) ?? item.photos,
              })),
            }
          })
        )
      } catch {
        if (cancelled) return
        setConfigs((prev) =>
          prev.map((c) => (c.name === activeTab ? { ...c, photosLoading: false } : c))
        )
      }
    }

    queueMicrotask(() => {
      setConfigs((prev) =>
        prev.map((c) =>
          c.name === activeTab ? { ...c, photosRequested: true, photosLoading: true } : c
        )
      )
      fetchPhotos()
    })

    return () => { cancelled = true }
  }, [activeTab, configs, product, projectId])

  const displayName = product
    ? isCartItem(product) ? product.name : product.descr_1
    : ''

  const photos = product?.photos as string[] | undefined
  const specs = product && !isCartItem(product)
    ? (product.product_specs as Array<{ descr: string; info: string }>) ?? []
    : []

  const units = (product && !isCartItem(product) ? product.units : undefined) as
    Array<{ autoid: string; unit: string; multiplier: string; price: string; old_price: string }> | undefined
  const hasMultipleUnits = (units?.length ?? 0) > 1

  const maxCount = (() => {
    const v = product?.max_count
    if (typeof v === 'number') return v
    if (typeof v === 'string') return parseInt(v) || 9999
    return 9999
  })()

  const ignoreCount = product
    ? isCartItem(product) ? product.ignore_count : product.ignoreCount
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

  const hasUncheckedRequired = configs.some(
    (c) => !c.allownone && !c.items.some((i) => i.active)
  )

  const totalPrice = (() => {
    let total = Number(configData?.base_price) || 0
    configs.forEach((c) => c.items.forEach((i) => { if (i.active) total += Number(i.price) || 0 }))
    return total
  })()

  const totalOldPrice = (() => {
    let total = Number(configData?.base_old_price) || 0
    configs.forEach((c) => c.items.forEach((i) => { if (i.active) total += Number(i.old_price) || 0 }))
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
            active: i.id === itemId ? !i.active : false,
          })),
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
              : undefined,
        }
      : null
    const editPayload: UpdateCartItemPayload | null = !isAdd
      ? {
          quantity,
          configurations: activeConfigurations as UpdateCartItemPayload['configurations'],
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

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v ? handleClose() : onOpenChange(v)}>
        <DialogContent className='flex h-[90vh] w-[90vw] max-w-[90vw]! flex-col gap-0 overflow-hidden p-0'>
          <DialogHeader className='shrink-0 border-b px-6 py-4'>
            <DialogTitle>Product configuration</DialogTitle>
          </DialogHeader>

          <ScrollArea className='min-h-0 flex-1'>
            <div className='flex flex-col gap-6 px-6 py-4'>
              {/* Top section: Image + Product Info side by side */}
              <div className='grid grid-cols-1 gap-6 md:grid-cols-[minmax(300px,400px),1fr]'>
                {/* Left: Photo Gallery (bigger) */}
                <div className='flex flex-col gap-3'>
                  {photos?.length ? (
                    <>
                      <div className='bg-muted relative aspect-square w-full overflow-hidden rounded-lg'>
                        <img src={photos[photoIndex]} alt={displayName} className='size-full object-contain' />
                        {photos.length > 1 && (
                          <>
                            <button
                              type='button'
                              className='absolute left-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-sm transition-opacity hover:bg-white disabled:opacity-0'
                              disabled={photoIndex === 0}
                              onClick={() => setPhotoIndex((i) => i - 1)}
                            >
                              <ChevronLeft className='size-5' />
                            </button>
                            <button
                              type='button'
                              className='absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-sm transition-opacity hover:bg-white disabled:opacity-0'
                              disabled={photoIndex === photos.length - 1}
                              onClick={() => setPhotoIndex((i) => i + 1)}
                            >
                              <ChevronRight className='size-5' />
                            </button>
                          </>
                        )}
                      </div>
                      {photos.length > 1 && (
                        <div className='flex flex-wrap gap-2'>
                          {photos.map((photo, i) => (
                            <button
                              key={i}
                              type='button'
                              className={cn(
                                'size-16 overflow-hidden rounded-lg border-2 transition-colors',
                                i === photoIndex ? 'border-primary' : 'border-transparent hover:border-primary/30'
                              )}
                              onClick={() => setPhotoIndex(i)}
                            >
                              <img src={photo} alt={`${displayName} - ${i + 1}`} className='size-full object-cover' />
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className='bg-muted text-muted-foreground flex aspect-square w-full items-center justify-center rounded-lg'>
                      <div className='flex flex-col items-center gap-2'>
                        <Image className='size-16 opacity-40' />
                        <span className='text-sm'>No photos available</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Name, price, quantity, specs */}
                <div className='flex min-w-0 flex-col gap-5'>
                  <h2 className='wrap-break-word text-2xl font-semibold'>{displayName}</h2>

                  {configLoading ? (
                    <div className='space-y-4'>
                      <Skeleton className='h-8 w-32' />
                      <Skeleton className='h-5 w-20' />
                      <Skeleton className='h-10 w-32' />
                    </div>
                  ) : (
                    <>
                      {/* Price */}
                      {(hasConfigs || !hasMultipleUnits) && (
                        <div className='flex items-center gap-3 text-2xl font-semibold'>
                          {hasDiscount && (
                            <span className='text-muted-foreground text-lg line-through'>
                              {formatCurrency(oldPriceDisplay)}
                            </span>
                          )}
                          <span className={hasDiscount ? 'text-green-600' : ''}>
                            {formatCurrency(priceDisplay)}
                          </span>
                        </div>
                      )}

                      {/* Units */}
                      {hasMultipleUnits && units && (
                        <div className='space-y-1.5'>
                          <h3 className='text-muted-foreground text-sm'>Unit of Measure</h3>
                          <div className='flex flex-wrap gap-2'>
                            {units.map((u) => (
                              <button
                                key={u.autoid}
                                type='button'
                                className={cn(
                                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                                  selectedUnit === u.unit ? 'border-foreground bg-muted' : 'border-input hover:border-foreground/40'
                                )}
                                onClick={() => setSelectedUnit(u.unit)}
                              >
                                <span className='font-semibold'>{u.unit}</span>
                                <span className='text-muted-foreground'>{formatCurrency(u.price)}</span>
                                {u.multiplier !== '1.0000' && (
                                  <span className='text-muted-foreground text-xs'>x{parseFloat(u.multiplier)}</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quantity */}
                      <div className='space-y-1.5'>
                        <h3 className='text-muted-foreground text-sm'>Quantity</h3>
                        <NumberInput
                          value={quantity}
                          onChange={setQuantity}
                          min={1}
                          max={ignoreCount ? undefined : maxCount}
                          disabled={!ignoreCount && maxCount <= 0}
                          showMaxMessage
                        />
                      </div>

                      {/* Specs */}
                      {specs.length > 0 && (
                        <div className='space-y-1.5'>
                          <h3 className='text-muted-foreground text-sm'>Specifications</h3>
                          <table className='w-full table-fixed text-sm'>
                            <tbody>
                              {specs.map((spec) => (
                                <tr key={spec.descr} className='border-b last:border-b-0'>
                                  <td className='w-2/5 wrap-break-word py-1.5 pr-4 align-top font-medium'>{spec.descr}</td>
                                  <td className='text-muted-foreground wrap-break-word py-1.5 align-top'>{spec.info}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Bottom section: Configurations (full width) */}
              {!configLoading && hasConfigs && (
                <div className='space-y-3'>
                  <h3 className='text-muted-foreground text-sm'>Configurations</h3>
                  {/* Tabs */}
                  <div className='flex flex-wrap gap-2'>
                    {configs.map((c) => {
                      const hasSelected = c.items.some((i) => i.active)
                      const isRequired = !c.allownone
                      return (
                        <button
                          key={c.name}
                          type='button'
                          className={cn(
                            'rounded-lg border px-3 py-2 text-sm font-semibold transition-colors',
                            activeTab === c.name
                              ? 'bg-foreground text-background border-foreground'
                              : hasSelected
                                ? 'bg-muted border-foreground'
                                : 'border-input hover:border-foreground/40'
                          )}
                          onClick={() => setActiveTab(c.name)}
                        >
                          {c.name}
                          {isRequired && <span className={cn('ml-1', hasSelected ? 'text-destructive' : 'text-destructive/40')}>*</span>}
                        </button>
                      )
                    })}
                  </div>
                  {/* Items */}
                  {configs.map((c) => (
                    <div
                      key={c.name}
                      className={cn('grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8', activeTab !== c.name && 'hidden')}
                    >
                      {c.items.map((item) => (
                        <button
                          key={item.id}
                          type='button'
                          className={cn(
                            'bg-muted flex flex-col overflow-hidden rounded-lg border-2 transition-colors',
                            item.active ? 'border-primary' : 'border-transparent hover:border-primary/30'
                          )}
                          onClick={() => handleSelectConfigItem(c.name, item.id)}
                        >
                          <div className='bg-background aspect-square'>
                            {c.photosLoading ? (
                              <div className='flex size-full items-center justify-center'>
                                <Spinner className='text-muted-foreground size-6' />
                              </div>
                            ) : item.photos?.length ? (
                              <img src={item.photos[0]} alt={item.descr_1} className='size-full object-contain' />
                            ) : (
                              <div className='text-muted-foreground/40 flex size-full items-center justify-center'>
                                <Image className='size-8' />
                              </div>
                            )}
                          </div>
                          <div className='min-w-0 p-2'>
                            <span className='text-muted-foreground line-clamp-2 wrap-break-word text-xs'>{item.descr_1}</span>
                            <span className='mt-1 block text-sm font-semibold'>+{formatCurrency(item.price)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className='mx-0 mb-0 shrink-0 rounded-b-xl border-t px-6 py-4'>
            {hasUncheckedRequired && !configLoading && (
              <span className='text-destructive mr-auto flex items-center gap-1.5 text-sm'>
                <AlertCircle className='size-4' />
                Select all required configurations
              </span>
            )}
            <Button variant='outline' onClick={handleClose}>Cancel</Button>
            <Button
              disabled={hasUncheckedRequired || configLoading || saving || (!ignoreCount && maxCount <= 0)}
              onClick={handleSave}
            >
              {saving && <Spinner className='mr-2 size-4' />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to close without saving? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={() => {
                setConfirmClose(false)
                onOpenChange(false)
              }}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
