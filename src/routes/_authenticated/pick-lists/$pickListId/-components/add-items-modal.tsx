import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Check, ChevronDown, Package } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

import { getOrdersForPickingQuery } from '@/api/orders-for-picking/query'
import type { PickingOrder, PickingOrderItem } from '@/api/orders-for-picking/schema'
import { PICK_LIST_QUERY_KEYS } from '@/api/pick-list/query'
import { pickListService } from '@/api/pick-list/service'
import type { AddItemsPayload } from '@/api/pick-list/schema'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useProjectId } from '@/hooks/use-project-id'
import { cn } from '@/lib/utils'

interface Props {
  pickListId: number
  customerId: string
  existingDetailAutoids: Set<string>
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 'select-orders' | 'set-quantities'

export function AddItemsModal({ pickListId, customerId, existingDetailAutoids, open, onOpenChange }: Props) {
  const queryClient = useQueryClient()
  const [projectId] = useProjectId()
  const [step, setStep] = useState<Step>('select-orders')
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set())
  const [pickQuantities, setPickQuantities] = useState<Map<string, string>>(new Map())

  const { data, isLoading } = useQuery({
    ...getOrdersForPickingQuery({
      ...(customerId ? { customer_id: customerId } : {}),
      include_items: true,
      project_id: projectId ?? undefined,
      pick_list_id: pickListId,
    }),
    enabled: open,
  })

  const groups = data?.results ?? []
  const orders = groups[0]?.orders ?? []

  const selectedOrders = useMemo(
    () => orders.filter((o) => selectedOrderIds.has(o.autoid)),
    [orders, selectedOrderIds],
  )

  // All items from selected orders, excluding already-in-pick-list items
  const allItems = useMemo(() => {
    const items: (PickingOrderItem & { orderAutoid: string; orderInvoice: string })[] = []
    for (const order of selectedOrders) {
      for (const item of order.items ?? []) {
        const qty = parseFloat(item.qty_in_uom || item.quan || '0')
        if (!item.inven?.trim() && qty <= 0) continue
        if (existingDetailAutoids.has(item.autoid)) continue
        items.push({ ...item, orderAutoid: order.autoid, orderInvoice: order.invoice || order.id })
      }
    }
    return items
  }, [selectedOrders, existingDetailAutoids])

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

  const hasAnyPicked = Array.from(pickQuantities.values()).some((v) => parseFloat(v) > 0)

