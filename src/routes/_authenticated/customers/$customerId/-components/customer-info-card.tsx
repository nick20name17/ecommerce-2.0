import { ChevronDown, UserPlus } from 'lucide-react'

import type { Customer } from '@/api/customer/schema'
import type { FieldConfigResponse } from '@/api/field-config/schema'
import { InitialsAvatar } from '@/components/ds'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getCustomerTypeLabel } from '@/constants/customer'
import { isAdmin } from '@/constants/user'
import { getColumnLabel } from '@/helpers/dynamic-columns'
import { formatDate, formatPhone, getUserDisplayName } from '@/helpers/formatters'
import { cn } from '@/lib/utils'
import { useAuth } from '@/providers/auth'

interface CustomerInfoPanelProps {
  customer: Customer
  fieldConfig?: FieldConfigResponse | null
  priceLevels?: string[]
  onPriceLevelChange?: (value: string) => void
  onAssign?: () => void
}

export const CustomerInfoPanel = ({ customer, fieldConfig, priceLevels, onPriceLevelChange, onAssign }: CustomerInfoPanelProps) => {
  const { user } = useAuth()
  const canAssign = !!user?.role && isAdmin(user.role)
  const isActive = !customer.inactive
  const phone = customer.contact_1 ? formatPhone(customer.contact_1) : null
  const email = customer.contact_3 || null
  const typeLabel = getCustomerTypeLabel(customer.in_level)
  const typeLabelName = getColumnLabel('in_level', 'customer', fieldConfig)
  const lastOrderDate = formatDate(customer.last_order_date)

  const addressParts = [customer.address1, customer.address2].filter(Boolean).join(', ')
  const cityStateZip = [customer.city, customer.state, customer.zip].filter(Boolean).join(', ')
  const country = customer.country || null
  const hasAddress = addressParts || cityStateZip || country

  const assigneeName = customer.assigned_user ? getUserDisplayName(customer.assigned_user) : null
  const assigneeInitials = assigneeName
    ? assigneeName.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('')
    : null

  const canEditPriceLevel = !!(priceLevels?.length && onPriceLevelChange)

  return (
    <div>
      {/* Details */}
      <PanelSection title='Details'>
        <PanelRow label='Status'>
          <div className='flex items-center gap-1.5'>
            <div
              className={cn(
                'size-2 rounded-full',
                isActive ? 'bg-green-500' : 'bg-slate-400'
              )}
            />
            <span className='font-medium'>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </PanelRow>
        <PanelRow label='ID'>
          <span className='tabular-nums'>{customer.id}</span>
        </PanelRow>
        <PanelRow label={typeLabelName}>
          {canEditPriceLevel ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type='button'
                  className='inline-flex items-center gap-1 rounded-[4px] bg-bg-secondary px-1.5 py-0.5 text-[12px] font-medium text-text-secondary transition-colors duration-75 hover:bg-bg-active'
                >
                  {typeLabel !== '—' ? typeLabel : 'Select…'}
                  <ChevronDown className='size-3 text-text-quaternary' />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                {priceLevels.map((level) => (
                  <DropdownMenuItem
                    key={level}
                    onClick={() => onPriceLevelChange(level)}
                    className={cn(customer.in_level === level && 'font-semibold')}
                  >
                    {level}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : typeLabel !== '—' ? (
            <span className='inline-flex items-center rounded-[4px] bg-bg-secondary px-1.5 py-0.5 text-[12px] font-medium text-text-secondary'>
              {typeLabel}
            </span>
          ) : (
            <span className='text-text-tertiary'>—</span>
          )}
        </PanelRow>
        <PanelRow label='Last Order' last>
          <span>{lastOrderDate}</span>
        </PanelRow>
      </PanelSection>

      {/* Contact */}
      <PanelSection title='Contact'>
        <PanelRow label='Phone'>
          <span>{phone ?? '—'}</span>
        </PanelRow>
        <PanelRow label='Email' last>
          {email ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className='block max-w-[180px] truncate'>{email}</span>
              </TooltipTrigger>
              <TooltipContent>{email}</TooltipContent>
            </Tooltip>
          ) : (
            <span className='text-text-tertiary'>—</span>
          )}
        </PanelRow>
      </PanelSection>

      {/* Address */}
      {hasAddress && (
        <PanelSection title='Address'>
          <div className='space-y-0.5 px-4 py-3 text-[13px] text-text-secondary'>
            {addressParts && <p>{addressParts}</p>}
            {cityStateZip && <p>{cityStateZip}</p>}
            {country && <p>{country}</p>}
          </div>
        </PanelSection>
      )}

      {/* Assigned To */}
      <PanelSection title='Assigned To' last>
        {customer.assigned_user ? (
          <button
            type='button'
            className={cn(
              'flex w-full items-center gap-2 px-4 py-3 text-left transition-colors duration-75',
              canAssign && onAssign && 'hover:bg-bg-hover',
              !(canAssign && onAssign) && 'cursor-default'
            )}
            onClick={canAssign && onAssign ? onAssign : undefined}
          >
            {assigneeInitials && <InitialsAvatar initials={assigneeInitials} size={20} />}
            <span className='min-w-0 flex-1 truncate text-[13px] font-medium'>
              {assigneeName}
            </span>
            {canAssign && onAssign && (
              <UserPlus className='size-3.5 shrink-0 text-text-quaternary' />
            )}
          </button>
        ) : canAssign && onAssign ? (
          <button
            type='button'
            className='flex w-full items-center gap-2 px-4 py-3 text-left transition-colors duration-75 hover:bg-bg-hover'
            onClick={onAssign}
          >
            <div className='flex size-5 items-center justify-center rounded-full border border-dashed border-border'>
              <UserPlus className='size-3 text-text-quaternary' />
            </div>
            <span className='text-[13px] text-text-tertiary'>Assign a sales user</span>
          </button>
        ) : (
          <div className='px-4 py-3'>
            <span className='text-[13px] text-text-tertiary'>—</span>
          </div>
        )}
      </PanelSection>
    </div>
  )
}

// ── Panel Section ────────────────────────────────────────────

function PanelSection({
  title,
  children,
  last,
}: {
  title: string
  children: React.ReactNode
  last?: boolean
}) {
  return (
    <div className={cn(!last && 'border-b border-border')}>
      <div className='bg-bg-secondary/60 px-4 py-2'>
        <span className='text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary'>
          {title}
        </span>
      </div>
      <div className='bg-background text-[13px]'>{children}</div>
    </div>
  )
}

// ── Panel Row ────────────────────────────────────────────────

function PanelRow({
  label,
  children,
  last,
}: {
  label: string
  children: React.ReactNode
  last?: boolean
}) {
  return (
    <div className={cn('flex items-center justify-between px-4 py-2.5', !last && 'border-b border-border-light')}>
      <span className='text-[12px] font-medium text-text-tertiary'>{label}</span>
      <div className='flex items-center text-[13px] font-medium text-foreground'>{children}</div>
    </div>
  )
}
