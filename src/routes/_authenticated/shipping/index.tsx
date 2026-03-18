import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import {
  Check,
  ChevronRight,
  ExternalLink,
  Package,
  Search,
  Truck,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'

import { getShipmentsQuery } from '@/api/shipment/query'
import type { ShipmentRecord } from '@/api/shipment/schema'
import { PageEmpty } from '@/components/common/page-empty'
import { FilterChip, FilterPopover, IShipping, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { useProjectId } from '@/hooks/use-project-id'
import { cn } from '@/lib/utils'

// ── Helpers ──────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

type VoidedFilter = 'all' | 'active' | 'voided'

const FILTER_OPTIONS: { value: VoidedFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'voided', label: 'Voided' },
]

const STATUS_DOT_COLORS: Record<VoidedFilter, string> = {
  all: 'bg-slate-400',
  active: 'bg-emerald-500',
  voided: 'bg-red-500',
}

function getCustomerDisplay(shipment: ShipmentRecord): string {
  return shipment.order_name || shipment.order_invoice || `#${shipment.order_autoid.slice(0, 8)}`
}

// ── Page Component ───────────────────────────────────────────

const ShippingPage = () => {
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const isTablet = bp === 'tablet'
  const [projectId] = useProjectId()
  const [search, setSearch] = useState('')
  const [voidedFilter, setVoidedFilter] = useState<VoidedFilter>('all')
  const [selected, setSelected] = useState<ShipmentRecord | null>(null)

  const queryParams = {
    voided: voidedFilter === 'active' ? false : voidedFilter === 'voided' ? true : undefined,
    project_id: projectId ?? undefined,
    ordering: '-created_at',
    limit: 100,
  }

  const { data, isLoading } = useQuery(getShipmentsQuery(queryParams))
  const allShipments = data ?? []
  const shipments = search
    ? allShipments.filter((s) => {
        const term = search.toLowerCase()
        return (
          s.order_name.toLowerCase().includes(term) ||
          s.order_invoice.toLowerCase().includes(term) ||
          s.order_autoid.toLowerCase().includes(term) ||
          s.tracking_number.toLowerCase().includes(term) ||
          s.service_name.toLowerCase().includes(term) ||
          s.carrier_id.toLowerCase().includes(term)
        )
      })
    : allShipments
  const totalCount = shipments.length

  const hasFilters = voidedFilter !== 'all'

  const selectStatus = (value: VoidedFilter) => {
    setVoidedFilter(value === voidedFilter ? 'all' : value)
  }

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* Header */}
      <header className={cn('flex h-12 shrink-0 items-center gap-2.5 border-b border-border', isMobile ? 'px-3.5' : 'px-6')}>
        <SidebarTrigger className='-ml-1' />
        <PageHeaderIcon icon={IShipping} color={PAGE_COLORS.shipping} />
        <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>Shipping</h1>
        {!isLoading && (
          <span className='text-[13px] tabular-nums text-text-tertiary'>
            {totalCount} shipment{totalCount !== 1 ? 's' : ''}
          </span>
        )}

        <div className='flex-1' />

        <div className='flex items-center gap-1.5 rounded-[6px] border border-border bg-background px-2.5 py-1.5'>
          <Search className='size-3.5 shrink-0 text-text-tertiary' />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search shipments...'
            className='w-[140px] bg-transparent text-[13px] outline-none placeholder:text-text-tertiary sm:w-[200px]'
          />
        </div>

        <FilterPopover
          label='Status'
          active={hasFilters}
          icon={<div className={cn('size-2.5 rounded-full', hasFilters ? STATUS_DOT_COLORS[voidedFilter] : 'bg-current')} />}
        >
          {FILTER_OPTIONS.map((opt) => {
            const selected_ = voidedFilter === opt.value
            return (
              <button
                key={opt.value}
                type='button'
                className={cn(
                  'flex w-full items-center gap-2 rounded-[5px] px-2 py-[3px] text-left text-[13px] font-medium',
                  'transition-colors duration-[80ms] hover:bg-bg-hover'
                )}
                onClick={() => selectStatus(opt.value)}
              >
                <div className={cn(
                  'flex size-3.5 items-center justify-center rounded-full border transition-colors duration-[80ms]',
                  selected_ ? 'border-primary bg-primary' : 'border-border'
                )}>
                  {selected_ && <div className='size-1.5 rounded-full bg-primary-foreground' />}
                </div>
                <div className={cn('size-2.5 shrink-0 rounded-full', STATUS_DOT_COLORS[opt.value])} />
                <span className='flex-1'>{opt.label}</span>
              </button>
            )
          })}
        </FilterPopover>
      </header>

      {/* Active filter chips */}
      {hasFilters && (
        <div className={cn('flex shrink-0 flex-wrap items-center gap-1.5 border-b border-border py-1.5', isMobile ? 'px-3.5' : 'px-6')}>
          <button
            type='button'
            className='text-[13px] font-medium text-text-tertiary transition-colors duration-[80ms] hover:text-foreground'
            onClick={() => setVoidedFilter('all')}
          >
            Clear
          </button>
          <FilterChip onRemove={() => setVoidedFilter('all')}>
            <span className='text-text-tertiary'>Status is</span>
            <div className={cn('size-2 rounded-full', STATUS_DOT_COLORS[voidedFilter])} />
            {voidedFilter === 'active' ? 'Active' : 'Voided'}
          </FilterChip>
        </div>
      )}

      {/* Table header */}
      {!isMobile && (
        <div className={cn('flex shrink-0 items-center gap-4 border-b border-border bg-bg-secondary/60 py-1.5', isTablet ? 'px-5' : 'px-6')}>
          <div className='w-[80px] shrink-0 text-[12px] font-medium uppercase tracking-[0.04em] text-text-tertiary'>
            Order
          </div>
          <div className='min-w-0 flex-1 text-[12px] font-medium uppercase tracking-[0.04em] text-text-tertiary'>
            Customer
          </div>
          <div className='hidden w-[120px] shrink-0 text-[12px] font-medium uppercase tracking-[0.04em] text-text-tertiary lg:block'>
            Service
          </div>
          <div className='w-[110px] shrink-0 text-[12px] font-medium uppercase tracking-[0.04em] text-text-tertiary'>
            Status
          </div>
          <div className='hidden w-[80px] shrink-0 text-right text-[12px] font-medium uppercase tracking-[0.04em] text-text-tertiary sm:block'>
            Cost
          </div>
          <div className='hidden w-[100px] shrink-0 text-[12px] font-medium uppercase tracking-[0.04em] text-text-tertiary lg:block'>
            Date
          </div>
          <div className='w-[20px] shrink-0' />
        </div>
      )}

      {/* Table body */}
      <div className='flex-1 overflow-y-auto'>
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={cn('flex items-center gap-4 border-b border-border-light py-2.5', isMobile ? 'px-3.5' : 'px-6')}>
              <Skeleton className='h-4 w-16' />
              <Skeleton className='h-4 w-32 flex-1' />
              {!isMobile && <Skeleton className='hidden h-4 w-20 lg:block' />}
              <Skeleton className='h-5 w-16 rounded-full' />
              {!isMobile && <Skeleton className='hidden h-4 w-12 sm:block' />}
              {!isMobile && <Skeleton className='hidden h-4 w-16 lg:block' />}
            </div>
          ))
        ) : shipments.length === 0 ? (
          <PageEmpty icon={Truck} title='No shipments found' description='Try adjusting your search or filters.' />
        ) : (
          shipments.map((shipment) => (
            <ShipmentRow
              key={shipment.id}
              shipment={shipment}
              isMobile={isMobile}
              isTablet={isTablet}
              onClick={() => setSelected(shipment)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className={cn('shrink-0 border-t border-border py-1.5', isMobile ? 'px-3.5' : 'px-6')}>
        <p className='text-[13px] tabular-nums text-text-tertiary'>
          {isLoading ? '...' : `${totalCount} shipment${totalCount !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Detail dialog */}
      {selected && (
        <ShipmentDetailDialog
          shipment={selected}
          open={!!selected}
          onOpenChange={(open) => !open && setSelected(null)}
        />
      )}
    </div>
  )
}

// ── Shipment Row ────────────────────────────────────────────

function ShipmentRow({
  shipment,
  isMobile,
  isTablet,
  onClick,
}: {
  shipment: ShipmentRecord
  isMobile: boolean
  isTablet: boolean
  onClick: () => void
}) {
  const customerName = getCustomerDisplay(shipment)

  if (isMobile) {
    return (
      <div
        className='cursor-pointer border-b border-border-light px-3.5 py-2 transition-colors duration-100 hover:bg-bg-hover'
        onClick={onClick}
      >
        <div className='mb-1 flex items-center gap-2'>
          <span className='text-[13px] font-semibold tabular-nums text-foreground'>
            {shipment.order_invoice || `#${shipment.order_autoid.slice(0, 8)}`}
          </span>
          <span className='min-w-0 flex-1 truncate text-[13px] font-medium text-foreground'>
            {customerName}
          </span>
          <span className='shrink-0 text-[13px] font-medium tabular-nums text-foreground'>
            ${parseFloat(shipment.cost).toFixed(2)}
          </span>
        </div>
        <div className='flex items-center gap-2'>
          <StatusBadge voided={shipment.voided} />
          <span className='text-[13px] text-text-tertiary'>{shipment.service_name}</span>
          <span className='text-[13px] tabular-nums text-text-tertiary'>
            {formatDate(shipment.created_at)}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group/row flex cursor-pointer items-center gap-4 border-b border-border-light py-2 transition-colors duration-100 hover:bg-bg-hover',
        isTablet ? 'px-5' : 'px-6',
      )}
      onClick={onClick}
    >
      <div className='w-[80px] shrink-0'>
        <span className='text-[13px] font-semibold tabular-nums text-foreground'>
          {shipment.order_invoice || `#${shipment.order_autoid.slice(0, 8)}`}
        </span>
      </div>
      <div className='min-w-0 flex-1 truncate text-[13px] font-medium text-foreground'>
        {customerName}
      </div>
      <div className='hidden w-[120px] shrink-0 truncate text-[13px] text-text-tertiary lg:block'>
        {shipment.service_name}
      </div>
      <div className='w-[110px] shrink-0'>
        <StatusBadge voided={shipment.voided} />
      </div>
      <div className='hidden w-[80px] shrink-0 text-right text-[13px] font-medium tabular-nums text-foreground sm:block'>
        ${parseFloat(shipment.cost).toFixed(2)}
      </div>
      <div className='hidden w-[100px] shrink-0 text-[13px] tabular-nums text-text-tertiary lg:block'>
        {formatDate(shipment.created_at)}
      </div>
      <div className='w-[20px] shrink-0 text-text-tertiary opacity-0 transition-opacity group-hover/row:opacity-100'>
        <ChevronRight className='size-3.5' />
      </div>
    </div>
  )
}

// ── Status Badge ────────────────────────────────────────────

function StatusBadge({ voided }: { voided: boolean }) {
  if (voided) {
    return (
      <span className='inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold leading-none text-red-800 dark:border-red-600 dark:bg-red-500/20 dark:text-red-300'>
        <XCircle className='size-2.5' />
        Voided
      </span>
    )
  }
  return (
    <span className='inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold leading-none text-emerald-800 dark:border-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300'>
      <Check className='size-2.5' />
      Active
    </span>
  )
}

// ── Shipment Detail Dialog ──────────────────────────────────

function ShipmentDetailDialog({
  shipment,
  open,
  onOpenChange,
}: {
  shipment: ShipmentRecord
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[560px]'>
        <DialogHeader className='border-b border-border px-5 py-3'>
          <DialogTitle className='flex items-center gap-2 text-[14px]'>
            <Truck className='size-4 text-text-tertiary' />
            Shipment #{shipment.id}
            <StatusBadge voided={shipment.voided} />
          </DialogTitle>
        </DialogHeader>

        <div className='min-h-0 flex-1 overflow-y-auto'>
          {/* Label action */}
          {shipment.label_url && !shipment.voided && (
            <div className='flex items-center justify-between border-b border-border bg-foreground/[0.02] px-5 py-2.5'>
              <div className='flex items-center gap-2'>
                <div className='flex size-7 items-center justify-center rounded-[6px] bg-primary/10'>
                  <Package className='size-3.5 text-primary' />
                </div>
                <div>
                  <p className='text-[13px] font-medium text-foreground'>Shipping Label</p>
                  <p className='text-[11px] text-text-tertiary'>
                    {shipment.tracking_number.slice(-8)}
                  </p>
                </div>
              </div>
              <a
                href={shipment.label_url}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex h-7 items-center gap-1.5 rounded-[6px] border border-border bg-background px-3 text-[12px] font-medium text-text-secondary shadow-xs transition-colors duration-[80ms] hover:bg-bg-hover hover:text-foreground'
              >
                <ExternalLink className='size-3' />
                View Label
              </a>
            </div>
          )}

          {/* Info grid */}
          <div className='grid grid-cols-2 gap-x-4'>
            <PropertyCell label='Order' value={shipment.order_invoice || shipment.order_autoid} />
            <PropertyCell label='Customer' value={shipment.order_name || '—'} />
            <PropertyCell label='Carrier' value={shipment.carrier_id} />
            <PropertyCell label='Service' value={shipment.service_name} />
            <PropertyCell label='Cost' value={`$${parseFloat(shipment.cost).toFixed(2)}`} />
            <PropertyCell label='Created' value={formatDateTime(shipment.created_at)} />
            <PropertyCell label='Tracking'>
              <div className='flex items-center gap-1.5'>
                <span className='truncate text-[13px] font-mono tabular-nums'>
                  {shipment.tracking_number}
                </span>
                {shipment.tracking_number && (
                  <ExternalLink className='size-3 shrink-0 text-text-tertiary' />
                )}
              </div>
            </PropertyCell>
            <PropertyCell label='Label ID' value={shipment.label_id || '—'} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Property Cell ────────────────────────────────────────────

function PropertyCell({
  label,
  value,
  children,
}: {
  label: string
  value?: string
  children?: React.ReactNode
}) {
  return (
    <div className='border-b border-border-light px-5 py-2.5'>
      <div className='mb-0.5 text-[12px] font-medium text-text-tertiary'>{label}</div>
      {children ?? <div className='text-[13px] font-medium'>{value}</div>}
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/shipping/')({
  component: ShippingPage,
  head: () => ({
    meta: [{ title: 'Shipping' }],
  }),
})
