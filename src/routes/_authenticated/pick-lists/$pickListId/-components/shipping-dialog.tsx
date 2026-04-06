import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronDown, MapPin, Pencil, Truck } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { PICK_LIST_QUERY_KEYS } from '@/api/pick-list/query'
import { pickListService } from '@/api/pick-list/service'
import type { PickList, PickListShippingRate } from '@/api/pick-list/schema'
import { getProjectByIdQuery } from '@/api/project/query'
import { getShippingAddressesQuery } from '@/api/shipping-address/query'
import type { ShippingAddress } from '@/api/shipping-address/schema'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { useProjectId } from '@/hooks/use-project-id'
import { cn } from '@/lib/utils'

interface ShippingDialogProps {
  pickList: PickList
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 'package' | 'rates'

export function ShippingDialog({ pickList, open, onOpenChange }: ShippingDialogProps) {
  const [projectId] = useProjectId()
  const queryClient = useQueryClient()
  const [step, setStep] = useState<Step>('package')

  // Package form
  const [addressId, setAddressId] = useState<number | null>(null)
  const [length, setLength] = useState('')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [rates, setRates] = useState<PickListShippingRate[]>([])
  const [shipToEditOpen, setShipToEditOpen] = useState(false)
  const [shipTo, setShipTo] = useState({
    name: pickList.ship_to?.name ?? '',
    address1: pickList.ship_to?.address1 ?? '',
    address2: pickList.ship_to?.address2 ?? '',
    city: pickList.ship_to?.city ?? '',
    state: pickList.ship_to?.state ?? '',
    postal: pickList.ship_to?.postal ?? '',
    country: pickList.ship_to?.country ?? '',
    phone: pickList.ship_to?.phone ?? '',
  })

  // Fetch project settings for unit system
  const { data: project } = useQuery({
    ...getProjectByIdQuery(projectId!),
    enabled: open && projectId != null,
  })
  const isMetric = project?.unit_system === 'metric'
  const dimLabel = isMetric ? 'cm' : 'in'
  const weightLabel = isMetric ? 'kg' : 'lbs'

  // Fetch ship-from addresses
  const shippingQuery = getShippingAddressesQuery(projectId)
  const { data: addresses, isLoading: addressesLoading } = useQuery({
    ...shippingQuery,
    enabled: open && (shippingQuery.enabled !== false),
  })

  const addressList = Array.isArray(addresses) ? addresses : (addresses as unknown as ShippingAddress[]) ?? []

  // Auto-select default address
  useEffect(() => {
    if (open && addressId === null && addressList.length > 0) {
      const def = addressList.find((a) => a.is_default) ?? addressList[0]
      if (def) setAddressId(def.id)
    }
  }, [open, addressId, addressList])

  const selectedAddress = addressList.find((a) => a.id === addressId)
  const items = pickList.items ?? []

  // Auto-calculate weight from items (sum picked_quantity as proxy — real weight comes from item data)
  const autoWeight = useMemo(() => {
    const total = items.reduce((sum, item) => {
      const qty = parseFloat(item.picked_quantity) || 0
      return sum + qty
    }, 0)
    return Math.max(Math.round(total * 100) / 100, 0.01)
  }, [items])

  // Set auto weight on first open
  useEffect(() => {
    if (open && !weight) {
      setWeight(String(autoWeight))
    }
  }, [open, autoWeight])

  const ratesMutation = useMutation({
    mutationFn: () =>
      pickListService.getShippingRates(pickList.id, {
        shipping_address_id: addressId!,
        packages: [{
          items: items.map((i) => i.detail_autoid),
          length,
          width,
          height,
          weight: weight || undefined,
        }],
      }),
    onSuccess: (data) => {
      setRates(data.rates)
      setStep('rates')
      queryClient.invalidateQueries({ queryKey: PICK_LIST_QUERY_KEYS.detail(pickList.id) })
      toast.success(`${data.rates.length} rate${data.rates.length !== 1 ? 's' : ''} found`)
    },
  })

  const selectMutation = useMutation({
    mutationFn: (rateId: string) =>
      pickListService.selectShippingRate(pickList.id, rateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PICK_LIST_QUERY_KEYS.detail(pickList.id) })
      queryClient.invalidateQueries({ queryKey: PICK_LIST_QUERY_KEYS.lists() })
      toast.success('Label purchased')
      onOpenChange(false)
      reset()
    },
    onError: (error) => {
      const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error
      if (message?.includes('Recalculate rates')) {
        setRates([])
        setStep('package')
        toast.error('Rates expired — please recalculate')
      } else {
        toast.error(message || 'Failed to purchase label')
      }
    },
  })

  const reset = () => {
    setStep('package')
    setRates([])
    setLength('')
    setWidth('')
    setHeight('')
    setWeight('')
  }

  const canGetRates = !!addressId && !!length && !!width && !!height

  return (
    <>
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className='flex max-h-[85vh] flex-col sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>
            {step === 'package' ? 'Create Package & Get Rates' : 'Select Shipping Rate'}
          </DialogTitle>
        </DialogHeader>

        <DialogBody className='flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto'>
          {step === 'package' && (
            <>
              {/* Ship From address */}
              <div>
                <span className='mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-quaternary'>
                  <MapPin className='size-3' /> Ship From
                </span>
                {addressesLoading ? (
                  <Skeleton className='h-10 w-full rounded-lg' />
                ) : addressList.length === 0 ? (
                  <p className='text-[13px] text-text-tertiary'>
                    No shipping addresses configured. Add one in Settings → Shipping.
                  </p>
                ) : (
                  <>
                    {/* Selected address display + change button */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type='button'
                          className='flex w-full items-center gap-3 rounded-lg border border-border px-3 py-2 text-left transition-colors hover:bg-bg-hover/50'
                        >
                          <div className='min-w-0 flex-1'>
                            {selectedAddress ? (
                              <>
                                <div className='flex items-center gap-2'>
                                  <span className='text-[13px] font-medium text-foreground'>{selectedAddress.title}</span>
                                  {selectedAddress.is_default && (
                                    <span className='rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400'>
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className='text-[12px] text-text-tertiary'>
                                  {selectedAddress.address_line1}, {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postal_code}
                                </p>
                              </>
                            ) : (
                              <span className='text-[13px] text-text-tertiary'>Select warehouse...</span>
                            )}
                          </div>
                          <ChevronDown className='size-4 shrink-0 text-text-quaternary' />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align='start' className='w-[var(--radix-popover-trigger-width)] p-1'>
                        {addressList.map((addr) => (
                          <button
                            key={addr.id}
                            type='button'
                            onClick={() => setAddressId(addr.id)}
                            className={cn(
                              'flex w-full items-center gap-2 rounded-[6px] px-2.5 py-2 text-left text-[13px] transition-colors hover:bg-bg-hover',
                              addressId === addr.id && 'bg-bg-hover font-medium',
                            )}
                          >
                            <div className='min-w-0 flex-1'>
                              <div className='flex items-center gap-2'>
                                <span className='font-medium text-foreground'>{addr.title}</span>
                                {addr.is_default && (
                                  <span className='text-[10px] font-semibold text-amber-600 dark:text-amber-400'>Default</span>
                                )}
                              </div>
                              <p className='text-[11px] text-text-tertiary'>
                                {addr.address_line1}, {addr.city}, {addr.state} {addr.postal_code}
                              </p>
                            </div>
                            {addressId === addr.id && <Check className='size-3.5 shrink-0 text-primary' />}
                          </button>
                        ))}
                      </PopoverContent>
                    </Popover>
                  </>
                )}
              </div>

              {/* Ship To */}
              <div>
                <span className='mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-quaternary'>
                  <MapPin className='size-3' /> Ship To
                </span>
                <button
                  type='button'
                  className='flex w-full items-center gap-3 rounded-lg border border-border px-3 py-2 text-left transition-colors hover:bg-bg-hover/50'
                  onClick={() => setShipToEditOpen(true)}
                >
                  <div className='min-w-0 flex-1'>
                    <span className='text-[13px] font-medium text-foreground'>{shipTo.name}</span>
                    <p className='text-[12px] text-text-tertiary'>
                      {[shipTo.address1, shipTo.city, shipTo.state, shipTo.postal].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  <Pencil className='size-3.5 shrink-0 text-text-quaternary' />
                </button>
              </div>

              {/* Package dimensions */}
              <div>
                <span className='mb-2 block text-[11px] font-semibold uppercase tracking-wider text-text-quaternary'>
                  Package Dimensions
                </span>
                <div className='grid grid-cols-4 gap-3'>
                  <div>
                    <label className='mb-1 block text-[11px] font-medium text-text-tertiary'>Length ({dimLabel})</label>
                    <Input value={length} onChange={(e) => setLength(e.target.value)} type='number' min='0' step='any' className='h-8 text-[13px]' placeholder='0' />
                  </div>
                  <div>
                    <label className='mb-1 block text-[11px] font-medium text-text-tertiary'>Width ({dimLabel})</label>
                    <Input value={width} onChange={(e) => setWidth(e.target.value)} type='number' min='0' step='any' className='h-8 text-[13px]' placeholder='0' />
                  </div>
                  <div>
                    <label className='mb-1 block text-[11px] font-medium text-text-tertiary'>Height ({dimLabel})</label>
                    <Input value={height} onChange={(e) => setHeight(e.target.value)} type='number' min='0' step='any' className='h-8 text-[13px]' placeholder='0' />
                  </div>
                  <div>
                    <label className='mb-1 block text-[11px] font-medium text-text-tertiary'>Weight ({weightLabel})</label>
                    <Input value={weight} onChange={(e) => setWeight(e.target.value)} type='number' min='0' step='any' className='h-8 text-[13px]' placeholder='Auto' />
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className='rounded-lg bg-bg-secondary/50 px-3 py-2 text-[12px] text-text-tertiary'>
                Package covers <span className='font-medium text-foreground'>{items.length}</span> item{items.length !== 1 && 's'} from pick list #{pickList.id}
              </div>
            </>
          )}

          {step === 'rates' && (
            <>
              {selectedAddress && (
                <div className='rounded-lg bg-bg-secondary/50 px-3 py-2 text-[12px] text-text-tertiary'>
                  Ship from <span className='font-medium text-foreground'>{selectedAddress.title}</span> · Package {length}×{width}×{height} {dimLabel}{weight && ` · ${weight} ${weightLabel}`}
                </div>
              )}

              <div className='space-y-1 overflow-y-auto'>
                {rates.length === 0 && (
                  <div className='py-6 text-center text-[13px] text-text-tertiary'>No rates available</div>
                )}
                {rates.map((rate, i) => {
                  // rate_id may come as rate_id, id, or be derived from carrier_id+service_id
                  const rateId = rate.rate_id || `${rate.carrier_id}-${rate.service_id}`
                  return (
                    <div
                      key={rateId || i}
                      className='flex items-center gap-3 rounded-lg border border-border px-3.5 py-2.5 transition-colors hover:bg-bg-hover/50'
                    >
                      <Truck className='size-4 shrink-0 text-text-tertiary' />
                      <div className='min-w-0 flex-1'>
                        <span className='text-[13px] font-medium text-foreground'>{rate.carrier_id}</span>
                        <span className='ml-2 text-[12px] text-text-tertiary'>{rate.type}</span>
                      </div>
                      <span className='text-[15px] font-semibold tabular-nums text-foreground'>
                        ${(rate.cost ?? 0).toFixed(2)}
                      </span>
                      <Button
                        size='sm'
                        onClick={() => selectMutation.mutate(rateId)}
                        isPending={selectMutation.isPending && selectMutation.variables === rateId}
                        disabled={selectMutation.isPending || !rateId}
                      >
                        <Check className='size-3.5' />
                        Select
                      </Button>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </DialogBody>

        <DialogFooter>
          {step === 'package' && (
            <>
              <Button variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button
                disabled={!canGetRates}
                onClick={() => ratesMutation.mutate()}
                isPending={ratesMutation.isPending}
              >
                <Truck className='size-3.5' />
                Get Rates
              </Button>
            </>
          )}
          {step === 'rates' && (
            <Button variant='outline' onClick={() => setStep('package')}>
              Back to Package
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Ship To edit dialog */}
    <ShipToEditDialog
      open={shipToEditOpen}
      onOpenChange={setShipToEditOpen}
      address={shipTo}
      onSave={setShipTo}
    />
    </>
  )
}

// ── Ship To Edit Dialog ──

interface ShipToFields {
  name: string
  address1: string
  address2: string
  city: string
  state: string
  postal: string
  country: string
  phone: string
}

function ShipToEditDialog({
  open,
  onOpenChange,
  address,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  address: ShipToFields
  onSave: (address: ShipToFields) => void
}) {
  const [draft, setDraft] = useState<ShipToFields>(address)
  const prevOpen = useRef(false)
  useEffect(() => {
    if (open && !prevOpen.current) setDraft(address)
    prevOpen.current = open
  }, [open, address])

  const update = (field: keyof ShipToFields, value: string) => {
    setDraft((d) => ({ ...d, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='gap-0 p-0 sm:max-w-[400px]'>
        <DialogHeader className='border-b border-border px-5 py-3'>
          <DialogTitle className='text-[14px] font-semibold'>Ship To Address</DialogTitle>
        </DialogHeader>
        <div className='space-y-3 px-5 py-4'>
          <AddrField label='Name' value={draft.name} onChange={(v) => update('name', v)} />
          <AddrField label='Address' value={draft.address1} onChange={(v) => update('address1', v)} />
          <AddrField label='Address 2' value={draft.address2} onChange={(v) => update('address2', v)} />
          <div className='grid grid-cols-3 gap-2'>
            <AddrField label='City' value={draft.city} onChange={(v) => update('city', v)} />
            <AddrField label='State' value={draft.state} onChange={(v) => update('state', v)} />
            <AddrField label='ZIP / Postal' value={draft.postal} onChange={(v) => update('postal', v)} />
          </div>
          <div className='grid grid-cols-2 gap-2'>
            <AddrField label='Country' value={draft.country} onChange={(v) => update('country', v)} />
            <AddrField label='Phone' value={draft.phone} onChange={(v) => update('phone', v)} />
          </div>
        </div>
        <div className='flex items-center justify-end gap-2 border-t border-border px-5 py-3'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onSave(draft); onOpenChange(false) }}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AddrField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className='mb-1 block text-[12px] font-medium text-text-tertiary'>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        className='h-8 w-full rounded-[6px] border border-border bg-background px-2.5 text-[13px] text-foreground outline-none transition-colors placeholder:text-text-quaternary focus:border-primary/50 focus:ring-1 focus:ring-primary/20'
      />
    </div>
  )
}
