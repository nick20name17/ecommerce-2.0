import type { Customer } from '@/api/customer/schema'
import { InitialsAvatar } from '@/components/ds'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getCustomerTypeLabel } from '@/constants/customer'
import { formatDate, formatPhone } from '@/helpers/formatters'
import { cn } from '@/lib/utils'

interface CustomerInfoPanelProps {
  customer: Customer
}

export const CustomerInfoPanel = ({ customer }: CustomerInfoPanelProps) => {
  const isActive = !customer.inactive
  const phone = customer.contact_1 ? formatPhone(customer.contact_1) : null
  const email = customer.contact_3 || null
  const typeLabel = getCustomerTypeLabel(customer.in_level)
  const lastOrderDate = formatDate(customer.last_order_date)

  const addressParts = [customer.address1, customer.address2].filter(Boolean).join(', ')
  const cityStateZip = [customer.city, customer.state, customer.zip].filter(Boolean).join(', ')
  const country = customer.country || null
  const hasAddress = addressParts || cityStateZip || country

  const assigneeName = customer.assigned_user
    ? `${customer.assigned_user.first_name} ${customer.assigned_user.last_name}`.trim()
    : null
  const assigneeInitials = assigneeName
    ? assigneeName.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('')
    : null

  return (
    <div>
      {/* Details section */}
      <div className='border-b border-border px-4 py-2.5'>
        <span className='text-[12px] font-semibold uppercase tracking-[0.06em] text-text-tertiary'>
          Details
        </span>
      </div>

      <div className='grid grid-cols-2 gap-x-4'>
        <PropertyCell label='Status'>
          <div className='flex items-center gap-1.5'>
            <div
              className={cn(
                'size-2 rounded-full',
                isActive ? 'bg-green-500' : 'bg-slate-400'
              )}
            />
            <span className='text-[13px] font-medium'>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </PropertyCell>

        <PropertyCell label='ID'>
          <span className='text-[13px] tabular-nums'>{customer.id}</span>
        </PropertyCell>

        <PropertyCell label='Type'>
          {typeLabel !== '—' ? (
            <span className='inline-flex items-center rounded-[4px] bg-bg-secondary px-1.5 py-0.5 text-[12px] font-medium text-text-secondary'>
              {typeLabel}
            </span>
          ) : (
            <span className='text-[13px] text-text-tertiary'>—</span>
          )}
        </PropertyCell>

        <PropertyCell label='Last Order'>
          <span className='text-[13px]'>{lastOrderDate}</span>
        </PropertyCell>
      </div>

      {/* Contact section */}
      <div className='border-b border-border px-4 py-2.5'>
        <span className='text-[12px] font-semibold uppercase tracking-[0.06em] text-text-tertiary'>
          Contact
        </span>
      </div>

      <div className='grid grid-cols-2 gap-x-4'>
        <PropertyCell label='Phone'>
          <span className='text-[13px]'>{phone ?? '—'}</span>
        </PropertyCell>

        <PropertyCell label='Email'>
          {email ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className='block max-w-full truncate text-[13px]'>{email}</span>
              </TooltipTrigger>
              <TooltipContent>{email}</TooltipContent>
            </Tooltip>
          ) : (
            <span className='text-[13px] text-text-tertiary'>—</span>
          )}
        </PropertyCell>
      </div>

      {/* Address section */}
      {hasAddress && (
        <>
          <div className='border-b border-border px-4 py-2.5'>
            <span className='text-[12px] font-semibold uppercase tracking-[0.06em] text-text-tertiary'>
              Address
            </span>
          </div>
          <div className='space-y-0.5 px-4 py-3 text-[13px] text-text-secondary'>
            {addressParts && <p>{addressParts}</p>}
            {cityStateZip && <p>{cityStateZip}</p>}
            {country && <p>{country}</p>}
          </div>
        </>
      )}

      {/* Assigned user */}
      {customer.assigned_user && (
        <>
          <div className='border-b border-border px-4 py-2.5'>
            <span className='text-[12px] font-semibold uppercase tracking-[0.06em] text-text-tertiary'>
              Assigned To
            </span>
          </div>
          <div className='flex items-center gap-2 px-4 py-3'>
            {assigneeInitials && <InitialsAvatar initials={assigneeInitials} size={20} />}
            <span className='text-[13px] font-medium'>
              {assigneeName}
            </span>
          </div>
        </>
      )}
    </div>
  )
}

function PropertyCell({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className='border-b border-border-light px-4 py-2.5'>
      <div className='mb-1 text-[12px] font-medium text-text-tertiary'>{label}</div>
      <div className='flex items-center'>{children}</div>
    </div>
  )
}
