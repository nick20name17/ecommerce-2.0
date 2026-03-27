import { Check, ChevronDown, Loader2, UserPlus, X } from 'lucide-react'
import { useState } from 'react'

import type { Customer } from '@/api/customer/schema'
import type { FieldConfigResponse } from '@/api/field-config/schema'
import type { Salesperson } from '@/api/salesperson/schema'
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
  editableFields?: string[]
  onFieldSave?: (field: string, value: string) => void
  salespersons?: Salesperson[]
  savingField?: string | null
  savingPriceLevel?: boolean
}

export const CustomerInfoPanel = ({ customer, fieldConfig, priceLevels, onPriceLevelChange, onAssign, editableFields = [], onFieldSave, salespersons, savingField, savingPriceLevel }: CustomerInfoPanelProps) => {
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

  const firstAssigned = customer.assigned_users?.length ? customer.assigned_users[0] : customer.assigned_user ?? null
  const assigneeName = firstAssigned ? getUserDisplayName(firstAssigned) : null
  const assigneeInitials = assigneeName
    ? assigneeName.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('')
    : null

  const canEditPriceLevel = !!(priceLevels?.length && onPriceLevelChange)
  const salesman = (customer.salesman as string) ?? ''
  const salesmanLabel = getColumnLabel('salesman', 'customer', fieldConfig)
  const canEditSalesman = !!(salespersons?.length && onFieldSave && editableFields.includes('salesman'))

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
                  disabled={savingPriceLevel}
                  className='inline-flex items-center gap-1 rounded-[4px] bg-bg-secondary px-1.5 py-0.5 text-[12px] font-medium text-text-secondary transition-colors duration-75 hover:bg-bg-active disabled:opacity-70'
                >
                  {savingPriceLevel && <Loader2 className='size-3 animate-spin text-text-tertiary' />}
                  {typeLabel !== '—' ? typeLabel : 'Select…'}
                  {!savingPriceLevel && <ChevronDown className='size-3 text-text-quaternary' />}
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
        <PanelRow label={salesmanLabel}>
          {canEditSalesman ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type='button'
                  disabled={savingField === 'salesman'}
                  className='inline-flex items-center gap-1 rounded-[4px] bg-bg-secondary px-1.5 py-0.5 text-[12px] font-medium text-text-secondary transition-colors duration-75 hover:bg-bg-active disabled:opacity-70'
                >
                  {savingField === 'salesman' && <Loader2 className='size-3 animate-spin text-text-tertiary' />}
                  {salesman || 'Select…'}
                  {savingField !== 'salesman' && <ChevronDown className='size-3 text-text-quaternary' />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='max-h-[240px] overflow-y-auto'>
                <DropdownMenuItem
                  onClick={() => onFieldSave!('salesman', '')}
                  className={cn(!salesman && 'font-semibold')}
                >
                  <span className='text-text-tertiary'>None</span>
                </DropdownMenuItem>
                {salespersons!.map((sp) => (
                  <DropdownMenuItem
                    key={sp.id}
                    onClick={() => onFieldSave!('salesman', sp.id)}
                    className={cn(salesman === sp.id && 'font-semibold')}
                  >
                    {sp.id}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : salesman ? (
            <span className='inline-flex items-center rounded-[4px] bg-bg-secondary px-1.5 py-0.5 text-[12px] font-medium text-text-secondary'>
              {salesman}
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
        {onFieldSave ? (
          <EditablePanelRow
            label='Phone'
            value={customer.contact_1 ?? ''}
            displayValue={phone ?? '—'}
            onSave={(v) => onFieldSave('contact_1', v)}
            validate={validatePhone}
            mask={applyPhoneMask}
            saving={savingField === 'contact_1'}
          />
        ) : (
          <PanelRow label='Phone'>
            <span>{phone ?? '—'}</span>
          </PanelRow>
        )}
        {onFieldSave ? (
          <EditablePanelRow
            label='Email'
            value={customer.contact_3 ?? ''}
            displayValue={email ?? '—'}
            onSave={(v) => onFieldSave('contact_3', v)}
            validate={validateEmail}
            saving={savingField === 'contact_3'}
            last
          />
        ) : (
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
        )}
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
        {firstAssigned ? (
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

// ── Editable Panel Row ──────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Formats digits as (XXX) XXX-XXXX or +1 (XXX) XXX-XXXX while typing */
function applyPhoneMask(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 0) return ''
  // +1 prefix
  if (digits.length > 10 && digits[0] === '1') {
    const d = digits.slice(1, 11)
    if (d.length <= 3) return `+1 (${d}`
    if (d.length <= 6) return `+1 (${d.slice(0, 3)}) ${d.slice(3)}`
    return `+1 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
  }
  const d = digits.slice(0, 10)
  if (d.length <= 3) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

function validatePhone(value: string): string | null {
  if (!value) return null
  const digits = value.replace(/\D/g, '')
  if (digits.length < 10) return 'Phone number must be at least 10 digits'
  return null
}

function validateEmail(value: string): string | null {
  if (!value) return null
  return EMAIL_REGEX.test(value) ? null : 'Invalid email address'
}

function EditablePanelRow({
  label,
  value,
  displayValue,
  onSave,
  last,
  validate,
  mask,
  saving = false,
}: {
  label: string
  value: string
  displayValue: string
  onSave: (value: string) => void
  last?: boolean
  validate?: (value: string) => string | null
  mask?: (raw: string) => string
  saving?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  const startEditing = () => {
    setDraft(mask ? mask(value) : value)
    setError(null)
    setEditing(true)
  }

  const commit = () => {
    const trimmed = draft.trim()
    if (validate) {
      const err = validate(trimmed)
      if (err) {
        setError(err)
        return
      }
    }
    setEditing(false)
    setError(null)
    if (trimmed !== value) {
      onSave(trimmed)
    }
  }

  const cancel = () => {
    setEditing(false)
    setError(null)
  }

  if (editing) {
    const isDirty = draft.trim() !== value
    return (
      <div className={cn('px-4 py-2', !last && 'border-b border-border-light')}>
        <div className='flex items-center gap-2'>
          <span className='shrink-0 text-[12px] font-medium text-text-tertiary'>{label}</span>
          <input
            value={draft}
            onChange={(e) => {
              setDraft(mask ? mask(e.target.value) : e.target.value)
              if (error) setError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') cancel()
            }}
            autoFocus
            className={cn(
              'min-w-0 flex-1 rounded border bg-background px-2 py-0.5 text-right text-[13px] text-foreground shadow-sm outline-none',
              error
                ? 'border-destructive focus:border-destructive focus:ring-1 focus:ring-destructive/20'
                : 'border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20',
            )}
          />
          <div className='flex shrink-0 items-center gap-0.5'>
            <button
              type='button'
              className={cn(
                'inline-flex size-5 items-center justify-center rounded transition-colors duration-75',
                isDirty
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'text-text-tertiary hover:bg-bg-hover',
              )}
              onMouseDown={(e) => {
                e.preventDefault()
                commit()
              }}
            >
              <Check className='size-3' />
            </button>
            <button
              type='button'
              className='inline-flex size-5 items-center justify-center rounded text-text-tertiary transition-colors duration-75 hover:bg-bg-hover hover:text-foreground'
              onMouseDown={(e) => {
                e.preventDefault()
                cancel()
              }}
            >
              <X className='size-3' />
            </button>
          </div>
        </div>
        {error && (
          <p className='mt-1 text-right text-[11px] text-destructive'>{error}</p>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-2.5 transition-colors duration-75',
        saving ? 'pointer-events-none opacity-70' : 'cursor-pointer hover:bg-bg-hover/50',
        !last && 'border-b border-border-light',
      )}
      onClick={startEditing}
    >
      <span className='text-[12px] font-medium text-text-tertiary'>{label}</span>
      <div className='flex items-center gap-1.5'>
        {saving && <Loader2 className='size-3 animate-spin text-text-tertiary' />}
        <span className={cn('text-[13px] font-medium', value ? 'text-foreground' : 'text-text-tertiary')}>
          {displayValue}
        </span>
      </div>
    </div>
  )
}
