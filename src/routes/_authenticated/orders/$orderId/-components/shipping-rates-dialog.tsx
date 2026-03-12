import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Box, Check, ChevronDown, ChevronRight, GripVertical, Loader2, MapPin, Package, Plus, Trash2, Truck, Warehouse } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { Order, OrderItem, OrderPatchPayload, ShippingPackagePayload, ShippingRate, ShippingRatesResponse } from '@/api/order/schema'
import { orderService } from '@/api/order/service'
import { getShippingAddressesQuery } from '@/api/shipping-address/query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { getErrorMessage } from '@/helpers/error'
import { useProjectId } from '@/hooks/use-project-id'
import { cn } from '@/lib/utils'

type Step = 'configure' | 'rates'

interface LocalPackage {
  id: string
  items: string[] // item autoids
  weight: number
  length: number
  width: number
  height: number
}

interface ShipToAddress {
  c_name: string
  c_address1: string
  c_address2: string
  c_city: string
  c_state: string
  c_zip: string
}

interface ShippingRatesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderAutoid: string
  items: OrderItem[]
  order: Order
  onPatch: (payload: OrderPatchPayload) => void
}

export function ShippingRatesDialog({
  open,
  onOpenChange,
  orderAutoid,
  items,
  order,
}: ShippingRatesDialogProps) {
  const [projectId] = useProjectId()
  const [step, setStep] = useState<Step>('configure')
  const [packages, setPackages] = useState<LocalPackage[]>([])
  const [loading, setLoading] = useState(false)
  const [ratesData, setRatesData] = useState<ShippingRatesResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragItem, setDragItem] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [address, setAddress] = useState<ShipToAddress>({
    c_name: '', c_address1: '', c_address2: '', c_city: '', c_state: '', c_zip: '',
  })
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [addressPopoverOpen, setAddressPopoverOpen] = useState(false)

  const { data: shippingAddresses = [] } = useQuery(getShippingAddressesQuery(projectId))

  const selectedAddress = useMemo(
    () => shippingAddresses.find((a) => a.id === selectedAddressId) ?? null,
    [shippingAddresses, selectedAddressId],
  )

  // Initialize: picked items go into a default package, load address from order
  const handleOpenChange = (next: boolean) => {
    if (next) {
      const pickedIds = items.filter((i) => i.is_picked).map((i) => i.autoid)
      setPackages([
        { id: `pkg-${Date.now()}`, items: pickedIds, weight: 0, length: 0, width: 0, height: 0 },
      ])
      setAddress({
        c_name: order.c_name ?? '',
        c_address1: order.c_address1 ?? '',
        c_address2: order.c_address2 ?? '',
        c_city: order.c_city ?? '',
        c_state: order.c_state ?? '',
        c_zip: order.c_zip ?? '',
      })
      // Auto-select default shipping address (ship from)
      const defaultAddr = shippingAddresses.find((a) => a.is_default)
      setSelectedAddressId(defaultAddr?.id ?? null)
      setRatesData(null)
      setError(null)
      setStep('configure')
    }
    onOpenChange(next)
  }

  const hasAddress = address.c_address1.trim() || address.c_city.trim()

  const itemMap = useMemo(() => {
    const map = new Map<string, OrderItem>()
    for (const item of items) map.set(item.autoid, item)
    return map
  }, [items])

  // Which package each item belongs to
  const itemPackageMap = useMemo(() => {
    const map = new Map<string, string>() // item autoid -> package id
    for (const pkg of packages) {
      for (const id of pkg.items) map.set(id, pkg.id)
    }
    return map
  }, [packages])

  const unassignedItems = useMemo(
    () => items.filter((i) => !itemPackageMap.has(i.autoid)),
    [items, itemPackageMap]
  )

  // ── Package management ──

  const addPackage = () => {
    setPackages((prev) => [
      ...prev,
      { id: `pkg-${Date.now()}`, items: [], weight: 0, length: 0, width: 0, height: 0 },
    ])
  }

  const removePackage = (pkgId: string) => {
    setPackages((prev) => prev.filter((p) => p.id !== pkgId))
  }

  const updatePackageDimension = (pkgId: string, field: 'weight' | 'length' | 'width' | 'height', value: number) => {
    setPackages((prev) =>
      prev.map((p) => (p.id === pkgId ? { ...p, [field]: value } : p))
    )
  }

  // Move item to a package (removing from any other)
  const moveItemToPackage = useCallback((itemAutoid: string, targetPkgId: string) => {
    setPackages((prev) =>
      prev.map((p) => {
        const without = p.items.filter((id) => id !== itemAutoid)
        if (p.id === targetPkgId) {
          // Add to target if not already there
          return p.items.includes(itemAutoid) ? p : { ...p, items: [...p.items, itemAutoid] }
        }
        return { ...p, items: without }
      })
    )
  }, [])

  // Remove item from its package (back to unassigned)
  const unassignItem = useCallback((itemAutoid: string) => {
    setPackages((prev) =>
      prev.map((p) => ({
        ...p,
        items: p.items.filter((id) => id !== itemAutoid),
      }))
    )
  }, [])

  // ── Drag and drop ──

  const handleDragStart = (itemAutoid: string) => {
    setDragItem(itemAutoid)
  }

  const handleDragEnd = () => {
    setDragItem(null)
    setDropTarget(null)
  }

  const handleDragOverPackage = (e: React.DragEvent, pkgId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTarget(pkgId)
  }

  const handleDragLeavePackage = () => {
    setDropTarget(null)
  }

  const handleDropOnPackage = (e: React.DragEvent, pkgId: string) => {
    e.preventDefault()
    if (dragItem) {
      moveItemToPackage(dragItem, pkgId)
    }
    setDragItem(null)
    setDropTarget(null)
  }

  // ── Validation ──

  const MIN_DIMENSION = 0.01

  const validatePackages = (): boolean => {
    const errors: string[] = []

    if (!selectedAddressId) {
      errors.push('Please select a shipping address.')
    }

    const emptyPkgs = packages.filter((p) => p.items.length === 0)
    if (emptyPkgs.length > 0) {
      errors.push('Remove empty packages or assign items to them.')
    }

    for (let i = 0; i < packages.length; i++) {
      const pkg = packages[i]
      const label = `Package ${i + 1}`
      if (pkg.length < MIN_DIMENSION) errors.push(`${label}: Length must be at least ${MIN_DIMENSION}.`)
      if (pkg.width < MIN_DIMENSION) errors.push(`${label}: Width must be at least ${MIN_DIMENSION}.`)
      if (pkg.height < MIN_DIMENSION) errors.push(`${label}: Height must be at least ${MIN_DIMENSION}.`)
    }

    if (errors.length > 0) {
      errors.forEach((msg) => toast.warning(msg))
      return false
    }
    return true
  }

  // ── Get rates ──

  const getShippingRates = async () => {
    if (!validatePackages()) return

    setLoading(true)
    setError(null)

    const payload: ShippingPackagePayload[] = packages.map((p) => ({
      items: p.items,
      weight: p.weight,
      length: p.length,
      width: p.width,
      height: p.height,
    }))

    try {
      const res = await orderService.getShippingRates(orderAutoid, {
        shipping_address_id: selectedAddressId!,
        packages: payload,
      })
      setRatesData(res)
      setStep('rates')
    } catch (err) {
      setError(getErrorMessage(err))
      toast.error('Failed to fetch shipping rates')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-w-[960px] sm:max-w-[960px] gap-0 p-0'>
        <DialogHeader className='border-b border-border px-5 py-3'>
          <div className='flex items-center gap-3'>
            <DialogTitle className='flex items-center gap-2 text-[14px]'>
              <Truck className='size-4 text-text-tertiary' />
              Manage Shipping
            </DialogTitle>

            {/* Steps indicator */}
            <div className='flex items-center gap-1'>
              {(['configure', 'rates'] as const).map((s, i) => (
                <span key={s} className='flex items-center gap-1'>
                  {i > 0 && <ChevronRight className='size-3 text-text-quaternary' />}
                  <button
                    type='button'
                    className={cn(
                      'rounded-[4px] px-2 py-0.5 text-[12px] font-medium transition-colors',
                      step === s
                        ? 'bg-primary/10 text-primary'
                        : s === 'rates' && !ratesData
                          ? 'text-text-quaternary'
                          : 'text-text-tertiary hover:text-text-secondary',
                    )}
                    onClick={() => {
                      if (s === 'configure') setStep('configure')
                      else if (s === 'rates' && ratesData) setStep('rates')
                    }}
                    disabled={s === 'rates' && !ratesData}
                  >
                    {s === 'configure' ? 'Configure' : 'Rates'}
                  </button>
                </span>
              ))}
            </div>
          </div>
        </DialogHeader>

        {step === 'configure' ? (
          <>
            {/* Ship from → Ship to */}
            <div className='flex items-stretch border-b border-border'>
              {/* Ship from */}
              <div className='flex min-w-0 flex-1 flex-col px-5 py-3'>
                <div className='mb-2 flex items-center gap-1.5'>
                  <Warehouse className='size-3.5 text-text-tertiary' />
                  <span className='text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary'>Ship from</span>
                </div>
                <Popover open={addressPopoverOpen} onOpenChange={setAddressPopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type='button'
                      className={cn(
                        'flex h-auto w-full items-center gap-2.5 rounded-[6px] border px-3 py-2 text-left transition-colors duration-75',
                        selectedAddress
                          ? 'border-border bg-background hover:bg-bg-hover'
                          : 'border-dashed border-border hover:border-border-heavy hover:bg-bg-hover',
                      )}
                    >
                      {selectedAddress ? (
                        <div className='min-w-0 flex-1'>
                          <div className='flex items-center gap-1.5'>
                            <span className='text-[13px] font-medium text-foreground'>{selectedAddress.title}</span>
                            {selectedAddress.is_default && (
                              <span className='rounded bg-primary/10 px-1 py-px text-[10px] font-semibold text-primary'>Default</span>
                            )}
                          </div>
                          <p className='mt-0.5 truncate text-[12px] leading-snug text-text-tertiary'>
                            {[selectedAddress.address_line1, selectedAddress.city, selectedAddress.state, selectedAddress.postal_code].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      ) : (
                        <div className='min-w-0 flex-1'>
                          <span className='text-[13px] text-text-quaternary'>Select origin address…</span>
                        </div>
                      )}
                      <ChevronDown className='size-3.5 shrink-0 text-text-quaternary' />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align='start' className='w-[var(--radix-popover-trigger-width)] gap-0 p-1'>
                    {shippingAddresses.length === 0 ? (
                      <div className='px-3 py-4 text-center text-[13px] text-text-tertiary'>
                        No shipping addresses configured
                      </div>
                    ) : (
                      shippingAddresses.map((addr) => {
                        const isSelected = addr.id === selectedAddressId
                        return (
                          <button
                            key={addr.id}
                            type='button'
                            className={cn(
                              'flex w-full items-center gap-2.5 rounded-[5px] px-2.5 py-2 text-left transition-colors duration-75',
                              isSelected ? 'bg-primary/[0.08]' : 'hover:bg-bg-hover',
                            )}
                            onClick={() => {
                              setSelectedAddressId(addr.id)
                              setAddressPopoverOpen(false)
                            }}
                          >
                            <div className='min-w-0 flex-1'>
                              <div className='flex items-center gap-1.5'>
                                <span className={cn('text-[13px] font-medium', isSelected ? 'text-primary' : 'text-foreground')}>
                                  {addr.title}
                                </span>
                                {addr.is_default && (
                                  <span className='rounded bg-primary/10 px-1 py-px text-[10px] font-semibold text-primary'>Default</span>
                                )}
                              </div>
                              <p className='mt-0.5 text-[12px] leading-snug text-text-tertiary'>
                                {[addr.address_line1, addr.city, addr.state, addr.postal_code].filter(Boolean).join(', ')}
                              </p>
                            </div>
                            {isSelected && <Check className='size-3.5 shrink-0 text-primary' />}
                          </button>
                        )
                      })
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              {/* Arrow separator */}
              <div className='flex items-center px-1'>
                <div className='flex size-7 items-center justify-center rounded-full border border-border bg-bg-secondary'>
                  <ArrowRight className='size-3.5 text-text-tertiary' />
                </div>
              </div>

              {/* Ship to */}
              <div className='flex min-w-0 flex-1 flex-col px-5 py-3'>
                <div className='mb-2 flex items-center gap-1.5'>
                  <MapPin className='size-3.5 text-text-tertiary' />
                  <span className='text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary'>Ship to</span>
                </div>
                <div
                  className={cn(
                    'flex h-auto min-h-[44px] w-full items-center rounded-[6px] border px-3 py-2',
                    hasAddress ? 'border-border bg-background' : 'border-dashed border-border',
                  )}
                >
                  {hasAddress ? (
                    <div className='min-w-0 flex-1'>
                      {address.c_name && (
                        <div className='text-[13px] font-medium text-foreground'>{address.c_name}</div>
                      )}
                      <p className='text-[12px] leading-snug text-text-tertiary'>
                        {[address.c_address1, address.c_address2].filter(Boolean).join(', ')}
                        {(address.c_city || address.c_state || address.c_zip) && (
                          <>{address.c_address1 ? ', ' : ''}{[address.c_city, address.c_state, address.c_zip].filter(Boolean).join(', ')}</>
                        )}
                      </p>
                    </div>
                  ) : (
                    <span className='text-[13px] text-text-quaternary'>No ship-to address on order</span>
                  )}
                </div>
              </div>
            </div>

            {/* Two-panel layout */}
            <div className='flex min-h-[480px] max-h-[70vh]'>
              {/* Left: Packages */}
              <div className='flex w-[380px] shrink-0 flex-col border-r border-border'>
                <div className='flex items-center justify-between border-b border-border bg-bg-secondary/60 px-4 py-2'>
                  <span className='text-[12px] font-semibold uppercase tracking-[0.06em] text-text-tertiary'>
                    Packages ({packages.length})
                  </span>
                  <button
                    type='button'
                    className='inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[12px] font-medium text-text-tertiary transition-colors hover:bg-bg-hover hover:text-text-secondary'
                    onClick={addPackage}
                  >
                    <Plus className='size-3' />
                    Add
                  </button>
                </div>

                <div className='flex-1 overflow-y-auto p-3 space-y-2'>
                  {packages.length === 0 ? (
                    <div className='flex flex-col items-center justify-center py-12 text-center'>
                      <Package className='mb-2 size-6 text-text-quaternary' />
                      <p className='text-[13px] text-text-tertiary'>No packages yet</p>
                      <button
                        type='button'
                        className='mt-2 text-[12px] font-medium text-primary hover:underline'
                        onClick={addPackage}
                      >
                        Create a package
                      </button>
                    </div>
                  ) : (
                    packages.map((pkg, i) => (
                      <PackageCard
                        key={pkg.id}
                        pkg={pkg}
                        index={i}
                        itemMap={itemMap}
                        isDragOver={dropTarget === pkg.id}
                        onRemove={() => removePackage(pkg.id)}
                        onUpdateDimension={(field, value) => updatePackageDimension(pkg.id, field, value)}
                        onUnassignItem={unassignItem}
                        onDragOver={(e) => handleDragOverPackage(e, pkg.id)}
                        onDragLeave={handleDragLeavePackage}
                        onDrop={(e) => handleDropOnPackage(e, pkg.id)}
                      />
                    ))
                  )}

                  {packages.length > 0 && (
                    <button
                      type='button'
                      className='flex w-full items-center justify-center gap-1.5 rounded-[6px] border border-dashed border-border py-2 text-[12px] font-medium text-text-tertiary transition-colors hover:border-border-heavy hover:bg-bg-hover hover:text-text-secondary'
                      onClick={addPackage}
                    >
                      <Plus className='size-3.5' />
                      Add Package
                    </button>
                  )}
                </div>
              </div>

              {/* Right: Items table */}
              <div className='flex min-w-0 flex-1 flex-col'>
                <div className='flex items-center gap-2 border-b border-border bg-bg-secondary/60 px-4 py-2'>
                  <span className='text-[12px] font-semibold uppercase tracking-[0.06em] text-text-tertiary'>
                    Items ({items.length})
                  </span>
                  {unassignedItems.length > 0 && (
                    <span className='rounded-full bg-amber-100 px-1.5 py-px text-[10px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'>
                      {unassignedItems.length} unassigned
                    </span>
                  )}
                </div>

                <div className='flex-1 overflow-y-auto'>
                  <table className='w-full text-[13px]'>
                    <thead className='sticky top-0 z-10 bg-bg-secondary/80 backdrop-blur-sm'>
                      <tr className='border-b border-border text-left'>
                        <th className='w-[28px] py-1.5 pl-2 pr-0'></th>
                        <th className='min-w-[90px] px-3 py-1.5 font-medium text-text-tertiary'>Inventory</th>
                        <th className='min-w-[120px] px-3 py-1.5 font-medium text-text-tertiary'>Description</th>
                        <th className='w-[50px] px-3 py-1.5 text-right font-medium text-text-tertiary'>Qty</th>
                        <th className='w-[70px] px-3 py-1.5 font-medium text-text-tertiary'>Status</th>
                        <th className='w-[80px] py-1.5 pl-3 pr-4 font-medium text-text-tertiary'>Package</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => {
                        const pkgId = itemPackageMap.get(item.autoid)
                        const pkgIndex = pkgId ? packages.findIndex((p) => p.id === pkgId) : -1
                        const isDragging = dragItem === item.autoid

                        return (
                          <tr
                            key={item.autoid}
                            draggable
                            onDragStart={() => handleDragStart(item.autoid)}
                            onDragEnd={handleDragEnd}
                            className={cn(
                              'border-b border-border-light transition-colors duration-75 cursor-grab active:cursor-grabbing',
                              isDragging ? 'opacity-40' : 'hover:bg-bg-hover',
                              pkgId && 'bg-primary/[0.02]',
                            )}
                          >
                            <td className='py-1.5 pl-2 pr-0'>
                              <GripVertical className='size-3.5 text-text-quaternary' />
                            </td>
                            <td className='px-3 py-1.5 font-medium text-foreground'>{item.inven || '—'}</td>
                            <td className='max-w-[200px] px-3 py-1.5 text-text-secondary'>
                              <span className='block truncate'>{item.descr || '—'}</span>
                            </td>
                            <td className='px-3 py-1.5 text-right tabular-nums text-text-secondary'>{item.quan}</td>
                            <td className='py-1.5 pl-3 pr-3'>
                              {item.is_picked ? (
                                <span className='inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600'>
                                  <Check className='size-3' /> Picked
                                </span>
                              ) : (
                                <span className='text-[11px] text-text-quaternary'>—</span>
                              )}
                            </td>
                            <td className='py-1.5 pl-3 pr-4'>
                              {pkgIndex >= 0 ? (
                                <span className='inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary'>
                                  <Package className='size-2.5' />
                                  {pkgIndex + 1}
                                </span>
                              ) : (
                                <span className='text-[11px] text-text-quaternary'>—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className='flex items-center justify-between border-t border-border px-5 py-3'>
              <div className='text-[12px] text-text-tertiary'>
                {packages.length} package(s) · {items.length - unassignedItems.length} of {items.length} items assigned
              </div>
              <button
                type='button'
                className='inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-primary px-3 text-[13px] font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-40'
                disabled={loading || packages.length === 0 || !selectedAddressId}
                onClick={getShippingRates}
              >
                {loading ? (
                  <>
                    <Loader2 className='size-3.5 animate-spin' />
                    Calculating…
                  </>
                ) : (
                  <>
                    Get Rates
                    <ChevronRight className='size-3.5' />
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Rates view */}
            <div className='max-h-[60vh] overflow-y-auto'>
              <RatesResultStep data={ratesData!} itemMap={itemMap} />
            </div>
            <div className='flex items-center justify-between border-t border-border px-5 py-3'>
              <div className='text-[12px] text-text-tertiary'>
                {ratesData?.rates.length ?? 0} rate(s) found
              </div>
              <button
                type='button'
                className='inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-border px-3 text-[13px] font-medium text-text-secondary transition-colors hover:bg-bg-hover'
                onClick={() => setStep('configure')}
              >
                Back to Packages
              </button>
            </div>
          </>
        )}

        {error && (
          <div className='border-t border-destructive/20 bg-destructive/5 px-5 py-2 text-[12px] text-destructive'>
            {error}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Package Card (left panel) ──

function PackageCard({
  pkg,
  index,
  itemMap,
  isDragOver,
  onRemove,
  onUpdateDimension,
  onUnassignItem,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  pkg: LocalPackage
  index: number
  itemMap: Map<string, OrderItem>
  isDragOver: boolean
  onRemove: () => void
  onUpdateDimension: (field: 'weight' | 'length' | 'width' | 'height', value: number) => void
  onUnassignItem: (autoid: string) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
}) {
  return (
    <div
      className={cn(
        'rounded-[6px] border transition-colors',
        isDragOver
          ? 'border-primary bg-primary/[0.04] ring-1 ring-primary/20'
          : 'border-border',
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Header */}
      <div className='flex items-center gap-2 border-b border-border-light px-3 py-2'>
        <Package className='size-3.5 text-text-tertiary' />
        <span className='text-[13px] font-semibold text-foreground'>Package {index + 1}</span>
        <span className='text-[12px] text-text-tertiary'>{pkg.items.length} item(s)</span>
        <div className='flex-1' />
        <button
          type='button'
          className='inline-flex size-5 items-center justify-center rounded-[3px] text-text-quaternary transition-colors hover:bg-bg-active hover:text-destructive'
          onClick={onRemove}
        >
          <Trash2 className='size-3' />
        </button>
      </div>

      {/* Dimensions */}
      <div className='grid grid-cols-4 gap-1.5 px-3 py-2'>
        {([
          ['weight', 'Weight'],
          ['length', 'Length'],
          ['width', 'Width'],
          ['height', 'Height'],
        ] as const).map(([field, label]) => {
          const needsMin = field !== 'weight'
          const isInvalid = needsMin && pkg[field] < 0.01
          return (
            <div key={field}>
              <label className='mb-0.5 block text-[10px] text-text-quaternary'>{label}{needsMin && ' *'}</label>
              <input
                type='number'
                min={needsMin ? 0.01 : 0}
                step={0.01}
                value={pkg[field] || ''}
                onChange={(e) => onUpdateDimension(field, Number(e.target.value) || 0)}
                className={cn(
                  'h-6 w-full rounded-[4px] border bg-background px-1.5 text-[12px] tabular-nums outline-none focus:ring-1',
                  isInvalid
                    ? 'border-destructive/50 focus:border-destructive focus:ring-destructive/30'
                    : 'border-border focus:border-ring focus:ring-ring/50',
                )}
                placeholder={needsMin ? '≥ 0.01' : '0'}
              />
              {isInvalid && (
                <span className='mt-0.5 block text-[9px] text-destructive'>Min 0.01</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Assigned items */}
      {pkg.items.length > 0 && (
        <div className='border-t border-border-light px-3 py-2'>
          <div className='space-y-0.5'>
            {pkg.items.map((autoid) => {
              const item = itemMap.get(autoid)
              if (!item) return null
              return (
                <div
                  key={autoid}
                  className='group/item flex items-center gap-1.5 rounded-[4px] px-1.5 py-0.5 transition-colors hover:bg-bg-hover'
                >
                  <span className='text-[12px] font-medium text-foreground'>{item.inven}</span>
                  <span className='min-w-0 truncate text-[11px] text-text-tertiary'>{item.descr}</span>
                  <div className='flex-1' />
                  <button
                    type='button'
                    className='hidden shrink-0 text-[10px] font-medium text-text-quaternary transition-colors hover:text-destructive group-hover/item:inline-flex'
                    onClick={() => onUnassignItem(autoid)}
                  >
                    Remove
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Drop zone hint */}
      {pkg.items.length === 0 && !isDragOver && (
        <div className='px-3 pb-2 text-center text-[11px] text-text-quaternary'>
          Drag items here
        </div>
      )}
      {isDragOver && (
        <div className='px-3 pb-2 text-center text-[11px] font-medium text-primary'>
          Drop to add item
        </div>
      )}
    </div>
  )
}

// ── Rates Result ──

function RatesResultStep({
  data,
  itemMap,
}: {
  data: ShippingRatesResponse
  itemMap: Map<string, OrderItem>
}) {
  return (
    <div>
      <div className='px-5 py-3'>
        <div className='mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary'>
          Available Rates
        </div>
        <div className='space-y-1.5'>
          {data.rates.length === 0 ? (
            <div className='py-4 text-center text-[13px] text-text-tertiary'>
              No shipping rates available
            </div>
          ) : (
            data.rates
              .slice()
              .sort((a, b) => a.cost - b.cost)
              .map((rate) => <RateCard key={`${rate.carrier_id}-${rate.service_id}`} rate={rate} />)
          )}
        </div>
      </div>

      {data.packages.length > 0 && (
        <div className='border-t border-border px-5 py-3'>
          <div className='mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary'>
            Packages ({data.packages.length})
          </div>
          <div className='space-y-2'>
            {data.packages.map((pkg, i) => (
              <div key={i} className='rounded-[6px] border border-border-light bg-bg-secondary/50 px-3 py-2'>
                <div className='flex items-center gap-2'>
                  <Package className='size-3.5 text-text-tertiary' />
                  <span className='text-[13px] font-medium text-foreground'>Package {i + 1}</span>
                  <span className='text-[12px] text-text-tertiary'>
                    {pkg.length} x {pkg.width} x {pkg.height} cm · {pkg.weight} kg
                  </span>
                </div>
                {pkg.items.length > 0 && (
                  <div className='mt-1.5 flex flex-wrap gap-1'>
                    {pkg.items.map((autoid) => {
                      const item = itemMap.get(autoid)
                      return (
                        <span
                          key={autoid}
                          className='rounded bg-bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-text-secondary'
                        >
                          {item?.inven || autoid.slice(0, 8)}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function RateCard({ rate }: { rate: ShippingRate }) {
  const isFree = rate.cost === 0
  return (
    <div className='flex items-center gap-3 rounded-[6px] border border-border px-3 py-2.5 transition-colors duration-75 hover:bg-bg-hover'>
      <Box className='size-4 shrink-0 text-text-tertiary' />
      <div className='min-w-0 flex-1'>
        <div className='text-[13px] font-medium text-foreground'>{rate.type}</div>
        <div className='text-[12px] text-text-tertiary'>{rate.service_id}</div>
      </div>
      <span
        className={cn(
          'shrink-0 text-[14px] font-semibold tabular-nums',
          isFree ? 'text-emerald-600' : 'text-foreground',
        )}
      >
        {isFree ? 'Free' : `$${rate.cost.toFixed(2)}`}
      </span>
    </div>
  )
}