  const addMutation = useMutation({
    mutationFn: async () => {
      const payload: AddItemsPayload = {
        items: allItems
          .map((item) => ({
            order_autoid: item.orderAutoid,
            detail_autoid: item.autoid,
            picked_quantity: pickQuantities.get(item.autoid) || '0',
          }))
          .filter((item) => parseFloat(item.picked_quantity) > 0),
      }
      if (payload.items.length === 0) throw new Error('No items with quantity > 0')
      return pickListService.addItems(pickListId, payload)
    },
    meta: { successMessage: 'Items added' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PICK_LIST_QUERY_KEYS.detail(pickListId) })
      queryClient.invalidateQueries({ queryKey: PICK_LIST_QUERY_KEYS.lists() })
      resetAndClose()
    },
  })

  const resetAndClose = () => {
    setStep('select-orders')
    setSelectedOrderIds(new Set())
    setPickQuantities(new Map())
    onOpenChange(false)
  }

  // Count existing items per order for badge
  const existingCountPerOrder = useCallback(
    (order: PickingOrder) => {
      const items = order.items ?? []
      return items.filter((i) => existingDetailAutoids.has(i.autoid)).length
    },
    [existingDetailAutoids],
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetAndClose()
        else onOpenChange(next)
      }}
    >
      <DialogContent className='flex max-h-[85vh] flex-col sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>
            {step === 'select-orders' && 'Select Orders'}
            {step === 'set-quantities' && 'Set Pick Quantities'}
          </DialogTitle>
        </DialogHeader>

        <DialogBody className='flex min-h-0 flex-1 flex-col gap-3 overflow-hidden'>
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
                  <p className='text-[13px]'>No available orders found</p>
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
                    {orders.map((order) => {
                      const existingCount = existingCountPerOrder(order)
                      return (
                        <OrderSelectCard
                          key={order.autoid}
                          order={order}
                          selected={selectedOrderIds.has(order.autoid)}
                          onToggle={() => toggleOrder(order.autoid)}
                          existingCount={existingCount}
                          existingDetailAutoids={existingDetailAutoids}
                        />
                      )
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {/* Step 2: Set pick quantities */}
          {step === 'set-quantities' && (
            <div className='min-h-0 flex-1 space-y-3 overflow-y-auto'>
              {allItems.length === 0 ? (
                <div className='flex flex-col items-center py-8 text-center text-text-tertiary'>
                  <Package className='mb-2 size-8 opacity-50' />
                  <p className='text-[13px]'>All items from selected orders are already in this pick list</p>
                </div>
              ) : (
                <>
                  {/* Global actions */}
                  <div className='flex items-center gap-3'>
                    <button
                      type='button'
                      className='inline-flex h-7 items-center gap-1.5 rounded-[5px] border border-emerald-200 bg-emerald-500/10 px-2.5 text-[12px] font-medium text-emerald-700 transition-colors hover:bg-emerald-500/20 dark:border-emerald-700 dark:text-emerald-400'
                      onClick={() => {
                        const qty = new Map(pickQuantities)
                        for (const item of allItems) {
                          qty.set(item.autoid, formatQty(item.qty_in_uom || item.quan))
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
                        for (const item of allItems) qty.set(item.autoid, '0')
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
                    const items = (order.items ?? []).filter(
                      (it) => !existingDetailAutoids.has(it.autoid) && (it.inven?.trim() || parseFloat(it.qty_in_uom || it.quan || '0') > 0),
                    )
                    if (items.length === 0) return null

                    const parentItems = items.filter((it) => !it.par_time)
                    const componentsByParent = new Map<string, typeof items>()
                    for (const it of items) {
                      if (it.par_time) {
                        const arr = componentsByParent.get(it.par_time) ?? []
                        arr.push(it)
                        componentsByParent.set(it.par_time, arr)
                      }
                    }
                    const hasHierarchy = parentItems.length > 0 && parentItems.length < items.length

                    return (
                      <div key={order.autoid} className='overflow-hidden rounded-lg border border-border'>
                        <div className='flex items-center gap-2 bg-bg-secondary/50 px-3.5 py-2'>
                          <span className='text-[13px] font-semibold text-foreground'>
                            #{(order.invoice || order.id).trim()}
                          </span>
                          <div className='flex-1' />
                          <button
                            type='button'
                            className='text-[11px] font-medium text-primary hover:underline'
                            onClick={() => {
                              const qty = new Map(pickQuantities)
                              for (const item of items) qty.set(item.autoid, formatQty(item.qty_in_uom || item.quan))
                              setPickQuantities(qty)
                            }}
                          >
                            Pick all
                          </button>
                          <span className='text-[11px] text-text-quaternary'>
                            {items.length} item{items.length !== 1 && 's'}
                          </span>
                        </div>

                        <div className='grid grid-cols-[20px_1fr_52px_40px_52px] items-center gap-2 border-b border-border-light bg-bg-secondary/40 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-quaternary'>
                          <span />
                          <span>Item</span>
                          <span className='text-center'>Qty</span>
                          <span className='text-center'>UOM</span>
                          <span className='text-center'>Pick</span>
                        </div>

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
                              {comps.map((comp, ci) => (
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
                </>
              )}
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          {step === 'select-orders' && (
            <>
              <Button variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button disabled={selectedOrderIds.size === 0} onClick={goToQuantities}>
                Next <ArrowRight className='size-3.5' />
              </Button>
            </>
          )}
          {step === 'set-quantities' && (
            <>
              <Button variant='outline' onClick={() => setStep('select-orders')}>
                <ArrowLeft className='size-3.5' /> Back
              </Button>
              <Button
                onClick={() => addMutation.mutate()}
                isPending={addMutation.isPending}
                disabled={!hasAnyPicked}
              >
                <Check className='size-3.5' /> Add Items
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Order Select Card ───────────────────────────────────────

function OrderSelectCard({
  order,
  selected,
  onToggle,
  existingCount,
  existingDetailAutoids,
}: {
  order: PickingOrder
  selected: boolean
  onToggle: () => void
  existingCount: number
  existingDetailAutoids: Set<string>
}) {
  const [expanded, setExpanded] = useState(false)
  const items = order.items ?? []

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border transition-all duration-100',
        selected
          ? 'border-primary ring-1 ring-primary/20'
          : 'border-border hover:border-border-light hover:shadow-sm',
      )}
    >
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
            selected ? 'border-primary bg-primary text-white' : 'border-border bg-background',
          )}
        >
          {selected && (
            <svg className='size-2.5' viewBox='0 0 12 12' fill='none'>
              <path d='M2.5 6L5 8.5L9.5 3.5' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
          )}
        </div>
        <span className='text-[13px] font-semibold text-foreground'>#{order.invoice || order.id}</span>
        {existingCount > 0 && (
          <span className='rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400'>
            {existingCount} already picked
          </span>
        )}
        <div className='flex-1' />
        <span className='text-[12px] tabular-nums text-text-tertiary'>
          {items.length} item{items.length !== 1 && 's'}
        </span>
        <button
          type='button'
          className='inline-flex size-5 items-center justify-center rounded text-text-quaternary transition-colors hover:bg-bg-active hover:text-text-secondary'
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v) }}
        >
          <ChevronDown className={cn('size-3.5 transition-transform duration-150', expanded && 'rotate-180')} />
        </button>
      </div>

      {expanded && items.length > 0 && (
        <div className='border-t border-border-light'>
          {items.map((item, i) => {
            const alreadyPicked = existingDetailAutoids.has(item.autoid)
            return (
              <div
                key={item.autoid}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-[5px]',
                  i < items.length - 1 && 'border-b border-border-light/50',
                  alreadyPicked && 'opacity-40',
                )}
              >
                <span className='w-[90px] shrink-0 font-mono text-[11px] font-medium text-foreground'>
                  {item.inven}
                </span>
                <span className='min-w-0 flex-1 truncate text-[11px] text-text-tertiary'>{item.descr}</span>
                <span className='shrink-0 rounded bg-bg-secondary px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-text-secondary'>
                  {parseFloat(item.qty_in_uom || item.quan).toFixed(0)}{item.unit_meas && item.unit_meas !== 'EA' ? ` ${item.unit_meas}` : ''}
                </span>
                {alreadyPicked && (
                  <span className='shrink-0 text-[10px] font-medium text-amber-600 dark:text-amber-400'>In list</span>
                )}
              </div>
            )
          })}
        </div>
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
        <div className='relative flex items-center justify-center self-stretch'>
          <div className={cn('absolute left-1/2 w-px -translate-x-1/2 bg-border', isLastComponent ? 'top-0 h-1/2' : 'top-0 h-full')} />
          <div className='absolute left-1/2 top-1/2 h-px w-[calc(50%+4px)] bg-border' />
        </div>
        <div className='flex min-w-0 items-center gap-1.5'>
          <Package className={cn('size-3.5 shrink-0', picking > 0 ? 'text-emerald-500' : 'text-text-quaternary/30')} />
          <span className='w-[80px] shrink-0 font-mono text-[11px] text-text-secondary'>{item.inven}</span>
          <span className='min-w-0 truncate text-[11px] text-text-quaternary'>{item.descr}</span>
        </div>
        <button
          type='button'
          onClick={() => { updatePickQty(item.autoid, picking > 0 ? '0' : formatQty(qty), qty) }}
          className='flex h-7 cursor-pointer items-center justify-center rounded-[5px] bg-bg-secondary/60 text-[13px] tabular-nums text-text-tertiary transition-colors hover:bg-primary/10 hover:text-primary'
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

  return (
    <div className='grid grid-cols-[20px_1fr_52px_40px_52px] items-center gap-2 px-3.5 py-1'>
      <button
        type='button'
        className='flex size-5 items-center justify-center rounded transition-colors hover:bg-bg-active'
        onClick={() => { updatePickQty(item.autoid, picking > 0 ? '0' : formatQty(qty), qty) }}
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
