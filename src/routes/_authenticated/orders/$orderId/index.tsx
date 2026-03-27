import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Check, ChevronLeft, ClipboardList, Copy, ExternalLink, ListTodo, Package, PackageCheck, Paperclip, StickyNote, Trash2, Truck, UserPlus, XCircle } from 'lucide-react'

import { PageEmpty } from '@/components/common/page-empty'
import { EntityAttachmentsDialog } from '@/components/common/entity-attachments/entity-attachments-dialog'
import { EntityNotesSheet } from '@/components/common/entity-notes/entity-notes-sheet'
import { ShippingRatesDialog } from './-components/shipping-rates-dialog'
import { PanelSection, PanelRow, PanelBlock, PropertyField, SummaryCell } from './-components/order-properties'
import { useCallback, useMemo, useState } from 'react'

import { getFieldConfigQuery } from '@/api/field-config/query'
import { getOrderDetailQuery, ORDER_QUERY_KEYS } from '@/api/order/query'
import type { Order, OrderPatchPayload } from '@/api/order/schema'
import { orderService } from '@/api/order/service'
import { IOrders, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import { OrderAssignDialog } from '@/routes/_authenticated/orders/-components/order-assign-dialog'
import { StartPickingDialog } from '@/components/common/start-picking-dialog'
import { CommandBarCreate } from '@/components/tasks/command-bar-create'
import { ORDER_STATUS_CLASS, ORDER_STATUS_LABELS } from '@/constants/order'
import type { OrderStatus } from '@/constants/order'
import { getColumnLabel } from '@/helpers/dynamic-columns'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { useProjectId } from '@/hooks/use-project-id'
import { formatCurrency, formatDate, getUserDisplayName } from '@/helpers/formatters'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/orders/$orderId/')({
  component: OrderDetailPage,
  head: () => ({
    meta: [{ title: 'Order Detail' }],
  }),
})

// ── Helpers ──────────────────────────────────────────────────

const STATUS_DOT_COLORS: Record<string, string> = {
  U: 'bg-amber-500',
  O: 'bg-blue-500',
  X: 'bg-emerald-500',
  P: 'bg-green-500',
  V: 'bg-red-500',
  H: 'bg-slate-400',
  A: 'bg-purple-500',
}

function formatAddress(
  line1?: string | null,
  line2?: string | null,
  city?: string | null,
  state?: string | null,
  zip?: string | null,
) {
  const parts = [line1, line2, [city, state, zip].filter(Boolean).join(', ')].filter(Boolean)
  return parts.length > 0 ? parts.join('\n') : null
}

// ── Page Component ───────────────────────────────────────────

