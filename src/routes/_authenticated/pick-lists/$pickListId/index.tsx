import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  Ban,
  Box,
  Check,
  ClipboardList,
  MapPin,
  Package,
  RefreshCw,
  Trash2,
  Truck,
  TriangleAlert,
} from 'lucide-react'
import { useMemo, useState } from 'react'


import { PICK_LIST_QUERY_KEYS, getPickListDetailQuery } from '@/api/pick-list/query'
import { pickListService } from '@/api/pick-list/service'
import { ShippingDialog } from './-components/shipping-dialog'
import { IPickLists, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'

import {
  PICK_LIST_STATUS,
  PICK_LIST_STATUS_CLASS,
  getPickListStatusLabel,
} from '@/constants/pick-list'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { cn } from '@/lib/utils'

// ── Helpers ──────────────────────────────────────────────────

function formatDateTime(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatQty(v: string) {
  const n = parseFloat(v)
  return isNaN(n) ? v : n % 1 === 0 ? n.toFixed(0) : String(parseFloat(n.toFixed(4)))
}

// ── Page ─────────────────────────────────────────────────────

const PickListDetailPage = () => {
  const { pickListId } = Route.useParams()
  const id = Number(pickListId)
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const queryClient = useQueryClient()

  const { data: pickList, isLoading } = useQuery(getPickListDetailQuery(id))

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [voidOpen, setVoidOpen] = useState(false)
  const [shippingOpen, setShippingOpen] = useState(false)

  const isPartiallyFailed = pickList?.status === PICK_LIST_STATUS.partiallyFailed
  const isPushed = pickList?.status === PICK_LIST_STATUS.pushed
  const isRatesFetched = pickList?.status === PICK_LIST_STATUS.ratesFetched
  const isLabelPurchased = pickList?.status === PICK_LIST_STATUS.labelPurchased

  const items = pickList?.items ?? []

  // Group items by order
  const orderGroups = useMemo(() => {
    const map = new Map<string, typeof items>()
    for (const item of items) {
      const key = item.order_autoid
      const arr = map.get(key) ?? []
      arr.push(item)
      map.set(key, arr)
    }
    return Array.from(map.entries())
  }, [items])

  const allShipments = pickList?.shipments ?? []

  // ── Mutations ──────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: () => pickListService.delete(id),
    meta: { successMessage: 'Pick list deleted', invalidatesQuery: PICK_LIST_QUERY_KEYS.lists() },
    onSuccess: () => window.history.back(),
  })

  const pushMutation = useMutation({
    mutationFn: () => pickListService.push(id),
    meta: { successMessage: 'Pushed to EBMS' },
    onSuccess: (updated) => {
      queryClient.setQueryData(PICK_LIST_QUERY_KEYS.detail(id), updated)
    },
  })

  const voidMutation = useMutation({
    mutationFn: () => pickListService.voidLabel(id),
    meta: { successMessage: 'Label voided' },
    onSuccess: (updated) => {
      queryClient.setQueryData(PICK_LIST_QUERY_KEYS.detail(id), updated)
      setVoidOpen(false)
    },
  })

  // ── Loading / Not found ────────────────────────────────

  if (isLoading) {
    return (
      <div className='flex h-full flex-col overflow-hidden'>
        <header className={cn('flex h-12 shrink-0 items-center gap-2.5 border-b border-border', isMobile ? 'px-3.5' : 'px-6')}>
          <SidebarTrigger className='-ml-1' />
          <Skeleton className='h-5 w-40' />
        </header>
        <div className='flex-1 p-6'>
          <Skeleton className='mb-4 h-6 w-48' />
          <Skeleton className='mb-2 h-4 w-72' />
          <Skeleton className='h-64 w-full' />
        </div>
      </div>
    )
  }

  if (!pickList) {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-2'>
        <ClipboardList className='size-10 text-text-tertiary' />
        <p className='text-[14px] font-semibold'>Pick list not found</p>
        <Link to='/pick-lists' className='text-[13px] text-primary hover:underline'>
          Back to pick lists
        </Link>
      </div>
    )
  }

  const statusLabel = getPickListStatusLabel(pickList.status)
  const statusClass = PICK_LIST_STATUS_CLASS[pickList.status] ?? ''
  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* Header */}
      <header
        className={cn(
          'flex h-12 shrink-0 items-center gap-2.5 border-b border-border',
          isMobile ? 'px-3.5' : 'px-6',
        )}
      >
        <SidebarTrigger className='-ml-1' />
        <Link
          to='/pick-lists'
          className='flex items-center gap-1 text-[13px] text-text-tertiary transition-colors hover:text-foreground'
        >
          <ArrowLeft className='size-3.5' />
          {!isMobile && 'Pick Lists'}
        </Link>
        <div className='mx-1 text-text-tertiary'>/</div>
        <PageHeaderIcon icon={IPickLists} color={PAGE_COLORS.pickLists} />
        <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>#{pickList.id}</h1>
        <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none', statusClass)}>
          {statusLabel}
        </span>

        <div className='flex-1' />

        {/* Actions */}
        <div className='flex items-center gap-1.5'>
          {isPushed && (
            <Button size='sm' onClick={() => setShippingOpen(true)}>
              <Box className='size-3.5' />
              {!isMobile && 'Create Package'}
            </Button>
          )}
          {isRatesFetched && (
            <Button size='sm' onClick={() => setShippingOpen(true)}>
              <Truck className='size-3.5' />
              {!isMobile && 'Purchase Label'}
            </Button>
          )}
          {isPartiallyFailed && (
            <Button size='sm' onClick={() => pushMutation.mutate()} isPending={pushMutation.isPending}>
              <RefreshCw className='size-3.5' />
              {!isMobile && 'Retry Push'}
            </Button>
          )}
          {isLabelPurchased && (
            <Button
              size='sm'
              variant='outline'
              className='border-red-300 text-red-700 hover:bg-red-500/10 dark:border-red-600 dark:text-red-400'
              onClick={() => setVoidOpen(true)}
            >
              <Ban className='size-3.5' />
              {!isMobile && 'Void Label'}
            </Button>
          )}
          <Button size='icon-sm' variant='ghost' className='text-destructive' onClick={() => setDeleteOpen(true)}>
            <Trash2 className='size-3.5' />
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className='flex-1 overflow-y-auto'>
        <div className={cn(isMobile ? 'px-3.5 py-4' : 'px-6 py-5')}>

          {/* Summary card */}
          <div className='mb-6 overflow-hidden rounded-lg border border-border'>
            <div className='grid md:grid-cols-2'>
              {/* Left: Details */}
              <div className='p-4'>
                <h2 className='text-[15px] font-semibold text-foreground'>
                  {pickList.name || `Pick List #${pickList.id}`}
                </h2>
                <div className='mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-text-tertiary'>
                  <span className='inline-flex items-center gap-1'>
                    <Package className='size-3' />
                    {items.length} item{items.length !== 1 && 's'}
                  </span>
                  <span>·</span>
                  <span>{orderGroups.length} order{orderGroups.length !== 1 && 's'}</span>
                  <span>·</span>
                  <span>{formatDateTime(pickList.created_at)}</span>
                </div>
                <div className='mt-3'>
                  <StatusLifecycle currentStatus={pickList.status} />
                </div>
              </div>

              {/* Right: Ship To */}
              <div className='border-t border-border p-4 md:border-l md:border-t-0'>
                <div className='mb-1.5 flex items-center gap-1.5'>
                  <MapPin className='size-3 text-text-quaternary' />
                  <span className='text-[11px] font-semibold uppercase tracking-wider text-text-quaternary'>Ship To</span>
                </div>
                {pickList.ship_to ? (
                  <>
                    <p className='text-[13px] font-medium text-foreground'>{pickList.ship_to.name}</p>
                    <p className='text-[12px] text-text-tertiary'>{pickList.ship_to.address1}</p>
                    {pickList.ship_to.address2 && (
                      <p className='text-[12px] text-text-tertiary'>{pickList.ship_to.address2}</p>
                    )}
                    <p className='text-[12px] text-text-tertiary'>
                      {[pickList.ship_to.city, pickList.ship_to.state].filter(Boolean).join(', ')} {pickList.ship_to.postal}
                    </p>
                  </>
                ) : (
                  <p className='text-[12px] text-text-quaternary'>No address set</p>
                )}
              </div>
            </div>
          </div>

          {/* Orders & Items */}
          <div className='mb-6'>
            <div className='mb-3 flex items-center gap-2'>
              <Package className='size-4 text-text-tertiary' />
              <span className='text-[13px] font-semibold text-foreground'>
                Items by Order
              </span>
            </div>

            <div className='space-y-3'>
              {orderGroups.map(([orderAutoid, orderItems]) => (
                <div key={orderAutoid} className='overflow-hidden rounded-lg border border-border'>
                  <div className='flex items-center gap-2 bg-bg-secondary/50 px-3.5 py-2'>
                    <span className='text-[12px] font-semibold text-foreground'>
                      Order {orderAutoid.slice(0, 12)}...
                    </span>
                    <div className='flex-1' />
                    <span className='text-[11px] text-text-quaternary'>
                      {orderItems.length} item{orderItems.length !== 1 && 's'}
                    </span>
                  </div>
                  <div>
                    {orderItems.map((item, i) => (
                      <div
                        key={item.id}
                        className={cn(
                          'flex items-center gap-3 px-3.5 py-[6px]',
                          i < orderItems.length - 1 && 'border-b border-border-light/50',
                        )}
                      >
                        <span className='w-[160px] shrink-0 truncate font-mono text-[12px] font-medium text-foreground'>
                          {item.detail_autoid.slice(0, 16)}
                        </span>
                        <div className='flex-1' />
                        <span className='rounded bg-bg-secondary px-1.5 py-0.5 text-[12px] font-medium tabular-nums text-text-secondary'>
                          {formatQty(item.picked_quantity)}
                        </span>
                        {item.push_status && (
                          <span className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none',
                            item.push_status === 'success'
                              ? 'border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400'
                              : 'border-red-200 bg-red-500/10 text-red-700 dark:border-red-700 dark:text-red-400',
                          )}>
                            {item.push_status === 'success' ? <Check className='size-2.5' /> : '!'}
                            {item.push_status === 'success' ? 'Pushed' : 'Failed'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipments */}
          {allShipments.length > 0 && (
            <div className='mb-6'>
              <div className='mb-3 flex items-center gap-2'>
                <Truck className='size-4 text-text-tertiary' />
                <span className='text-[13px] font-semibold text-foreground'>
                  Shipments ({allShipments.length})
                </span>
              </div>
              <div className='space-y-2'>
                {allShipments.map((shipment) => (
                  <div
                    key={shipment.id}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border px-3.5 py-2.5',
                      shipment.voided
                        ? 'border-border bg-bg-secondary/30 opacity-60'
                        : 'border-border',
                    )}
                  >
                    <Truck className={cn('size-4 shrink-0', shipment.voided ? 'text-text-quaternary' : 'text-emerald-500')} />
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-2'>
                        <span className='text-[13px] font-medium text-foreground'>
                          {shipment.service_name || shipment.carrier_id}
                        </span>
                        {shipment.voided && (
                          <span className='rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400'>
                            Voided
                          </span>
                        )}
                      </div>
                      {shipment.tracking_number && (
                        <span className='text-[12px] font-mono text-text-tertiary'>
                          {shipment.tracking_number}
                        </span>
                      )}
                    </div>
                    <span className='text-[13px] font-medium tabular-nums text-foreground'>
                      ${parseFloat(shipment.cost || '0').toFixed(2)}
                    </span>
                    <span className='text-[11px] text-text-quaternary'>
                      {new Date(shipment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <ShippingDialog pickList={pickList} open={shippingOpen} onOpenChange={setShippingOpen} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className='bg-destructive/10 text-destructive'><Trash2 /></AlertDialogMedia>
            <AlertDialogTitle>Delete Pick List</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete pick list #{pickList.id}? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant='destructive' onClick={() => deleteMutation.mutate()} isPending={deleteMutation.isPending}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={voidOpen} onOpenChange={setVoidOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className='bg-destructive/10 text-destructive'><TriangleAlert /></AlertDialogMedia>
            <AlertDialogTitle>Void Label</AlertDialogTitle>
            <AlertDialogDescription>
              This will void the shipping label. The pick list will return to pushed status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant='destructive' onClick={() => voidMutation.mutate()} isPending={voidMutation.isPending}>
              Void Label
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ── Status Lifecycle ─────────────────────────────────────────

const LIFECYCLE_STEPS = [
  { status: PICK_LIST_STATUS.pushed, label: 'Pushed to EBMS' },
  { status: PICK_LIST_STATUS.ratesFetched, label: 'Rates Fetched' },
  { status: PICK_LIST_STATUS.labelPurchased, label: 'Label Purchased' },
] as const

function StatusLifecycle({ currentStatus }: { currentStatus: string }) {
  const currentIndex = LIFECYCLE_STEPS.findIndex((s) => s.status === currentStatus)
  const isPartiallyFailed = currentStatus === PICK_LIST_STATUS.partiallyFailed

  return (
    <div className='flex items-center gap-1'>
      {LIFECYCLE_STEPS.map((step, i) => {
        const isActive = step.status === currentStatus
        const isPast = currentIndex >= 0 && i < currentIndex
        return (
          <div key={step.status} className='flex items-center gap-1'>
            {i > 0 && (
              <div className={cn('h-px w-5', isPast || isActive ? 'bg-primary' : 'bg-border')} />
            )}
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-medium',
                isActive
                  ? 'bg-primary/10 font-semibold text-primary'
                  : isPast
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'bg-bg-secondary text-text-tertiary',
              )}
            >
              {step.label}
            </span>
          </div>
        )
      })}
      {isPartiallyFailed && (
        <>
          <div className='h-px w-5 bg-red-400' />
          <span className='rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:text-red-400'>
            Partially Failed
          </span>
        </>
      )}
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/pick-lists/$pickListId/')({
  component: PickListDetailPage,
  head: () => ({ meta: [{ title: 'Pick List' }] }),
})
