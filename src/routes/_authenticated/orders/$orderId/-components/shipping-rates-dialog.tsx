import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Box, Check, ChevronDown, ChevronLeft, ChevronRight, GripVertical, Loader2, Package, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import type { Order, OrderItem, OrderPatchPayload, ShippingPackagePayload, ShippingRate, ShippingRatesResponse, ShippingSelectionRequest } from '@/api/order/schema'
import { ORDER_QUERY_KEYS } from '@/api/order/query'
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
  c_country: string
  c_phone: string
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
  const queryClient = useQueryClient()
  const [step, setStep] = useState<Step>('configure')
  const [packages, setPackages] = useState<LocalPackage[]>([])
  const [loading, setLoading] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null)
  const [ratesData, setRatesData] = useState<ShippingRatesResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragItem, setDragItem] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [address, setAddress] = useState<ShipToAddress>({
    c_name: '', c_address1: '', c_address2: '', c_city: '', c_state: '', c_zip: '', c_country: '', c_phone: '',
  })
  const [shipToExpanded, setShipToExpanded] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [addressPopoverOpen, setAddressPopoverOpen] = useState(false)

  const { data: shippingAddresses = [] } = useQuery(getShippingAddressesQuery(projectId))

  const selectedAddress = useMemo(
    () => shippingAddresses.find((a) => a.id === selectedAddressId) ?? null,
    [shippingAddresses, selectedAddressId],
  )

  // Initialize when dialog opens
  const prevOpenRef = useRef(false)
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      const pickedIds = items.filter((i) => i.is_picked).map((i) => i.autoid)
      const rawWeight = pickedIds.reduce((sum, id) => {
        const item = items.find((i) => i.autoid === id)
        const w = item?.weight ? parseFloat(item.weight) : 0
        return sum + (isNaN(w) ? 0 : w)
      }, 0)
      const initialWeight = Math.max(Math.round(rawWeight * 100) / 100, 0.01)
      setPackages([
        { id: `pkg-${Date.now()}`, items: pickedIds, weight: initialWeight, length: 1, width: 1, height: 1 },
      ])
      setAddress({
        c_name: order.c_name ?? '',
        c_address1: order.c_address1 ?? '',
        c_address2: order.c_address2 ?? '',
        c_city: order.c_city ?? '',
        c_state: order.c_state ?? '',
        c_zip: order.c_zip ?? '',
        c_country: String((order as Record<string, unknown>).c_country ?? ''),
        c_phone: String((order as Record<string, unknown>).c_phone ?? ''),
      })
      const hasShipTo = !!(order.c_address1?.trim() || order.c_city?.trim())
      setShipToExpanded(!hasShipTo)
      // Auto-select default shipping address (ship from)
      const defaultAddr = shippingAddresses.find((a) => a.is_default)
      setSelectedAddressId(defaultAddr?.id ?? shippingAddresses[0]?.id ?? null)
      setRatesData(null)
      setError(null)
      setStep('configure')
    }
    prevOpenRef.current = open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Auto-select default address if not yet selected when addresses load
  useEffect(() => {
    if (open && selectedAddressId === null && shippingAddresses.length > 0) {
      const defaultAddr = shippingAddresses.find((a) => a.is_default)
      setSelectedAddressId(defaultAddr?.id ?? shippingAddresses[0]?.id ?? null)
    }
  }, [open, selectedAddressId, shippingAddresses])

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
      { id: `pkg-${Date.now()}`, items: [], weight: 0, length: 1, width: 1, height: 1 },
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

  // Compute weight from assigned items (sum of item weights, min 0.01)
  const computePackageWeight = useCallback((itemIds: string[]) => {
    const total = itemIds.reduce((sum, id) => {
      const item = itemMap.get(id)
      const w = item?.weight ? parseFloat(item.weight) : 0
      return sum + (isNaN(w) ? 0 : w)
    }, 0)
    return Math.max(Math.round(total * 100) / 100, 0.01)
  }, [itemMap])

  // Move item to a package (removing from any other)
  const moveItemToPackage = useCallback((itemAutoid: string, targetPkgId: string) => {
    setPackages((prev) => {
      const updated = prev.map((p) => {
        const without = p.items.filter((id) => id !== itemAutoid)
        if (p.id === targetPkgId) {
          const newItems = p.items.includes(itemAutoid) ? p.items : [...p.items, itemAutoid]
          return { ...p, items: newItems }
        }
        return { ...p, items: without }
      })
      // Recompute weights for affected packages
      return updated.map((p) => ({ ...p, weight: computePackageWeight(p.items) }))
    })
  }, [computePackageWeight])

  // Remove item from its package (back to unassigned)
  const unassignItem = useCallback((itemAutoid: string) => {
    setPackages((prev) =>
      prev.map((p) => {
        const newItems = p.items.filter((id) => id !== itemAutoid)
        return { ...p, items: newItems, weight: computePackageWeight(newItems) }
      })
    )
  }, [computePackageWeight])

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
      errors.push('Please select a warehouse (ship from) address.')
    }

    if (!address.c_address1.trim() && !address.c_city.trim()) {
      errors.push('Please enter a destination (ship to) address.')
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
      setSelectedRate(null)
      setStep('rates')
    } catch (err) {
      setError(getErrorMessage(err))
      toast.error('Failed to fetch shipping rates')
    } finally {
      setLoading(false)
    }
  }

  // ── Select a rate ──

  const confirmRate = async () => {
    if (!selectedAddressId || !selectedRate) return
    setSelecting(true)
    setError(null)

    const pkgPayload: ShippingPackagePayload[] = packages.map((p) => ({
      items: p.items,
      weight: p.weight,
      length: p.length,
      width: p.width,
      height: p.height,
    }))

    const payload: ShippingSelectionRequest = {
      shipping_address_id: selectedAddressId,
      packages: pkgPayload,
      rate_id: selectedRate.rate_id,
    }

    try {
      await orderService.selectShippingRate(orderAutoid, payload)
      toast.success(`Shipping label created — ${selectedRate.type}`)
      queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.detail(orderAutoid) })
      onOpenChange(false)
    } catch (err) {
      setError(getErrorMessage(err))
      toast.error('Failed to create shipping label')
    } finally {
      setSelecting(false)
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='gap-0 p-0 sm:max-w-[960px] max-sm:max-w-full max-sm:rounded-none max-sm:border-0'>
        <DialogHeader className='border-b border-border px-4 py-3 sm:px-5'>
          <div className='flex items-center gap-3'>
            <DialogTitle className='text-[14px] font-semibold text-foreground'>
              Shipping
            </DialogTitle>

            <div className='mx-1 h-4 w-px bg-border' />

            {/* Steps indicator */}
            <div className='flex items-center gap-0.5'>
              {(['configure', 'rates'] as const).map((s, i) => (
                <span key={s} className='flex items-center gap-0.5'>
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
            {/* Route: Origin → Destination */}
            <div className='grid grid-cols-1 gap-3 border-b border-border px-4 py-4 sm:grid-cols-2 sm:px-5'>
              {/* Origin */}
              <div className='min-w-0'>
                <div className='mb-1.5 text-[12px] font-medium text-text-tertiary'>Ship from</div>
                  <Popover open={addressPopoverOpen} onOpenChange={setAddressPopoverOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type='button'
                        className={cn(
                          'flex h-9 w-full items-center gap-2 rounded-[6px] border px-3 text-left transition-colors duration-75',
                          selectedAddress
                            ? 'border-border hover:bg-bg-hover'
                            : 'border-dashed border-border-heavy/40 hover:border-border-heavy hover:bg-bg-hover',
                        )}
                      >
                        <span className='min-w-0 flex-1 truncate text-[13px]'>
                          {selectedAddress ? (
                            <>
                              <span className='font-medium text-foreground'>{selectedAddress.title}</span>
                              <span className='text-text-quaternary'> · </span>
                              <span className='text-text-tertiary'>
                                {[selectedAddress.city, selectedAddress.state].filter(Boolean).join(', ')}
                              </span>
                            </>
                          ) : (
                            <span className='text-text-quaternary'>Select warehouse address…</span>
                          )}
                        </span>
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

              {/* Destination */}
              <div className='min-w-0'>
                <div className='mb-1.5 text-[12px] font-medium text-text-tertiary'>Ship to</div>
                <button
                  type='button'
                  className={cn(
                    'flex h-9 w-full items-center gap-2 rounded-[6px] border px-3 text-left transition-colors hover:bg-bg-hover',
                    hasAddress ? 'border-border' : 'border-dashed border-border-heavy/40',
                  )}
                  onClick={() => setShipToExpanded(true)}
                >
                  <span className='min-w-0 flex-1 truncate text-[13px]'>
                    {hasAddress ? (
                      <>
                        {address.c_name && <span className='font-medium text-foreground'>{address.c_name}<span className='text-text-quaternary'> · </span></span>}
                        <span className='text-text-tertiary'>
                          {[address.c_address1, address.c_city, address.c_state, address.c_zip].filter(Boolean).join(', ')}
                        </span>
                      </>
                    ) : (
                      <span className='text-text-quaternary'>Enter destination address…</span>
                    )}
                  </span>
                  <Pencil className='size-3 shrink-0 text-text-quaternary' />
                </button>
              </div>
            </div>

            {/* Two-panel layout — stacks on mobile */}
            <div className='flex max-h-[70vh] min-h-0 flex-1 max-md:flex-col md:min-h-[480px]'>
              {/* Left: Packages */}
              <div className='flex shrink-0 flex-col border-b border-border max-md:max-h-[40vh] md:w-[380px] md:border-b-0 md:border-r'>
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

                <div className='flex-1 space-y-2 overflow-y-auto p-3'>
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

                <div className='flex-1 overflow-x-auto overflow-y-auto'>
                  <table className='w-full text-[13px]'>
                    <thead className='sticky top-0 z-10 bg-bg-secondary/80 backdrop-blur-sm'>
                      <tr className='border-b border-border text-left'>
                        <th className='w-[28px] py-1.5 pl-2 pr-0'></th>
                        <th className='min-w-[90px] px-3 py-1.5 font-medium text-text-tertiary'>Inventory</th>
                        <th className='min-w-[120px] px-3 py-1.5 font-medium text-text-tertiary max-sm:hidden'>Description</th>
                        <th className='w-[50px] px-3 py-1.5 text-right font-medium text-text-tertiary'>Qty</th>
                        <th className='w-[70px] px-3 py-1.5 font-medium text-text-tertiary max-sm:hidden'>Status</th>
                        <th className='w-[80px] py-1.5 pl-3 pr-4 font-medium text-text-tertiary'>Pkg</th>
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
                            <td className='max-w-[200px] px-3 py-1.5 text-text-secondary max-sm:hidden'>
                              <span className='block truncate'>{item.descr || '—'}</span>
                            </td>
                            <td className='px-3 py-1.5 text-right tabular-nums text-text-secondary'>{parseFloat(String(item.quan))}</td>
                            <td className='py-1.5 pl-3 pr-3 max-sm:hidden'>
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
            <div className='flex items-center justify-between border-t border-border px-4 py-3 sm:px-5'>
              <div className='text-[12px] text-text-tertiary max-sm:hidden'>
                {packages.length} package(s) · {items.length - unassignedItems.length} of {items.length} items assigned
              </div>
              <div className='text-[12px] text-text-tertiary sm:hidden'>
                {packages.length} pkg · {items.length - unassignedItems.length}/{items.length} assigned
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
              <RatesResultStep
                data={ratesData!}
                itemMap={itemMap}
                selectedRate={selectedRate}
                onSelectRate={setSelectedRate}
              />
            </div>
            <div className='flex items-center justify-between border-t border-border px-4 py-3 sm:px-5'>
              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  className='inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-border px-3 text-[13px] font-medium text-text-secondary transition-colors hover:bg-bg-hover'
                  onClick={() => setStep('configure')}
                  disabled={selecting}
                >
                  <ChevronLeft className='size-3.5' />
                  Back to Packages
                </button>
                <span className='text-[12px] text-text-tertiary'>
                  {ratesData?.rates.length ?? 0} rate(s) found
                </span>
              </div>
              <button
                type='button'
                className='inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-primary px-3 text-[13px] font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-40'
                disabled={!selectedRate || selecting}
                onClick={confirmRate}
              >
                {selecting ? (
                  <>
                    <Loader2 className='size-3.5 animate-spin' />
                    Creating…
                  </>
                ) : (
                  'Create Label'
                )}
              </button>
            </div>
          </>
        )}

        {error && (
          <div className='border-t border-destructive/20 bg-destructive/5 px-4 py-2 text-[12px] text-destructive sm:px-5'>
            {error}
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Ship To edit dialog */}
    <ShipToEditDialog
      open={shipToExpanded}
      onOpenChange={setShipToExpanded}
      address={address}
      onSave={setAddress}
    />
    </>
  )
}

// ── Ship To Edit Dialog ──

function ShipToEditDialog({
  open,
  onOpenChange,
  address,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  address: ShipToAddress
  onSave: (address: ShipToAddress) => void
}) {
  const [draft, setDraft] = useState<ShipToAddress>(address)

  // Sync draft when opening
  const prevOpen = useRef(false)
  useEffect(() => {
    if (open && !prevOpen.current) setDraft(address)
    prevOpen.current = open
  }, [open, address])

  const update = (field: keyof ShipToAddress, value: string) => {
    setDraft((d) => ({ ...d, [field]: value }))
  }

  const formatPhoneInput = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }

  const handlePhoneChange = (value: string) => {
    update('c_phone', formatPhoneInput(value))
  }

  const formatZipInput = (value: string) => {
    // Allow alphanumeric + spaces for Canadian/international postal codes
    return value.toUpperCase().replace(/[^A-Z0-9 -]/g, '').slice(0, 10)
  }

  const handleZipChange = (value: string) => {
    update('c_zip', formatZipInput(value))
  }

  const handleSave = () => {
    onSave(draft)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='gap-0 p-0 sm:max-w-[400px]'>
        <DialogHeader className='border-b border-border px-5 py-3'>
          <DialogTitle className='text-[14px] font-semibold'>Ship To Address</DialogTitle>
        </DialogHeader>
        <div className='space-y-3 px-5 py-4'>
          <ShipToField label='Name' value={draft.c_name} onChange={(v) => update('c_name', v)} />
          <ShipToField label='Address' value={draft.c_address1} onChange={(v) => update('c_address1', v)} />
          <div className='grid grid-cols-3 gap-2'>
            <ShipToField label='City' value={draft.c_city} onChange={(v) => update('c_city', v)} />
            <ShipToField label='State' value={draft.c_state} onChange={(v) => update('c_state', v)} />
            <ShipToField label='ZIP / Postal' value={draft.c_zip} onChange={handleZipChange} />
          </div>
          <div className='grid grid-cols-2 gap-2'>
            <ShipToField label='Country' value={draft.c_country} onChange={(v) => update('c_country', v)} />
            <ShipToField label='Phone' value={draft.c_phone} onChange={handlePhoneChange} inputMode='tel' />
          </div>
        </div>
        <div className='flex items-center justify-end gap-2 border-t border-border px-5 py-3'>
          <button
            type='button'
            className='rounded-[6px] border border-border px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-bg-hover'
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            type='button'
            className='rounded-[6px] bg-primary px-3 py-1.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:opacity-90'
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ShipToField({
  label,
  value,
  onChange,
  inputMode,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  inputMode?: 'tel' | 'text'
}) {
  return (
    <div>
      <label className='mb-1 block text-[12px] font-medium text-text-tertiary'>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        inputMode={inputMode}
        className='h-8 w-full rounded-[6px] border border-border bg-background px-2.5 text-[13px] text-foreground outline-none transition-colors duration-[80ms] placeholder:text-text-quaternary focus:border-primary/50 focus:ring-1 focus:ring-primary/20'
      />
    </div>
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
  const hasItems = pkg.items.length > 0

  return (
    <div
      className={cn(
        'group/pkg overflow-hidden rounded-[8px] border transition-all',
        isDragOver
          ? 'border-primary bg-primary/[0.04] ring-1 ring-primary/20'
          : 'border-border',
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Header — shipping-label style */}
      <div className='flex items-center gap-2.5 bg-foreground/[0.03] px-3 py-2'>
        <div className='flex size-7 items-center justify-center rounded-[6px] bg-foreground/[0.07]'>
          <Box className='size-4 text-text-secondary' />
        </div>
        <div className='min-w-0 flex-1'>
          <div className='text-[13px] font-semibold leading-tight text-foreground'>Package {index + 1}</div>
          <div className='text-[11px] leading-tight text-text-quaternary'>
            {hasItems
              ? `${pkg.items.length} item${pkg.items.length !== 1 ? 's' : ''} assigned`
              : 'No items yet'}
          </div>
        </div>
        <button
          type='button'
          className='inline-flex size-6 items-center justify-center rounded-[5px] text-text-quaternary opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover/pkg:opacity-100'
          onClick={onRemove}
        >
          <Trash2 className='size-3' />
        </button>
      </div>

      {/* Dimensions — 2×2 grid with inline units */}
      <div className='grid grid-cols-3 gap-x-1.5 gap-y-1.5 px-3 py-2.5'>
        {([
          ['length', 'L', 'cm'],
          ['width', 'W', 'cm'],
          ['height', 'H', 'cm'],
        ] as const).map(([field, label, unit]) => {
          const isInvalid = pkg[field] < 0.01
          return (
            <div key={field} className='relative'>
              <div className={cn(
                'flex h-8 items-center overflow-hidden rounded-[5px] border transition-colors focus-within:ring-1',
                isInvalid
                  ? 'border-destructive/40 focus-within:border-destructive focus-within:ring-destructive/30'
                  : 'border-border focus-within:border-ring focus-within:ring-ring/50',
              )}>
                <span className={cn(
                  'flex h-full w-6 shrink-0 items-center justify-center border-r bg-foreground/[0.03] text-[11px] font-semibold',
                  isInvalid ? 'border-destructive/20 text-destructive/70' : 'border-border text-text-tertiary',
                )}>{label}</span>
                <input
                  type='number'
                  min={0.01}
                  step={0.01}
                  value={pkg[field] || ''}
                  onChange={(e) => onUpdateDimension(field, Number(e.target.value) || 0)}
                  className='h-full min-w-0 flex-1 bg-background px-1.5 text-[12px] tabular-nums text-foreground outline-none'
                  placeholder='0'
                />
                <span className='pr-1.5 text-[10px] text-text-quaternary'>{unit}</span>
              </div>
            </div>
          )
        })}
        <div className='col-span-3'>
          <div className={cn(
            'flex h-8 items-center overflow-hidden rounded-[5px] border transition-colors focus-within:ring-1',
            'border-border focus-within:border-ring focus-within:ring-ring/50',
          )}>
            <span className='flex h-full shrink-0 items-center justify-center border-r border-border bg-foreground/[0.03] px-2 text-[11px] font-medium text-text-tertiary'>
              Weight
            </span>
            <input
              type='number'
              min={0}
              step={0.01}
              value={pkg.weight || ''}
              onChange={(e) => onUpdateDimension('weight', Math.round((Number(e.target.value) || 0) * 100) / 100)}
              className='h-full min-w-0 flex-1 bg-background px-2 text-[12px] tabular-nums text-foreground outline-none'
              placeholder='0'
            />
            <span className='pr-2 text-[10px] text-text-quaternary'>kg</span>
          </div>
        </div>
      </div>

      {/* Assigned items */}
      {hasItems && (
        <div className='border-t border-border/60 px-2 py-2 space-y-0.5'>
          {pkg.items.map((autoid) => {
            const item = itemMap.get(autoid)
            if (!item) return null
            return (
              <div
                key={autoid}
                className='group/item flex items-center gap-1.5 rounded-[5px] px-1.5 py-1 transition-colors hover:bg-foreground/[0.03]'
              >
                <Package className='size-3 shrink-0 text-text-quaternary' />
                <span className='shrink-0 text-[12px] font-medium tabular-nums text-foreground'>{item.inven}</span>
                <span className='min-w-0 flex-1 truncate text-[11px] text-text-tertiary'>{item.descr}</span>
                <button
                  type='button'
                  className='flex size-5 shrink-0 items-center justify-center rounded-[4px] text-text-quaternary opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover/item:opacity-100'
                  onClick={() => onUnassignItem(autoid)}
                >
                  <Trash2 className='size-2.5' />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Drop zone */}
      {!hasItems && (
        <div className={cn(
          'mx-2 mb-2 flex flex-col items-center gap-1 rounded-[6px] border border-dashed py-3 transition-colors',
          isDragOver
            ? 'border-primary bg-primary/[0.04] text-primary'
            : 'border-border-heavy/30 text-text-quaternary',
        )}>
          <GripVertical className='size-3.5 opacity-40' />
          <span className='text-[11px]'>
            {isDragOver ? 'Drop to add' : 'Drag items here'}
          </span>
        </div>
      )}
    </div>
  )
}

// ── Rates Result ──

function RatesResultStep({
  data,
  itemMap,
  selectedRate,
  onSelectRate,
}: {
  data: ShippingRatesResponse
  itemMap: Map<string, OrderItem>
  selectedRate: ShippingRate | null
  onSelectRate: (rate: ShippingRate) => void
}) {
  return (
    <div>
      <div className='px-5 py-3'>
        <div className='mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary'>
          Select a Rate
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
              .map((rate) => (
                <RateCard
                  key={`${rate.carrier_id}-${rate.service_id}`}
                  rate={rate}
                  selected={selectedRate?.rate_id === rate.rate_id}
                  onSelect={() => onSelectRate(rate)}
                />
              ))
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

function RateCard({ rate, selected, onSelect }: { rate: ShippingRate; selected: boolean; onSelect: () => void }) {
  const isFree = rate.cost === 0
  return (
    <button
      type='button'
      className={cn(
        'flex w-full items-center gap-3 rounded-[6px] border px-3 py-2.5 text-left transition-colors duration-75',
        selected
          ? 'border-primary bg-primary/[0.06]'
          : 'border-border hover:border-primary/40 hover:bg-primary/[0.04]',
      )}
      onClick={onSelect}
    >
      <div
        className={cn(
          'flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-75',
          selected
            ? 'border-primary bg-primary'
            : 'border-border-heavy',
        )}
      >
        {selected && <div className='size-1.5 rounded-full bg-white' />}
      </div>
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
    </button>
  )
}