function OrderDetailPage() {
  const { orderId } = Route.useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const [projectId] = useProjectId()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [panelTab, setPanelTab] = useState<'general' | 'custom' | 'shipments'>('general')
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [shippingOpen, setShippingOpen] = useState(false)
  const [attachmentsOpen, setAttachmentsOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)

  const { data: order, isLoading } = useQuery(getOrderDetailQuery(orderId, projectId))
  const { data: fieldConfig } = useQuery(getFieldConfigQuery(projectId))

  const patchMutation = useMutation({
    mutationFn: (payload: OrderPatchPayload) =>
      orderService.patch(orderId, payload, projectId),
    onSuccess: (updated) => {
      queryClient.setQueryData(ORDER_QUERY_KEYS.detail(orderId), updated)
    },
    meta: {
      errorMessage: 'Failed to update order',
    },
  })

  const handleFieldSave = useCallback(
    (field: string, value: string) => {
      if (!order) return
      const current = (order[field] as string | null) ?? ''
      if (value === current) return
      patchMutation.mutate({ [field]: value || null })
    },
    [order, patchMutation],
  )

  // Custom fields: enabled non-default fields from field config
  const customFields = useMemo(() => {
    const entries = fieldConfig?.order ?? []
    return entries.filter((e) => !e.default && e.enabled)
  }, [fieldConfig])

  // Line item custom columns from order_item field config
  const itemCustomCols = useMemo(() => {
    const entries = fieldConfig?.order_item ?? []
    return entries.filter((e) => !e.default && e.enabled)
  }, [fieldConfig])

  const [assignOpen, setAssignOpen] = useState(false)
  const [pickingOpen, setPickingOpen] = useState(false)

  const pickMutation = useMutation({
    mutationFn: ({ itemAutoid, isPicked }: { itemAutoid: string; isPicked: boolean }) =>
      orderService.setItemPickStatus(orderId, itemAutoid, { is_picked: isPicked }, projectId),
    onMutate: async ({ itemAutoid, isPicked }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ORDER_QUERY_KEYS.detail(orderId) })
      const prev = queryClient.getQueryData<Order>(ORDER_QUERY_KEYS.detail(orderId))
      if (prev?.items) {
        const updatedItems = prev.items.map((item) =>
          item.autoid === itemAutoid ? { ...item, is_picked: isPicked } : item,
        )
        const pickedCount = updatedItems.filter((i) => i.is_picked).length
        queryClient.setQueryData(ORDER_QUERY_KEYS.detail(orderId), {
          ...prev,
          items: updatedItems,
          pick_status: `${pickedCount}/${updatedItems.length}`,
        })
      }
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(ORDER_QUERY_KEYS.detail(orderId), ctx.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.detail(orderId) })
      queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.lists() })
    },
    meta: { errorMessage: 'Failed to update pick status' },
  })

  const deleteMutation = useMutation({
    mutationFn: () => orderService.delete(orderId, projectId!),
    meta: {
      successMessage: 'Order deleted',
      invalidatesQuery: ORDER_QUERY_KEYS.lists(),
    },
    onSuccess: () => router.history.back(),
  })

  const voidShipmentMutation = useMutation({
    mutationFn: ({ shipmentId, shipmentOrderAutoid }: { shipmentId: number; shipmentOrderAutoid?: string }) =>
      orderService.voidShipment(shipmentOrderAutoid || orderId, shipmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.detail(orderId) })
      toast.success('Shipment voided')
    },
    onError: () => toast.error('Failed to void shipment'),
  })

  // Loading
  if (isLoading) {
    return (
      <div className='flex h-full flex-col overflow-hidden'>
        {/* Header skeleton */}
        <header className={cn('flex h-12 shrink-0 items-center gap-2.5 border-b border-border', isMobile ? 'px-3.5' : 'px-6')}>
          <SidebarTrigger className='-ml-1' />
          <Skeleton className='h-4 w-12' />
          <Skeleton className='size-5 rounded-[5px]' />
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-5 w-[72px] rounded-full' />
          <div className='flex-1' />
          <Skeleton className='size-7 rounded-[5px]' />
          <Skeleton className='size-7 rounded-[5px]' />
        </header>

        <div className={cn('flex min-h-0 flex-1', isMobile && 'flex-col')}>
          {/* Table skeleton */}
          <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
            {/* Table header */}
            <div className='flex items-center gap-3 border-b border-border bg-bg-secondary/60 py-1.5 pl-6 pr-6'>
              <Skeleton className='h-3 w-10' />
              <Skeleton className='h-3 w-16' />
              <Skeleton className='h-3 w-32' />
              <div className='flex-1' />
              <Skeleton className='h-3 w-8' />
              <Skeleton className='h-3 w-8' />
              <Skeleton className='h-3 w-12' />
              <Skeleton className='h-3 w-14' />
            </div>
            {/* Table rows */}
            <div className='flex-1'>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className='flex items-center gap-3 border-b border-border-light py-2 pl-6 pr-6'>
                  <Skeleton className='size-[18px] rounded-[4px]' />
                  <Skeleton className='h-3 w-20' />
                  <Skeleton className='h-3 w-40' />
                  <div className='flex-1' />
                  <Skeleton className='h-3 w-8' />
                  <Skeleton className='h-3 w-8' />
                  <Skeleton className='h-3 w-14' />
                  <Skeleton className='h-3 w-16' />
                </div>
              ))}
            </div>
            {/* Summary footer skeleton */}
            <div className='flex shrink-0 items-center gap-5 border-t border-border bg-bg-secondary/40 px-6 py-2'>
              <Skeleton className='h-3 w-14' />
              <Skeleton className='h-3 w-14' />
              <Skeleton className='h-3 w-14' />
              <div className='flex-1' />
              <Skeleton className='h-3 w-16' />
              <Skeleton className='h-3 w-12' />
              <Skeleton className='h-3 w-16' />
              <Skeleton className='h-3 w-16' />
            </div>
          </div>

          {/* Right panel skeleton */}
          {!isMobile && (
            <div className='w-[380px] shrink-0 border-l border-border bg-bg-secondary/50'>
              <div className='flex items-center gap-0 border-b border-border px-4'>
                <Skeleton className='my-2 h-4 w-14' />
                <Skeleton className='my-2 ml-4 h-4 w-14' />
              </div>
              <div className='space-y-3 px-4 py-3'>
                <Skeleton className='h-3 w-16' />
                <div className='grid grid-cols-2 gap-x-4 gap-y-2'>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i}>
                      <Skeleton className='mb-1 h-2.5 w-12' />
                      <Skeleton className='h-3.5 w-full' />
                    </div>
                  ))}
                </div>
                <Skeleton className='h-3 w-20' />
                <div className='grid grid-cols-2 gap-x-4 gap-y-2'>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i}>
                      <Skeleton className='mb-1 h-2.5 w-12' />
                      <Skeleton className='h-3.5 w-full' />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Not found
  if (!order) {
    return (
      <div className='flex h-full items-center justify-center'>
        <PageEmpty icon={Package} title='Order not found' description='This order may have been deleted or you may not have access.' />
      </div>
    )
  }

  const statusLabel = ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status
  const dotColor = STATUS_DOT_COLORS[order.status] ?? 'bg-slate-400'
  const statusClass = ORDER_STATUS_CLASS[order.status as OrderStatus] ?? ''
  const items = order.items ?? []
  const assignedUsers = order.assigned_users ?? (order.assigned_user ? [order.assigned_user] : [])
  const billToAddress = formatAddress(order.address1, order.address2, order.city, order.state, order.zip)
  const shipToAddress = formatAddress(order.c_address1, order.c_address2, order.c_city, order.c_state, order.c_zip)

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* ── Header bar ── */}
      <header className={cn('flex h-12 shrink-0 items-center gap-2.5 border-b border-border', isMobile ? 'px-3.5' : 'px-6')}>
        <SidebarTrigger className='-ml-1' />
        <button
          type='button'
          className='inline-flex h-7 items-center gap-0.5 rounded-[6px] border border-border bg-bg-secondary pl-1.5 pr-2.5 text-[13px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground'
          onClick={() => router.history.back()}
        >
          <ChevronLeft className='size-3.5' />
          <span className='hidden sm:inline'>Orders</span>
        </button>

        <PageHeaderIcon icon={IOrders} color={PAGE_COLORS.orders} />
        <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>
          {order.invoice || `Order ${order.id}`}
        </h1>
        {order.invoice && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type='button'
                className='inline-flex size-6 items-center justify-center rounded-[5px] text-text-tertiary transition-colors duration-[80ms] hover:bg-bg-hover hover:text-foreground'
                onClick={() => {
                  navigator.clipboard.writeText(order.invoice)
                  toast.success('Invoice # copied')
                }}
              >
                <Copy className='size-3' />
              </button>
            </TooltipTrigger>
            <TooltipContent>Copy invoice #</TooltipContent>
          </Tooltip>
        )}

        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[12px] font-semibold leading-none',
            statusClass,
          )}
        >
          <span className={cn('size-1.5 rounded-full', dotColor)} />
          {statusLabel}
        </span>

        {/* Assignee */}
        <div className='hidden items-center gap-1.5 sm:flex'>
          <button
            type='button'
            className={cn(
              'inline-flex h-7 items-center gap-1.5 rounded-[5px] border px-2.5 text-[12px] font-medium transition-colors duration-[80ms]',
              assignedUsers.length > 0
                ? 'border-primary/20 bg-primary/[0.06] text-primary hover:bg-primary/[0.1]'
                : 'border-border bg-bg-secondary text-text-secondary hover:bg-bg-active hover:text-foreground'
            )}
            onClick={() => setAssignOpen(true)}
          >
            <UserPlus className='size-3.5' />
            {assignedUsers.length > 0
              ? assignedUsers.map((u) => getUserDisplayName(u)).join(', ')
              : 'Assign'}
          </button>
        </div>

        <div className='flex-1' />

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type='button'
              className='inline-flex h-7 items-center gap-1.5 rounded-[5px] border border-border bg-bg-secondary px-2.5 text-[12px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground'
              onClick={() => setShippingOpen(true)}
            >
              <Truck className='size-3.5' />
              <span className='hidden sm:inline'>Shipping</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>Manage Shipping</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type='button'
              className='inline-flex h-7 items-center gap-1.5 rounded-[5px] border border-border bg-bg-secondary px-2.5 text-[12px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground'
              onClick={() => setPickingOpen(true)}
            >
              <ClipboardList className='size-3.5' />
              <span className='hidden sm:inline'>Start Picking</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>Start picking for this customer</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type='button'
              className='inline-flex h-7 items-center gap-1.5 rounded-[5px] border border-border bg-bg-secondary px-2.5 text-[12px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground'
              onClick={() => setTaskModalOpen(true)}
            >
              <ListTodo className='size-3.5' />
              <span className='hidden sm:inline'>Create Task</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>Create Task</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type='button'
              className='inline-flex h-7 items-center gap-1.5 rounded-[5px] border border-border bg-bg-secondary px-2.5 text-[12px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground'
              onClick={() => setNotesOpen(true)}
            >
              <StickyNote className='size-3.5' />
              <span className='hidden sm:inline'>Notes</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>Notes</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type='button'
              className='inline-flex h-7 items-center gap-1.5 rounded-[5px] border border-border bg-bg-secondary px-2.5 text-[12px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground'
              onClick={() => setAttachmentsOpen(true)}
            >
              <Paperclip className='size-3.5' />
              <span className='hidden sm:inline'>Attachments</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>Attachments</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type='button'
              className='inline-flex size-7 items-center justify-center rounded-[5px] text-text-tertiary transition-colors duration-[80ms] hover:bg-bg-hover hover:text-destructive'
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className='size-3.5' />
            </button>
          </TooltipTrigger>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
      </header>

      {/* ── Main content area ── */}
      <div className={cn('flex min-h-0 flex-1', isMobile && 'flex-col')}>
        {/* Left: Line items */}
        <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
          <div className='flex-1 overflow-auto'>
            {items.length === 0 ? (
              <PageEmpty icon={Package} title='No items in this order' compact />
            ) : (
              <table className='w-full text-[13px]'>
                <thead className='sticky top-0 z-10 select-none bg-bg-secondary/60 backdrop-blur-sm'>
                  <tr className='border-b border-border text-left'>
                    <th className='w-[36px] py-1.5 pl-6 pr-0 font-medium text-text-tertiary'>Picked</th>
                    <th className='w-[50px] px-3 py-1.5 font-medium text-text-tertiary'>Packed</th>
                    <th className='min-w-[130px] px-3 py-1.5 font-medium text-text-tertiary'>Inventory</th>
                    <th className='min-w-[200px] px-3 py-1.5 font-medium text-text-tertiary'>Description</th>
                    <th className='w-[70px] px-3 py-1.5 text-right font-medium text-text-tertiary'>Qty</th>
                    <th className='w-[60px] px-3 py-1.5 text-right font-medium text-text-tertiary'>Ship</th>
                    <th className='w-[90px] px-3 py-1.5 text-right font-medium text-text-tertiary'>Price</th>
                    {itemCustomCols.map((col) => (
                      <th key={col.field} className='min-w-[80px] px-3 py-1.5 font-medium text-text-tertiary'>
                        {getColumnLabel(col.field, 'order_item', fieldConfig)}
                      </th>
                    ))}
                    <th className='w-[100px] py-1.5 pl-3 pr-6 text-right font-medium text-text-tertiary'>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr
                      key={item.autoid ?? i}
                      className={cn(
                        'border-b border-border-light transition-colors duration-100 hover:bg-bg-hover',
                        item.is_picked && 'bg-emerald-500/[0.03]',
                      )}
                    >
                      <td className='py-1.5 pl-6 pr-0'>
                        <button
                          type='button'
                          className={cn(
                            'flex size-[18px] items-center justify-center rounded-[4px] border transition-colors duration-75',
                            item.is_picked
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-border-heavy hover:border-primary/50 hover:bg-primary/5',
                          )}
                          onClick={() => pickMutation.mutate({ itemAutoid: item.autoid, isPicked: !item.is_picked })}
                          disabled={pickMutation.isPending}
                        >
                          {item.is_picked && <Check className='size-3' />}
                        </button>
                      </td>
                      <td className='px-3 py-1.5'>
                        {item.packed ? (
                          <span className='inline-flex items-center gap-1 rounded-[4px] bg-violet-500/10 px-1.5 py-0.5 text-[11px] font-medium text-violet-600 dark:text-violet-400'>
                            <Package className='size-3' /> Packed
                          </span>
                        ) : (
                          <span className='text-[11px] text-text-quaternary'>—</span>
                        )}
                      </td>
                      <td className={cn('px-3 py-1.5 font-medium', item.is_picked ? 'text-text-tertiary line-through' : 'text-foreground')}>
                        {item.inven || '—'}
                      </td>
                      <td className={cn('max-w-[400px] px-3 py-1.5', item.is_picked ? 'text-text-tertiary line-through' : 'text-text-secondary')}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className='block truncate'>{item.descr || '—'}</span>
                          </TooltipTrigger>
                          <TooltipContent className='max-w-[300px]'>{item.descr || '—'}</TooltipContent>
                        </Tooltip>
                      </td>
                      <td className='px-3 py-1.5 text-right tabular-nums text-text-secondary'>
                        {item.quan ?? '—'}
                      </td>
                      <td className='px-3 py-1.5 text-right tabular-nums text-text-tertiary'>
                        {item.ship ?? '0'}
                      </td>
                      <td className='px-3 py-1.5 text-right tabular-nums text-text-secondary'>
                        {formatCurrency(item.price)}
                      </td>
                      {itemCustomCols.map((col) => {
                        const val = item[col.field]
                        return (
                          <td key={col.field} className='px-3 py-1.5 text-text-secondary'>
                            <span className='block max-w-[160px] truncate'>
                              {val != null ? String(val) : '—'}
                            </span>
                          </td>
                        )
                      })}
                      <td className='py-1.5 pl-3 pr-6 text-right font-medium tabular-nums text-foreground'>
                        {formatCurrency(item.so_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Summary footer */}
          <div
            className={cn(
              'flex shrink-0 items-center justify-end gap-4 border-t border-border bg-bg-secondary/40',
              isMobile ? 'px-4 py-2' : 'px-6 py-2',
            )}
          >
            <SummaryCell label='Subtotal' value={formatCurrency(order.subtotal)} />
            <SummaryCell label='Tax' value={formatCurrency(order.tax)} />
            <SummaryCell label='Total' value={formatCurrency(order.total)} bold />
            <SummaryCell
              label='Balance'
              value={formatCurrency(order.balance)}
              accent={Number(order.balance) > 0 ? 'warning' : 'success'}
              bold
            />
          </div>
        </div>

        {/* Right: Properties panel */}
        <div
          className={cn(
            'flex shrink-0 flex-col overflow-hidden bg-bg-secondary/50',
            isMobile
              ? 'border-t border-border'
              : 'w-[380px] border-l border-border',
          )}
        >
          {/* Panel tabs */}
          <div className='flex shrink-0 items-center justify-between border-b border-border px-1'>
            <div className='flex items-center gap-0'>
              {(['general', 'custom', 'shipments'] as const).map((tab) => {
                const label = tab === 'custom' ? `Line Items${customFields.length > 0 ? ` ${customFields.length}` : ''}`
                  : tab === 'shipments' ? `Shipments${(order.shipments?.length ?? 0) > 0 ? ` ${order.shipments!.length}` : ''}`
                  : 'General'
                return (
                  <button
                    key={tab}
                    type='button'
                    className={cn(
                      'relative px-3 py-2 text-[13px] font-medium transition-colors duration-75',
                      panelTab === tab
                        ? 'text-foreground'
                        : 'text-text-tertiary hover:text-text-secondary',
                    )}
                    onClick={() => setPanelTab(tab)}
                  >
                    {label}
                    {panelTab === tab && (
                      <span className='absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-primary' />
                    )}
                  </button>
                )
              })}
            </div>
            <div className='flex items-center gap-1 pr-2'>
              {(() => {
                const pickedCount = items.filter((i) => i.is_picked).length
                const packedCount = items.filter((i) => i.packed).length
                return (
                  <>
                    {pickedCount > 0 && (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold tabular-nums leading-none',
                          pickedCount === items.length
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                            : 'bg-primary/10 text-primary',
                        )}
                      >
                        {pickedCount === items.length ? <Check className='size-2.5' /> : <PackageCheck className='size-2.5' />}
                        {pickedCount}/{items.length}
                      </span>
                    )}
                    {packedCount > 0 && (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold tabular-nums leading-none',
                          packedCount === items.length
                            ? 'bg-violet-500/10 text-violet-700 dark:text-violet-400'
                            : 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
                        )}
                      >
                        <Package className='size-2.5' />
                        {packedCount}/{items.length}
                      </span>
                    )}
                  </>
                )
              })()}
            </div>
          </div>

          {/* Panel content */}
          <div className='flex-1 overflow-y-auto'>
            {panelTab === 'general' ? (
              <>
                {/* Bill To */}
                <PanelSection title='Bill To'>
                  <PropertyField label='Name' value={order.name} field='name' onSave={handleFieldSave} />
                  <PanelBlock last>
                    <span className='mb-0.5 block text-[12px] font-medium text-text-tertiary'>Address</span>
                    {billToAddress ? (
                      <span className='whitespace-pre-line text-[13px] leading-snug text-foreground'>{billToAddress}</span>
                    ) : (
                      <span className='text-[13px] text-text-quaternary'>—</span>
                    )}
                  </PanelBlock>
                </PanelSection>

                {/* Ship To */}
                <PanelSection title='Ship To'>
                  <PropertyField label='Name' value={order.c_name} field='c_name' onSave={handleFieldSave} />
                  <PanelBlock last>
                    <span className='mb-0.5 block text-[12px] font-medium text-text-tertiary'>Address</span>
                    {shipToAddress ? (
                      <span className='whitespace-pre-line text-[13px] leading-snug text-foreground'>{shipToAddress}</span>
                    ) : (
                      <span className='text-[13px] text-text-quaternary'>—</span>
                    )}
                  </PanelBlock>
                </PanelSection>

                {/* Contact */}
                <PanelSection title='Contact'>
                  <PropertyField label='Email' value={order.email} field='email' onSave={handleFieldSave} />
                  <PropertyField label='Phone' value={order.phone} field='phone' onSave={handleFieldSave} />
                </PanelSection>

                {/* Order Details */}
                <PanelSection title='Order Details'>
                  <PanelRow label='Invoice'>
                    <span className='tabular-nums'>{order.invoice || '—'}</span>
                  </PanelRow>
                  <PanelRow label='Picked'>
                    <span className='tabular-nums'>{order.pick_status || '—'}</span>
                  </PanelRow>
                  <PanelRow label='Packed'>
                    <span className='tabular-nums'>{order.packed_status || '—'}</span>
                  </PanelRow>
                  <PanelRow label='Date'>
                    <span className='tabular-nums'>{order.inv_date ? formatDate(order.inv_date) : '—'}</span>
                  </PanelRow>
                  <PanelRow label='Due Date'>
                    <span className='tabular-nums'>{order.due_date ? formatDate(order.due_date) : '—'}</span>
                  </PanelRow>
                  <PropertyField label='Sales Person' value={order.salesman} field='salesman' onSave={handleFieldSave} />
                  <PropertyField label='PO No.' value={order.po_no} field='po_no' onSave={handleFieldSave} />
                  <PropertyField label='Ship Date' value={order.ship_date} field='ship_date' onSave={handleFieldSave} />
                  <PropertyField label='Ship Via' value={order.ship_via} field='ship_via' onSave={handleFieldSave} />
                  <PropertyField label='Price Level' value={order.in_level} field='in_level' onSave={handleFieldSave} />
                  <PropertyField label='Due' value={order.charge} field='charge' onSave={handleFieldSave} />
                </PanelSection>

                {/* Notes */}
                <PanelSection title='Notes' last>
                  <PropertyField label='Memo' value={order.memo} field='memo' onSave={handleFieldSave} multiline />
                  <PropertyField label='Internal Note' value={order.internalnt} field='internalnt' onSave={handleFieldSave} multiline />
                </PanelSection>
              </>
            ) : panelTab === 'custom' ? (
              <>
                {customFields.length === 0 ? (
                  <div className='flex flex-col items-center justify-center py-12 text-center'>
                    <p className='text-[13px] text-text-tertiary'>No custom fields enabled</p>
                    <p className='mt-1 text-[12px] text-text-quaternary'>
                      Enable fields in Settings &rarr; Data Control
                    </p>
                  </div>
                ) : (
                  <PanelSection title='Custom Fields' last>
                    {customFields.map((entry) => {
                      const label = getColumnLabel(entry.field, 'order', fieldConfig)
                      const val = order[entry.field]
                      const strVal = val != null ? String(val) : null
                      return (
                        <PropertyField
                          key={entry.field}
                          label={label}
                          value={strVal}
                          field={entry.field}
                          onSave={handleFieldSave}
                          editable={!!entry.editable}
                        />
                      )
                    })}
                  </PanelSection>
                )}
              </>
            ) : (
              <>
                {(order.shipments?.length ?? 0) === 0 ? (
                  <div className='flex flex-col items-center justify-center py-12 text-center'>
                    <Truck className='mx-auto mb-2 size-6 text-text-quaternary' />
                    <p className='text-[13px] text-text-tertiary'>No shipments yet</p>
                    <p className='mt-1 text-[12px] text-text-quaternary'>
                      Create a shipment from the Shipping button above
                    </p>
                  </div>
                ) : (
                  <div>
                    {order.shipments!.map((shipment) => (
                      <div
                        key={shipment.id}
                        className={cn(
                          'border-b border-border-light px-4 py-3',
                          shipment.voided && 'opacity-50',
                        )}
                      >
                        <div className='flex items-center gap-2'>
                          <Truck className='size-3.5 shrink-0 text-text-tertiary' />
                          <span className='min-w-0 flex-1 truncate text-[13px] font-medium text-foreground'>
                            {shipment.service_name}
                          </span>
                          <span className='shrink-0 text-[13px] font-medium tabular-nums text-foreground'>
                            ${parseFloat(shipment.cost).toFixed(2)}
                          </span>
                        </div>
                        <div className='mt-1.5 flex items-center gap-2 pl-[22px]'>
                          <span className='min-w-0 flex-1 truncate text-[12px] tabular-nums text-text-tertiary'>
                            {shipment.tracking_number}
                          </span>
                          {shipment.voided ? (
                            <span className='inline-flex shrink-0 items-center gap-1 rounded-[4px] border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 dark:border-red-800 dark:bg-red-500/10 dark:text-red-400'>
                              <XCircle className='size-2.5' />
                              Voided
                            </span>
                          ) : (
                            <span className='inline-flex shrink-0 items-center gap-1 rounded-[4px] border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:border-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400'>
                              <Check className='size-2.5' />
                              Active
                            </span>
                          )}
                        </div>
                        <div className='mt-1.5 flex items-center gap-2 pl-[22px]'>
                          <span className='text-[11px] text-text-quaternary'>
                            {new Date(shipment.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {!shipment.voided && (
                            <>
                              {shipment.label_url && (
                                <a
                                  href={shipment.label_url}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='inline-flex items-center gap-0.5 text-[11px] font-medium text-primary hover:underline'
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Label
                                  <ExternalLink className='size-2.5' />
                                </a>
                              )}
                              <button
                                type='button'
                                className='inline-flex items-center gap-0.5 text-[11px] font-medium text-destructive hover:underline disabled:opacity-50'
                                onClick={() => voidShipmentMutation.mutate({ shipmentId: shipment.id, shipmentOrderAutoid: shipment.order_autoid })}
                                disabled={voidShipmentMutation.isPending}
                              >
                                <XCircle className='size-2.5' />
                                Void
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Notes sheet ── */}
      <EntityNotesSheet
        open={notesOpen}
        onOpenChange={setNotesOpen}
        entityType='order'
        entityLabel={order.invoice || `Order ${order.id}`}
        autoid={orderId}
        projectId={projectId}
      />

      {/* ── Attachments dialog ── */}
      <EntityAttachmentsDialog
        entityType='order'
        entityLabel={order.invoice || `Order ${order.id}`}
        autoid={orderId}
        projectId={projectId}
        open={attachmentsOpen}
        onOpenChange={setAttachmentsOpen}
      />

      {/* ── Assign dialog ── */}
      <OrderAssignDialog
        order={order}
        open={assignOpen}
        onOpenChange={setAssignOpen}
        projectId={projectId}
      />

      {/* ── Picking dialog ── */}
      <StartPickingDialog
        open={pickingOpen}
        onOpenChange={setPickingOpen}
        customerId={String(order.c_id ?? order.id ?? '')}
        customerName={order.name}
      />

      {/* ── Shipping rates dialog ── */}
      <ShippingRatesDialog
        open={shippingOpen}
        onOpenChange={setShippingOpen}
        orderAutoid={orderId}
        items={items}
        order={order}
        onPatch={(payload) => patchMutation.mutate(payload)}
      />

      {/* ── Delete confirmation ── */}
      {deleteOpen && (
        <>
          <div className='fixed inset-0 z-40 bg-black/40' onClick={() => setDeleteOpen(false)} />
          <div className='fixed inset-0 z-50 flex items-center justify-center px-4'>
            <div
              className='w-full max-w-[400px] rounded-[12px] border border-border bg-background p-6'
              style={{ boxShadow: '0 16px 70px rgba(0,0,0,.2)' }}
            >
              <h3 className='mb-2 text-[15px] font-semibold'>Delete order</h3>
              <p className='mb-5 text-[13px] text-text-secondary'>
                Are you sure you want to delete order &ldquo;{order.invoice || order.id}&rdquo;?
                This action cannot be undone.
              </p>
              <div className='flex justify-end gap-2'>
                <button
                  type='button'
                  className='rounded-[6px] border border-border px-3 py-1.5 text-[13px] font-medium transition-colors duration-[80ms] hover:bg-bg-hover'
                  onClick={() => setDeleteOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type='button'
                  className='rounded-[6px] bg-destructive px-3 py-1.5 text-[13px] font-medium text-white transition-colors duration-[80ms] hover:opacity-90'
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Create Task command bar ── */}
      {taskModalOpen && (
        <CommandBarCreate
          onClose={() => setTaskModalOpen(false)}
          defaultLinkedOrderAutoid={order.autoid}
        />
      )}
    </div>
  )
}

