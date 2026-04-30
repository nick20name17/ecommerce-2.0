import { useMutation, useQuery } from '@tanstack/react-query'
import { MapPin, MoreHorizontal, Pencil, Plus, Star, Trash2, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'

import { PageEmpty } from '@/components/common/page-empty'
import { ShippingAddressModal } from './shipping-address-modal'
import { getProjectByIdQuery } from '@/api/project/query'
import { projectService } from '@/api/project/service'
import { SHIPPING_ADDRESS_QUERY_KEYS, getShippingAddressesQuery } from '@/api/shipping-address/query'
import type { ShippingAddress } from '@/api/shipping-address/schema'
import { shippingAddressService } from '@/api/shipping-address/service'
import { isSuperAdmin } from '@/constants/user'
import { useAuth } from '@/providers/auth'
import { cn } from '@/lib/utils'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export const ShippingSection = ({ projectId }: { projectId: number }) => {
  const { user } = useAuth()
  const userIsSuperAdmin = !!user?.role && isSuperAdmin(user.role)

  const { data: project } = useQuery({
    ...getProjectByIdQuery(projectId),
    enabled: userIsSuperAdmin,
    retry: false,
  })

  const [shippingEnabled, setShippingEnabled] = useState(false)
  const [shipengineKey, setShipengineKey] = useState('')
  const [configLoaded, setConfigLoaded] = useState(false)

  useEffect(() => {
    if (project && !configLoaded) {
      setShippingEnabled(project.shipping_enabled ?? false)
      setShipengineKey(project.shipengine_test_api_key ?? '')
      setConfigLoaded(true)
    }
  }, [project, configLoaded])

  const updateProjectMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      projectService.update({ id: projectId, payload }),
    onSuccess: (_data, variables) => {
      if ('shipping_enabled' in variables) {
        window.location.reload()
      }
    },
    meta: { successMessage: 'Settings updated' },
  })

  const { data: addresses, isLoading } = useQuery({
    ...getShippingAddressesQuery(projectId),
    enabled: shippingEnabled || !userIsSuperAdmin,
  })

  const [modalAddress, setModalAddress] = useState<ShippingAddress | 'create' | null>(null)
  const [deleteAddress, setDeleteAddress] = useState<ShippingAddress | null>(null)

  const deleteMutation = useMutation({
    mutationFn: (id: number) => shippingAddressService.delete(id, projectId),
    meta: {
      successMessage: 'Address deleted',
      invalidatesQuery: SHIPPING_ADDRESS_QUERY_KEYS.all(),
    },
    onSuccess: () => setDeleteAddress(null),
  })

  const editingAddress = typeof modalAddress === 'object' ? modalAddress : null

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      {/* Shipping config (superadmin only) */}
      {userIsSuperAdmin && (
        <div className='border-b border-border px-6 py-4'>
          <div className='max-w-xl space-y-4'>
            <div>
              <h3 className='text-[14px] font-semibold text-foreground'>Shipping Configuration</h3>
              <p className='mt-0.5 text-[13px] text-text-tertiary'>Enable shipping and configure ShipEngine for this project.</p>
            </div>

            <div className='flex items-center justify-between rounded-[8px] border border-border px-3.5 py-2.5'>
              <div>
                <span className='text-[13px] font-medium text-foreground'>Enable Shipping</span>
                <p className='text-[12px] text-text-tertiary'>Allow shipping rates, labels, and shipments</p>
              </div>
              <button
                type='button'
                disabled={updateProjectMutation.isPending}
                className={cn(
                  'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200',
                  shippingEnabled ? 'bg-primary' : 'bg-border',
                )}
                onClick={() => {
                  const next = !shippingEnabled
                  setShippingEnabled(next)
                  updateProjectMutation.mutate({ shipping_enabled: next })
                }}
              >
                <span className={cn('inline-block size-3.5 rounded-full bg-background shadow-sm transition-transform duration-200', shippingEnabled ? 'translate-x-[18px]' : 'translate-x-[3px]')} />
              </button>
            </div>

            {shippingEnabled && (
              <div className='rounded-[8px] border border-border px-3.5 py-2.5'>
                <div className='mb-1'>
                  <span className='text-[13px] font-medium text-foreground'>ShipEngine Test API Key</span>
                  <p className='text-[12px] text-text-tertiary'>Sandbox key for rate/label testing</p>
                </div>
                <input
                  value={shipengineKey}
                  onChange={(e) => setShipengineKey(e.target.value)}
                  onBlur={() => updateProjectMutation.mutate({ shipengine_test_api_key: shipengineKey })}
                  onKeyDown={(e) => { if (e.key === 'Enter') updateProjectMutation.mutate({ shipengine_test_api_key: shipengineKey }) }}
                  placeholder='TEST_...'
                  disabled={updateProjectMutation.isPending}
                  className='h-8 w-full rounded-[6px] border border-border bg-background px-2.5 font-mono text-[13px] outline-none placeholder:text-text-quaternary focus:border-primary'
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Addresses section — only when shipping is enabled */}
      {!shippingEnabled && userIsSuperAdmin ? null : (
      <>
      {/* Column labels + Add button */}
      <div
        className='sticky top-0 z-10 flex select-none items-center gap-6 border-b border-border bg-bg-secondary px-6 py-1'
      >
        <div className='min-w-0 flex-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary'>
          Address
        </div>
        <div className='hidden w-[160px] shrink-0 text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary sm:block'>
          Location
        </div>
        <div className='hidden w-[120px] shrink-0 text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary md:block'>
          Contact
        </div>
        <div className='w-[28px] shrink-0'>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type='button'
                className='inline-flex size-6 items-center justify-center rounded-[5px] bg-primary text-primary-foreground transition-opacity duration-[80ms] hover:opacity-90'
                onClick={() => setModalAddress('create')}
              >
                <Plus className='size-3.5' />
              </button>
            </TooltipTrigger>
            <TooltipContent>Add address</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className='flex-1 overflow-auto'>
        {isLoading ? (
          <div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className='flex items-center gap-6 border-b border-border-light px-6 py-1.5'>
                <div className='flex min-w-0 flex-1 items-center gap-2'>
                  <Skeleton className='h-3.5 w-24' />
                  <Skeleton className='h-[18px] w-14 rounded-[4px]' />
                </div>
                <div className='hidden w-[160px] shrink-0 sm:block'>
                  <Skeleton className='h-3.5 w-28' />
                </div>
                <div className='hidden w-[120px] shrink-0 md:block'>
                  <Skeleton className='h-3.5 w-20' />
                </div>
                <div className='w-[28px] shrink-0' />
              </div>
            ))}
          </div>
        ) : !addresses?.length ? (
          <PageEmpty icon={MapPin} title='No shipping addresses' description='Add a shipping address to get started.' />
        ) : (
          addresses.map((addr) => (
            <div
              key={addr.id}
              className='group/row flex items-center gap-6 border-b border-border-light px-6 py-1.5 transition-colors duration-100 hover:bg-bg-hover'
            >
              {/* Title + default badge */}
              <div className='flex min-w-0 flex-1 items-center gap-2'>
                <span className='truncate text-[13px] font-medium text-foreground'>{addr.title}</span>
                {addr.is_default && (
                  <span className='inline-flex shrink-0 items-center gap-1 rounded-[4px] bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-medium leading-none text-amber-700 dark:text-amber-300'>
                    <Star className='size-2.5' />
                    Default
                  </span>
                )}
              </div>

              {/* Location */}
              <div className='hidden w-[160px] shrink-0 sm:block'>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className='block truncate text-[13px] text-text-secondary'>
                      {[addr.city, addr.state, addr.postal_code].filter(Boolean).join(', ')}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {[addr.address_line1, addr.address_line2].filter(Boolean).join(', ')}
                    <br />
                    {[addr.city, addr.state, addr.postal_code, addr.country_code].filter(Boolean).join(', ')}
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Contact */}
              <div className='hidden w-[120px] shrink-0 truncate text-[13px] text-text-tertiary md:block'>
                {addr.name || addr.phone || '—'}
              </div>

              {/* Actions */}
              <div
                className='flex w-[28px] shrink-0 items-center justify-center'
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type='button'
                      className='inline-flex size-6 items-center justify-center rounded-[5px] text-text-tertiary opacity-0 transition-all duration-75 hover:bg-bg-active hover:text-foreground group-hover/row:opacity-100'
                    >
                      <MoreHorizontal className='size-4' />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align='end'
                    className='w-[180px] rounded-[8px] p-1'
                    style={{ boxShadow: 'var(--dropdown-shadow)' }}
                  >
                    <DropdownMenuItem
                      className='cursor-pointer gap-2 rounded-[6px] px-2 py-1 text-[13px]'
                      onClick={() => setModalAddress(addr)}
                    >
                      <Pencil className='size-3.5' />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant='destructive'
                      className='cursor-pointer gap-2 rounded-[6px] px-2 py-1 text-[13px]'
                      onClick={() => setDeleteAddress(addr)}
                    >
                      <Trash2 className='size-3.5' />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>

      <ShippingAddressModal
        key={editingAddress?.id ?? 'create'}
        address={editingAddress}
        projectId={projectId}
        open={modalAddress !== null}
        onOpenChange={(open) => !open && setModalAddress(null)}
      />

      <AlertDialog open={!!deleteAddress} onOpenChange={(open) => !open && setDeleteAddress(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className='bg-destructive/10 text-destructive'>
              <TriangleAlert />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deleteAddress?.title}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={() => deleteAddress && deleteMutation.mutate(deleteAddress.id)}
              isPending={deleteMutation.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </>
      )}
    </div>
  )
}
