import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Check, ChevronDown, Loader2, Package } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useNavigate } from '@tanstack/react-router'

import { getOrdersForPickingQuery, PICKING_QUERY_KEYS } from '@/api/orders-for-picking/query'
import type { PickingCustomerGroup, PickingOrder, PickingOrderItem } from '@/api/orders-for-picking/schema'
import { PICK_LIST_QUERY_KEYS } from '@/api/pick-list/query'
import { pickListService } from '@/api/pick-list/service'
import type { AddItemsPayload } from '@/api/pick-list/schema'
import { getShippingAddressesQuery } from '@/api/shipping-address/query'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useProjectId } from '@/hooks/use-project-id'
import { cn } from '@/lib/utils'

interface StartPickingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Customer ID to fetch orders for (e.g. "LUNL") */
  customerId: string
  /** Customer display name */
  customerName: string
  /** If provided, auto-select this order when dialog opens */
  orderAutoid?: string
}

type Step = 'select-orders' | 'set-quantities' | 'saving'

export function StartPickingDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
  orderAutoid,
}: StartPickingDialogProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [projectId] = useProjectId()
  const [step, setStep] = useState<Step>('select-orders')
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(
    () => orderAutoid ? new Set([orderAutoid]) : new Set()
  )
  const [pickQuantities, setPickQuantities] = useState<Map<string, string>>(new Map())
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false)

  // Try customer_id first, fall back to fetching all and matching by name
  const hasCustomerId = !!customerId
  const { data, isLoading } = useQuery({
    ...getOrdersForPickingQuery({
      ...(hasCustomerId ? { customer_id: customerId } : {}),
      include_items: true,
      project_id: projectId ?? undefined,
    }),
    enabled: open,
  })

  // Fetch default shipping (ship-from) address
  const { data: shippingAddresses } = useQuery({
    ...getShippingAddressesQuery(projectId),
    enabled: open,
  })
  const defaultShippingAddressId = useMemo(() => {
    const list = Array.isArray(shippingAddresses) ? shippingAddresses : []
    const def = list.find((a) => a.is_default) ?? list[0]
    return def?.id ?? null
  }, [shippingAddresses])

  // Find the matching customer group
  const groups = data?.results ?? []
  const group: PickingCustomerGroup | undefined = hasCustomerId
    ? groups[0]
    : groups.find((g) => g.customer_name === customerName) ?? groups[0]
  const orders = group?.orders ?? []

  // Auto-select order when opened from a specific order
  const autoSelectedRef = useRef(false)
  useEffect(() => {
    if (!open) {
      autoSelectedRef.current = false
      return
    }
    if (orderAutoid && orders.length > 0 && !autoSelectedRef.current) {
      autoSelectedRef.current = true
      setSelectedOrderIds(new Set([orderAutoid]))
    }
  }, [open, orderAutoid, orders])

  const selectedOrders = useMemo(
    () => orders.filter((o) => selectedOrderIds.has(o.autoid)),
    [orders, selectedOrderIds],
  )

  const allItems = useMemo(() => {
    const items: (PickingOrderItem & { orderAutoid: string; orderInvoice: string })[] = []
    for (const order of selectedOrders) {
      for (const item of order.items ?? []) {
        items.push({ ...item, orderAutoid: order.autoid, orderInvoice: order.invoice || order.id })
      }
    }
    return items
  }, [selectedOrders])

  const toggleOrder = useCallback((autoid: string) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev)
      if (next.has(autoid)) next.delete(autoid)
      else next.add(autoid)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedOrderIds(new Set(orders.map((o) => o.autoid)))
  }, [orders])

  const formatQty = (raw: string) => {
    const n = parseFloat(raw)
    if (isNaN(n)) return '0'
    return n % 1 === 0 ? n.toFixed(0) : String(parseFloat(n.toFixed(4)))
  }

  const goToQuantities = useCallback(() => {
    const qty = new Map<string, string>()
    for (const item of allItems) {
      qty.set(item.autoid, '0')
    }
    setPickQuantities(qty)
    setStep('set-quantities')
  }, [allItems])

  const updatePickQty = useCallback((itemAutoid: string, value: string, maxQuan: string) => {
    const max = parseFloat(maxQuan)
    const num = parseFloat(value)
    const clamped = isNaN(num) ? '' : num > max ? formatQty(maxQuan) : value
    setPickQuantities((prev) => {
      const next = new Map(prev)
      next.set(itemAutoid, clamped)
      return next
    })
  }, [])

  // Get ship-to from first selected order
  const shipTo = useMemo(() => {
    const o = selectedOrders[0]
    if (!o) return null
    return {
      name: (o.c_name as string) || o.name || '',
      address1: (o.c_address1 as string) || '',
      address2: '',
      city: (o.c_city as string) || '',
      state: (o.c_state as string) || '',
      postal: (o.c_zip as string) || '',
      country: (o.c_country as string) || (o.country as string) || '',
    }
  }, [selectedOrders])

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!shipTo) throw new Error('No ship-to address')
      // 1. Create pick list
      const pickList = await pickListService.create({
        ship_to: shipTo,
        ...(defaultShippingAddressId ? { shipping_address_id: defaultShippingAddressId } : {}),
        name: `${customerName} picking`,
      })

      // 2. Add items (exclude items with 0 quantity)
      const payload: AddItemsPayload = {
        items: allItems
          .map((item) => ({
            order_autoid: item.orderAutoid,
            detail_autoid: item.autoid,
            picked_quantity: pickQuantities.get(item.autoid) || (item.qty_in_uom || item.quan),
          }))
          .filter((item) => parseFloat(item.picked_quantity) > 0),
      }
      if (payload.items.length === 0) throw new Error('No items with quantity > 0')
      await pickListService.addItems(pickList.id, payload)

      // 3. Push to EBMS
      const pushed = await pickListService.push(pickList.id)
      return pushed
    },
    onSuccess: (pickList) => {
      queryClient.invalidateQueries({ queryKey: PICK_LIST_QUERY_KEYS.all() })
      queryClient.invalidateQueries({ queryKey: PICKING_QUERY_KEYS.all() })
      toast.success('Pick list created and pushed to EBMS')
      onOpenChange(false)
      resetState()
      navigate({
        to: '/pick-lists/$pickListId',
        params: { pickListId: String(pickList.id) },
      })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to create pick list')
      setStep('set-quantities')
    },
  })

  const hasAnyPicked = Array.from(pickQuantities.values()).some((v) => parseFloat(v) > 0)

  const handleCreate = () => {
    setConfirmOpen(false)
    setStep('saving')
    createMutation.mutate()
  }

  const handleClose = () => {
    if (step === 'set-quantities' && hasAnyPicked) {
      setCloseConfirmOpen(true)
      return
    }
    resetState()
    setConfirmOpen(false)
    onOpenChange(false)
  }

  const confirmClose = () => {
    setCloseConfirmOpen(false)
    resetState()
    setConfirmOpen(false)
    onOpenChange(false)
  }

  const resetState = () => {
    setStep('select-orders')
    setSelectedOrderIds(orderAutoid ? new Set([orderAutoid]) : new Set())
    setPickQuantities(new Map())
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) { handleClose(); return }
        onOpenChange(next)
      }}
    >
      <DialogContent className='flex max-h-[85vh] flex-col sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>
            {step === 'select-orders' && 'Select Orders to Pick'}
            {step === 'set-quantities' && 'Set Pick Quantities'}
            {step === 'saving' && 'Creating Pick List...'}
          </DialogTitle>
        </DialogHeader>

        <DialogBody className='flex min-h-0 flex-1 flex-col gap-3 overflow-hidden'>
          <p className='text-[13px] text-text-tertiary'>
            Customer: <span className='font-medium text-foreground'>{customerName}</span>
            {customerId && <span className='ml-1 text-text-quaternary'>({customerId})</span>}
          </p>

          {/* Step 1: Select orders */}
          {step === 'select-orders' && (
            <>
              {isLoading ? (
                <div className='space-y-2'>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className='h-14 w-full rounded-lg' />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className='flex flex-col items-center py-8 text-center text-text-tertiary'>
                  <Package className='mb-2 size-8 opacity-50' />
                  <p className='text-[13px]'>No unprocessed orders found</p>
                </div>
              ) : (
                <>
                  <div className='flex items-center justify-between'>
                    <span className='text-[11px] font-medium uppercase tracking-wider text-text-quaternary'>
                      {orders.length} order{orders.length !== 1 && 's'} available
                    </span>
                    <button
                      type='button'
                      className='text-[12px] font-medium text-primary hover:underline'
                      onClick={selectAll}
                    >
                      Select all
                    </button>
                  </div>
                  <div className='min-h-0 flex-1 space-y-2 overflow-y-auto'>
                    {orders.map((order) => (
                      <OrderSelectCard
                        key={order.autoid}
                        order={order}
                        selected={selectedOrderIds.has(order.autoid)}
                        onToggle={() => toggleOrder(order.autoid)}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* Step 2: Set pick quantities — grouped by order */}
          {step === 'set-quantities' && (
            <div className='min-h-0 flex-1 space-y-3 overflow-y-auto'>
              {/* Global actions */}
              <div className='flex items-center gap-3'>
                <button
                  type='button'
                  className='inline-flex h-7 items-center gap-1.5 rounded-[5px] border border-emerald-200 bg-emerald-500/10 px-2.5 text-[12px] font-medium text-emerald-700 transition-colors hover:bg-emerald-500/20 dark:border-emerald-700 dark:text-emerald-400'
                  onClick={() => {
                    const qty = new Map(pickQuantities)
                    for (const item of allItems) {
                      qty.set(item.autoid, formatQty((item.qty_in_uom || item.quan)))
                    }
                    setPickQuantities(qty)
                  }}
                >
                  <Package className='size-3.5' />
                  Pick all
                </button>
                <button
                  type='button'
                  className='inline-flex h-7 items-center gap-1.5 rounded-[5px] border border-border bg-bg-secondary px-2.5 text-[12px] font-medium text-text-secondary transition-colors hover:bg-bg-active hover:text-foreground'
                  onClick={() => {
                    const qty = new Map(pickQuantities)
                    for (const item of allItems) {
                      qty.set(item.autoid, '0')
                    }
                    setPickQuantities(qty)
                  }}
                >
                  Reset
                </button>

                <div className='ml-auto flex items-center gap-2 text-[12px] tabular-nums'>
                  {(() => {
                    const total = allItems.length
                    const picked = allItems.filter((it) => parseFloat(pickQuantities.get(it.autoid) || '0') > 0).length
                    const left = total - picked
                    return left === 0 ? (
                      <span className='font-medium text-emerald-600 dark:text-emerald-400'>All {total} picked</span>
                    ) : (
                      <span className='text-text-tertiary'>
                        <span className='font-medium text-foreground'>{picked}/{total}</span> picked · <span className='font-medium text-amber-600 dark:text-amber-400'>{left} left</span>
                      </span>
                    )
                  })()}
                </div>
              </div>

              {selectedOrders.map((order) => {
                const items = order.items ?? []

                // Group items into parent → components hierarchy
                const parentItems = items.filter((it) => !it.par_time)
                const componentsByParent = new Map<string, typeof items>()
                for (const it of items) {
                  if (it.par_time) {
                    const arr = componentsByParent.get(it.par_time) ?? []
                    arr.push(it)
                    componentsByParent.set(it.par_time, arr)
                  }
                }
                // If no parent/child structure, show flat
                const hasHierarchy = parentItems.length > 0 && parentItems.length < items.length

                return (
                  <div key={order.autoid} className='overflow-hidden rounded-lg border border-border'>
                    {/* Order header */}
                    <div className='flex items-center gap-2 bg-bg-secondary/50 px-3.5 py-2'>
                      <span className='text-[13px] font-semibold text-foreground'>
                        #{(order.invoice || order.id).trim()}
                      </span>
                      {order.po_no ? (
                        <span className='rounded bg-bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-text-tertiary'>
                          PO: {String(order.po_no)}
                        </span>
                      ) : null}
                      <div className='flex-1' />
                      <button
                        type='button'
                        className='text-[11px] font-medium text-primary hover:underline'
                        onClick={() => {
                          const qty = new Map(pickQuantities)
                          for (const item of items) {
                            qty.set(item.autoid, formatQty((item.qty_in_uom || item.quan)))
                          }
                          setPickQuantities(qty)
                        }}
                      >
                        Pick all
                      </button>
                      <span className='text-[11px] text-text-quaternary'>
                        {items.length} item{items.length !== 1 && 's'}
                      </span>
                    </div>

                    {/* Column header */}
                    <div className='grid grid-cols-[20px_1fr_52px_40px_52px] items-center gap-2 border-b border-border-light bg-bg-secondary/40 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-quaternary'>
                      <span />
                      <span>Item</span>
                      <span className='text-center'>Qty</span>
                      <span className='text-center'>UOM</span>
                      <span className='text-center'>Pick</span>
                    </div>

                    {/* Items with parent/component hierarchy */}
                    {(hasHierarchy ? parentItems : items).map((pItem) => {
                      const comps = hasHierarchy ? (componentsByParent.get(pItem.timestamp!) ?? []) : []
                      const isParent = hasHierarchy && comps.length > 0

                      return (
                        <div key={pItem.autoid}>
                          <PickItemRow
                            item={pItem}
                            pickQuantities={pickQuantities}
                            updatePickQty={updatePickQty}
                            formatQty={formatQty}
                            isParent={isParent}
                          />
                          {comps.length > 0 && comps.map((comp, ci) => (
                            <PickItemRow
                              key={comp.autoid}
                              item={comp}
                              pickQuantities={pickQuantities}
                              updatePickQty={updatePickQty}
                              formatQty={formatQty}
                              isComponent
                              isLastComponent={ci === comps.length - 1}
                            />
                          ))}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}

          {/* Saving */}
          {step === 'saving' && (
            <div className='flex flex-col items-center gap-5 py-14'>
              <div className='flex size-14 items-center justify-center rounded-2xl bg-primary/10'>
                <Loader2 className='size-7 animate-spin text-primary' />
              </div>
              <div className='text-center'>
                <p className='text-[14px] font-semibold text-foreground'>Creating pick list</p>
                <p className='mt-1 text-[13px] text-text-tertiary'>
                  Pushing {allItems.length} item{allItems.length !== 1 && 's'} to EBMS...
                </p>
              </div>
              <div className='flex gap-1'>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className='size-1.5 animate-pulse rounded-full bg-primary/40'
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          {step === 'select-orders' && (
            <>
              <Button variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button disabled={selectedOrderIds.size === 0} onClick={goToQuantities}>
                Next
                <ArrowRight className='size-3.5' />
              </Button>
            </>
          )}

          {step === 'set-quantities' && (
            <>
              <Button variant='outline' onClick={() => setStep('select-orders')}>
                <ArrowLeft className='size-3.5' />
                Back
              </Button>
              <Button onClick={() => setConfirmOpen(true)} disabled={!hasAnyPicked}>
                <Check className='size-3.5' />
                Create Pick List
              </Button>
            </>
          )}

        </DialogFooter>
      </DialogContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create Pick List?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a pick list and push it to EBMS. Items will be marked as picked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreate}>
              Create Pick List
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={closeConfirmOpen} onOpenChange={setCloseConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard pick quantities?</AlertDialogTitle>
            <AlertDialogDescription>
              You have pick quantities set. Closing will discard your changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction variant='destructive' onClick={confirmClose}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}

// ── Order Select Card ───────────────────────────────────────

function OrderSelectCard({
  order,
  selected,
  onToggle,
}: {
  order: PickingOrder
  selected: boolean
  onToggle: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const items = order.items ?? []
  const billTo = [order.address1, order.address2].filter(Boolean).join(', ')
  const shipTo = [order.c_address1, order.c_city, order.c_state, order.c_zip].filter(Boolean).join(', ')

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border transition-all duration-100',
        selected
          ? 'border-primary ring-1 ring-primary/20'
          : 'border-border hover:border-border-light hover:shadow-sm',
      )}
    >
      {/* Header — always visible */}
      <div
        className={cn(
          'flex cursor-pointer items-center gap-3 px-3.5 py-2.5',
          selected ? 'bg-primary/[0.03]' : 'bg-bg-secondary/40',
        )}
        onClick={onToggle}
      >
        <div
          className={cn(
            'flex size-[18px] shrink-0 items-center justify-center rounded border transition-colors duration-100',
            selected
              ? 'border-primary bg-primary text-white'
              : 'border-border bg-background',
          )}
        >
          {selected && (
            <svg className='size-2.5' viewBox='0 0 12 12' fill='none'>
              <path d='M2.5 6L5 8.5L9.5 3.5' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
          )}
        </div>
        <span className='text-[13px] font-semibold text-foreground'>
          #{order.invoice || order.id}
        </span>
        {order.po_no ? (
          <span className='rounded bg-bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-text-tertiary'>
            PO: {String(order.po_no)}
          </span>
        ) : null}
        <div className='flex-1' />
        <span className='text-[12px] tabular-nums text-text-tertiary'>
          {items.length} item{items.length !== 1 && 's'}
        </span>
        <button
          type='button'
          className='inline-flex size-5 items-center justify-center rounded text-text-quaternary transition-colors hover:bg-bg-active hover:text-text-secondary'
          onClick={(e) => {
            e.stopPropagation()
            setExpanded((v) => !v)
          }}
        >
          <ChevronDown className={cn('size-3.5 transition-transform duration-150', expanded && 'rotate-180')} />
        </button>
      </div>

      {/* Expandable details */}
      {expanded && (
        <>
          {/* Addresses row */}
          {(billTo || shipTo) && (
            <div className='grid grid-cols-2 gap-3 border-t border-border-light px-3.5 py-2'>
              {billTo ? (
                <div className='min-w-0'>
                  <span className='text-[10px] font-semibold uppercase tracking-wider text-text-quaternary'>Bill To</span>
                  <p className='mt-0.5 truncate text-[12px] text-text-secondary'>{billTo}</p>
                </div>
              ) : <div />}
              {shipTo ? (
                <div className='min-w-0'>
                  <span className='text-[10px] font-semibold uppercase tracking-wider text-text-quaternary'>Ship To</span>
                  <p className='mt-0.5 truncate text-[12px] text-text-secondary'>{shipTo}</p>
                </div>
              ) : <div />}
            </div>
          )}

          {/* Items */}
          {items.length > 0 && (
            <div className='border-t border-border-light'>
              {items.map((item, i) => (
                <div
                  key={item.autoid}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-[5px]',
                    i < items.length - 1 && 'border-b border-border-light/50',
                  )}
                >
                  <span className='w-[90px] shrink-0 font-mono text-[11px] font-medium text-foreground'>
                    {item.inven}
                  </span>
                  <span className='min-w-0 flex-1 truncate text-[11px] text-text-tertiary'>
                    {item.descr}
                  </span>
                  <span className='shrink-0 rounded bg-bg-secondary px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-text-secondary'>
                    {parseFloat((item.qty_in_uom || item.quan)).toFixed(0)}{item.unit_meas && item.unit_meas !== 'EA' ? ` ${item.unit_meas}` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Pick Item Row ─────────────────────────────────────────

function PickItemRow({
  item,
  pickQuantities,
  updatePickQty,
  formatQty,
  isParent,
  isComponent,
  isLastComponent,
}: {
  item: PickingOrderItem
  pickQuantities: Map<string, string>
  updatePickQty: (autoid: string, value: string, maxQuan: string) => void
  formatQty: (raw: string) => string
  isParent?: boolean
  isComponent?: boolean
  isLastComponent?: boolean
}) {
  const qty = item.qty_in_uom || item.quan
  const orderedStr = formatQty(qty)
  const unitLabel = (item.unit_meas || 'EA').toUpperCase()
  const ordered = parseFloat(qty)
  const pickVal = pickQuantities.get(item.autoid) || '0'
  const picking = parseFloat(pickVal) || 0
  const isPartial = picking < ordered && picking > 0

  if (isParent) {
    return (
      <div className='grid grid-cols-[20px_1fr_52px_40px_52px] items-center gap-2 px-3.5 py-1.5'>
        <div className='flex size-5 items-center justify-center'>
          <Package className='size-4 text-foreground' />
        </div>
        <div className='flex min-w-0 items-center gap-2'>
          <span className='w-[90px] shrink-0 font-mono text-[12px] font-bold leading-none text-foreground'>{item.inven}</span>
          <span className='min-w-0 truncate text-[12px] font-semibold leading-none text-foreground'>{item.descr}</span>
        </div>
        <button
          type='button'
          onClick={() => updatePickQty(item.autoid, formatQty(qty), qty)}
          className='flex h-7 cursor-pointer items-center justify-center rounded-[5px] bg-bg-secondary/60 text-[13px] tabular-nums text-text-tertiary transition-colors hover:bg-primary/10 hover:text-primary'
          title='Pick full quantity'
        >
          {orderedStr}
        </button>
        <span className='text-center text-[11px] font-medium text-text-tertiary'>{unitLabel}</span>
        <input
          type='number'
          value={pickVal}
          onChange={(e) => updatePickQty(item.autoid, e.target.value, qty)}
          min='0'
          step='any'
          className={cn(
            'h-7 w-full rounded-[5px] border bg-background text-center text-[13px] tabular-nums text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20',
            isPartial ? 'border-amber-400' : 'border-border',
          )}
        />
      </div>
    )
  }

  if (isComponent) {
    return (
      <div className='grid grid-cols-[20px_1fr_52px_40px_52px] items-center gap-2 px-3.5 py-0.5'>
        {/* Tree connector in col 1 — vertical + horizontal lines */}
        <div className='relative flex items-center justify-center self-stretch'>
          <div className={cn(
            'absolute left-1/2 w-px -translate-x-1/2 bg-border',
            isLastComponent ? 'top-0 h-1/2' : 'top-0 h-full',
          )} />
          <div className='absolute left-1/2 top-1/2 h-px w-[calc(50%+4px)] bg-border' />
        </div>

        <div className='flex min-w-0 items-center gap-1.5'>
          <Package className={cn('size-3.5 shrink-0', picking > 0 ? 'text-emerald-500' : 'text-text-quaternary/30')} />
          <span className='w-[80px] shrink-0 font-mono text-[11px] text-text-secondary'>{item.inven}</span>
          <span className='min-w-0 truncate text-[11px] text-text-quaternary'>{item.descr}</span>
        </div>

        <button
          type='button'
          onClick={() => {
            const newVal = picking > 0 ? '0' : formatQty(qty)
            updatePickQty(item.autoid, newVal, qty)
          }}
          className='flex h-7 cursor-pointer items-center justify-center rounded-[5px] bg-bg-secondary/60 text-[13px] tabular-nums text-text-tertiary transition-colors hover:bg-primary/10 hover:text-primary'
          title='Pick full quantity'
        >
          {orderedStr}
        </button>
        <span className='text-center text-[11px] font-medium text-text-tertiary'>{unitLabel}</span>
        <input
          type='number'
          value={pickVal}
          onChange={(e) => updatePickQty(item.autoid, e.target.value, qty)}
          min='0'
          step='any'
          className={cn(
            'h-7 w-full rounded-[5px] border bg-background text-center text-[13px] tabular-nums text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20',
            isPartial ? 'border-amber-400' : 'border-border',
          )}
        />
      </div>
    )
  }

  // Normal row (no hierarchy)
  return (
    <div className='grid grid-cols-[20px_1fr_52px_40px_52px] items-center gap-2 px-3.5 py-1'>
      <button
        type='button'
        className='flex size-5 items-center justify-center rounded transition-colors hover:bg-bg-active'
        onClick={() => {
          const newVal = picking > 0 ? '0' : formatQty(qty)
          updatePickQty(item.autoid, newVal, qty)
        }}
      >
        <Package className={cn('size-4', picking > 0 ? 'text-emerald-500' : 'text-text-quaternary/40')} />
      </button>
      <div className='flex min-w-0 items-center gap-2'>
        <span className='w-[90px] shrink-0 font-mono text-[12px] font-medium text-foreground'>{item.inven}</span>
        <span className='min-w-0 truncate text-[11px] text-text-tertiary'>{item.descr}</span>
      </div>
      <button
        type='button'
        onClick={() => updatePickQty(item.autoid, formatQty(qty), qty)}
        className='flex h-7 cursor-pointer items-center justify-center rounded-[5px] bg-bg-secondary/60 text-[13px] tabular-nums text-text-tertiary transition-colors hover:bg-primary/10 hover:text-primary'
        title='Pick full quantity'
      >
        {orderedStr}
      </button>
      <span className='text-center text-[11px] font-medium text-text-tertiary'>{unitLabel}</span>
      <input
        type='number'
        value={pickVal}
        onChange={(e) => updatePickQty(item.autoid, e.target.value, qty)}
        min='0'
        step='any'
        className={cn(
          'h-7 w-full rounded-[5px] border bg-background text-center text-[13px] tabular-nums text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20',
          isPartial ? 'border-amber-400' : 'border-border',
        )}
      />
    </div>
  )
}
