import { createFileRoute } from '@tanstack/react-router'
import {
  ChevronRight,
  ExternalLink,
  Package,
  Search,
  Truck,
} from 'lucide-react'
import { useState } from 'react'

import { IShipping, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

// ── Sample Data ──────────────────────────────────────────────

interface ShippingPackageItem {
  name: string
  quantity: number
}

interface ShippingPackageInfo {
  id: string
  weight: string
  dimensions: string
  items: ShippingPackageItem[]
}

interface ShippingRecord {
  id: string
  orderId: string
  orderInvoice: string
  customerName: string
  carrier: string
  service: string
  trackingNumber: string
  status: 'label_created' | 'in_transit' | 'delivered' | 'exception'
  cost: string
  shipDate: string
  deliveryDate: string | null
  packages: ShippingPackageInfo[]
}

const SAMPLE_SHIPMENTS: ShippingRecord[] = [
  {
    id: 'SHP-001',
    orderId: '10245',
    orderInvoice: 'INV-2026-0312',
    customerName: 'Maple Leaf Industries',
    carrier: 'UPS',
    service: 'Ground',
    trackingNumber: '1Z999AA10123456784',
    status: 'delivered',
    cost: '24.50',
    shipDate: '2026-03-08',
    deliveryDate: '2026-03-11',
    packages: [
      {
        id: 'PKG-1',
        weight: '5.2 lbs',
        dimensions: '12 × 10 × 6 in',
        items: [
          { name: 'Widget A — Blue', quantity: 4 },
          { name: 'Widget A — Red', quantity: 2 },
        ],
      },
    ],
  },
  {
    id: 'SHP-002',
    orderId: '10248',
    orderInvoice: 'INV-2026-0315',
    customerName: 'Northern Electric Co.',
    carrier: 'FedEx',
    service: 'Express Saver',
    trackingNumber: '794644790132',
    status: 'in_transit',
    cost: '47.80',
    shipDate: '2026-03-10',
    deliveryDate: null,
    packages: [
      {
        id: 'PKG-1',
        weight: '3.1 lbs',
        dimensions: '8 × 8 × 4 in',
        items: [{ name: 'Connector Kit — Pro', quantity: 1 }],
      },
      {
        id: 'PKG-2',
        weight: '12.4 lbs',
        dimensions: '24 × 18 × 12 in',
        items: [
          { name: 'Panel Mount — Large', quantity: 2 },
          { name: 'Bracket Assembly', quantity: 4 },
        ],
      },
    ],
  },
  {
    id: 'SHP-003',
    orderId: '10250',
    orderInvoice: 'INV-2026-0318',
    customerName: 'Sunrise Hardware Ltd.',
    carrier: 'Canada Post',
    service: 'Expedited Parcel',
    trackingNumber: '7023210012345678',
    status: 'label_created',
    cost: '15.20',
    shipDate: '2026-03-12',
    deliveryDate: null,
    packages: [
      {
        id: 'PKG-1',
        weight: '1.8 lbs',
        dimensions: '10 × 6 × 4 in',
        items: [
          { name: 'Gasket Set — Standard', quantity: 3 },
        ],
      },
    ],
  },
  {
    id: 'SHP-004',
    orderId: '10239',
    orderInvoice: 'INV-2026-0290',
    customerName: 'Pacific Coast Supplies',
    carrier: 'UPS',
    service: '2nd Day Air',
    trackingNumber: '1Z999AA10987654321',
    status: 'exception',
    cost: '38.90',
    shipDate: '2026-03-05',
    deliveryDate: null,
    packages: [
      {
        id: 'PKG-1',
        weight: '8.7 lbs',
        dimensions: '16 × 14 × 10 in',
        items: [
          { name: 'Motor Assembly — 120V', quantity: 1 },
          { name: 'Wiring Harness', quantity: 1 },
        ],
      },
    ],
  },
  {
    id: 'SHP-005',
    orderId: '10251',
    orderInvoice: 'INV-2026-0320',
    customerName: 'Riverside Manufacturing',
    carrier: 'FedEx',
    service: 'Ground',
    trackingNumber: '794644791234',
    status: 'delivered',
    cost: '19.60',
    shipDate: '2026-03-06',
    deliveryDate: '2026-03-10',
    packages: [
      {
        id: 'PKG-1',
        weight: '2.5 lbs',
        dimensions: '12 × 8 × 6 in',
        items: [{ name: 'Valve Assembly — Brass', quantity: 6 }],
      },
      {
        id: 'PKG-2',
        weight: '4.0 lbs',
        dimensions: '14 × 10 × 8 in',
        items: [
          { name: 'Pipe Fitting Kit', quantity: 2 },
          { name: 'Seal Pack', quantity: 10 },
        ],
      },
    ],
  },
]

const STATUS_CONFIG: Record<string, { label: string; class: string; dot: string }> = {
  label_created: {
    label: 'Label Created',
    class: 'border-slate-300 bg-slate-500/10 text-slate-700 dark:border-slate-600 dark:bg-slate-500/20 dark:text-slate-300',
    dot: 'bg-slate-400',
  },
  in_transit: {
    label: 'In Transit',
    class: 'border-blue-300 bg-blue-500/10 text-blue-800 dark:border-blue-600 dark:bg-blue-500/20 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  delivered: {
    label: 'Delivered',
    class: 'border-green-300 bg-green-500/10 text-green-800 dark:border-green-600 dark:bg-green-500/20 dark:text-green-300',
    dot: 'bg-green-500',
  },
  exception: {
    label: 'Exception',
    class: 'border-red-300 bg-red-500/10 text-red-800 dark:border-red-600 dark:bg-red-500/20 dark:text-red-300',
    dot: 'bg-red-500',
  },
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Page Component ───────────────────────────────────────────

const ShippingPage = () => {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ShippingRecord | null>(null)

  const filtered = SAMPLE_SHIPMENTS.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.id.toLowerCase().includes(q) ||
      s.orderInvoice.toLowerCase().includes(q) ||
      s.customerName.toLowerCase().includes(q) ||
      s.carrier.toLowerCase().includes(q) ||
      s.trackingNumber.toLowerCase().includes(q)
    )
  })

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* Header */}
      <header className='flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-6'>
        <PageHeaderIcon icon={IShipping} color={PAGE_COLORS.shipping} />
        <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>Shipping</h1>
        <span className='text-[13px] tabular-nums text-text-tertiary'>
          {filtered.length} shipment{filtered.length !== 1 ? 's' : ''}
        </span>
      </header>

      {/* Search bar */}
      <div className='flex shrink-0 items-center gap-2 border-b border-border px-6 py-2'>
        <div className='flex flex-1 items-center gap-1.5 rounded-[6px] border border-border bg-background px-2.5 py-1.5'>
          <Search className='size-3.5 shrink-0 text-text-tertiary' />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search shipments...'
            className='flex-1 bg-transparent text-[13px] outline-none placeholder:text-text-tertiary'
          />
        </div>
      </div>

      {/* Table header */}
      <div className='flex shrink-0 items-center gap-4 border-b border-border bg-bg-secondary/60 px-6 py-1.5'>
        <div className='w-[80px] shrink-0 text-[12px] font-medium uppercase tracking-[0.04em] text-text-tertiary'>
          ID
        </div>
        <div className='min-w-0 flex-1 text-[12px] font-medium uppercase tracking-[0.04em] text-text-tertiary'>
          Customer
        </div>
        <div className='hidden w-[100px] shrink-0 text-[12px] font-medium uppercase tracking-[0.04em] text-text-tertiary md:block'>
          Carrier
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
        <div className='hidden w-[90px] shrink-0 text-[12px] font-medium uppercase tracking-[0.04em] text-text-tertiary lg:block'>
          Ship Date
        </div>
        <div className='w-[20px] shrink-0' />
      </div>

      {/* Table body */}
      <div className='flex-1 overflow-y-auto'>
        {filtered.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-16 text-center'>
            <Truck className='size-6 text-text-tertiary opacity-40' />
            <p className='mt-2 text-[13px] text-text-tertiary'>No shipments found</p>
          </div>
        ) : (
          filtered.map((shipment) => {
            const status = STATUS_CONFIG[shipment.status]
            return (
              <div
                key={shipment.id}
                className='group/row flex cursor-pointer items-center gap-4 border-b border-border-light px-6 py-2 transition-colors duration-100 hover:bg-bg-hover'
                onClick={() => setSelected(shipment)}
              >
                <div className='w-[80px] shrink-0'>
                  <span className='text-[13px] font-semibold tabular-nums text-foreground'>
                    {shipment.id}
                  </span>
                </div>
                <div className='min-w-0 flex-1'>
                  <span className='truncate text-[13px] font-medium text-foreground'>
                    {shipment.customerName}
                  </span>
                  <span className='ml-2 text-[12px] tabular-nums text-text-tertiary'>
                    {shipment.orderInvoice}
                  </span>
                </div>
                <div className='hidden w-[100px] shrink-0 text-[13px] text-text-secondary md:block'>
                  {shipment.carrier}
                </div>
                <div className='hidden w-[120px] shrink-0 truncate text-[13px] text-text-tertiary lg:block'>
                  {shipment.service}
                </div>
                <div className='w-[110px] shrink-0'>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none',
                      status?.class,
                    )}
                  >
                    <span className={cn('size-1.5 rounded-full', status?.dot)} />
                    {status?.label}
                  </span>
                </div>
                <div className='hidden w-[80px] shrink-0 text-right text-[13px] font-medium tabular-nums text-foreground sm:block'>
                  ${shipment.cost}
                </div>
                <div className='hidden w-[90px] shrink-0 text-[13px] tabular-nums text-text-tertiary lg:block'>
                  {formatDate(shipment.shipDate)}
                </div>
                <div className='w-[20px] shrink-0 text-text-tertiary opacity-0 transition-opacity group-hover/row:opacity-100'>
                  <ChevronRight className='size-3.5' />
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className='shrink-0 border-t border-border px-6 py-1.5'>
        <p className='text-[13px] tabular-nums text-text-tertiary'>
          {filtered.length} shipment{filtered.length !== 1 ? 's' : ''}
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

// ── Shipment Detail Dialog ───────────────────────────────────

function ShipmentDetailDialog({
  shipment,
  open,
  onOpenChange,
}: {
  shipment: ShippingRecord
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const status = STATUS_CONFIG[shipment.status]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[560px]'>
        <DialogHeader className='border-b border-border px-5 py-3'>
          <DialogTitle className='flex items-center gap-2 text-[14px]'>
            <Truck className='size-4 text-text-tertiary' />
            Shipment {shipment.id}
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none',
                status?.class,
              )}
            >
              <span className={cn('size-1.5 rounded-full', status?.dot)} />
              {status?.label}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className='min-h-0 flex-1 overflow-y-auto'>
          {/* Info grid */}
          <div className='grid grid-cols-2 gap-x-4'>
            <PropertyCell label='Order' value={shipment.orderInvoice} />
            <PropertyCell label='Customer' value={shipment.customerName} />
            <PropertyCell label='Carrier' value={shipment.carrier} />
            <PropertyCell label='Service' value={shipment.service} />
            <PropertyCell label='Ship Date' value={formatDate(shipment.shipDate)} />
            <PropertyCell label='Delivery' value={shipment.deliveryDate ? formatDate(shipment.deliveryDate) : 'Pending'} />
            <PropertyCell label='Cost' value={`$${shipment.cost}`} />
            <PropertyCell label='Tracking'>
              <div className='flex items-center gap-1.5'>
                <span className='truncate text-[13px] font-mono tabular-nums'>{shipment.trackingNumber}</span>
                <ExternalLink className='size-3 shrink-0 text-text-tertiary' />
              </div>
            </PropertyCell>
          </div>

          {/* Packages */}
          <div className='border-t border-border px-5 py-3'>
            <h4 className='text-[12px] font-semibold uppercase tracking-[0.06em] text-text-tertiary'>
              Packages ({shipment.packages.length})
            </h4>
          </div>

          {shipment.packages.map((pkg) => (
            <div key={pkg.id} className='border-t border-border-light'>
              <div className='flex items-center gap-2 px-5 py-2.5'>
                <div className='flex size-7 items-center justify-center rounded-[6px] bg-bg-secondary'>
                  <Package className='size-3.5 text-text-tertiary' />
                </div>
                <div className='min-w-0 flex-1'>
                  <span className='text-[13px] font-semibold'>{pkg.id}</span>
                  <span className='ml-2 text-[12px] text-text-tertiary'>
                    {pkg.weight} · {pkg.dimensions}
                  </span>
                </div>
              </div>
              <div className='px-5 pb-3'>
                {pkg.items.map((item) => (
                  <div key={item.name} className='flex items-center justify-between py-1'>
                    <span className='text-[13px] text-text-secondary'>{item.name}</span>
                    <span className='text-[13px] tabular-nums text-text-tertiary'>×{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
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
