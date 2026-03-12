import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Check,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  StickyNote,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'
import { useState } from 'react'

import { CustomerAssignDialog } from './-components/customer-assign-dialog'
import { CustomerDeleteDialog } from './-components/customer-delete-dialog'
import { CustomerModal } from './-components/customer-modal'
import { getCustomersQuery } from '@/api/customer/query'
import { getFieldConfigQuery } from '@/api/field-config/query'
import type { Customer, CustomerParams } from '@/api/customer/schema'
import { EntityNotesSheet } from '@/components/common/entity-notes/entity-notes-sheet'
import { PageEmpty } from '@/components/common/page-empty'
import { getEntityNotesQuery } from '@/api/note/query'
import { FilterChip, FilterPopover, ICustomers, InitialsAvatar, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  CUSTOMER_TYPE_LABELS,
  CUSTOMER_TYPE_OPTIONS,
  getCustomerTypeLabel,
} from '@/constants/customer'
import type { CustomerType } from '@/constants/customer'
import { isAdmin } from '@/constants/user'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { useProjectId } from '@/hooks/use-project-id'
import { formatPhone } from '@/helpers/formatters'
import { cn } from '@/lib/utils'
import { useAuth } from '@/providers/auth'

// ── Helpers ──────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
}

// ── Page Component ───────────────────────────────────────────

function CustomersPage() {
  const navigate = useNavigate()
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const [projectId] = useProjectId()
  const { user } = useAuth()
  const canAssign = !!user?.role && isAdmin(user.role)

  const [search, setSearch] = useState('')
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set())

  const [modalCustomer, setModalCustomer] = useState<Customer | 'create' | null>(null)
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null)
  const [customerForNotes, setCustomerForNotes] = useState<Customer | null>(null)
  const [assignCustomer, setAssignCustomer] = useState<Customer | null>(null)

  const params: CustomerParams = {
    search: search || undefined,
    project_id: projectId ?? undefined,
    limit: 200,
  }

  const { data, isLoading } = useQuery({
    ...getCustomersQuery(params),
    placeholderData: keepPreviousData,
  })

  const { data: _fieldConfig } = useQuery(getFieldConfigQuery(projectId))

  const allCustomers = data?.results ?? []

  // Client-side filtering
  const customers = allCustomers.filter((c) => {
    if (activeTypes.size > 0 && !activeTypes.has(c.in_level ?? '')) return false
    return true
  })

  const hasFilters = activeTypes.size > 0

  const toggleType = (type: string) => {
    setActiveTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  const clearAllFilters = () => {
    setActiveTypes(new Set())
  }

  const editingCustomer = typeof modalCustomer === 'object' ? modalCustomer : null

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* ── Header ── */}
      <header
        className='flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-6'
      >
        <div className='flex items-center gap-1.5'>
          <PageHeaderIcon icon={ICustomers} color={PAGE_COLORS.customers} />
          <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>Customers</h1>
        </div>

        <div className='flex-1' />

        {/* Search */}
        <div className='hidden h-7 w-[260px] items-center gap-1.5 rounded-[5px] border border-border bg-background px-2 transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50 sm:flex'>
          <Search className='size-3 shrink-0 text-text-tertiary' />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search by name, email, or phone...'
            className='flex-1 bg-transparent text-[13px] outline-none placeholder:text-text-tertiary'
          />
        </div>

        <div className='flex items-center gap-1.5'>
          {/* Type filter */}
          <FilterPopover
            label='Type'
            active={activeTypes.size > 0}
          >
            {CUSTOMER_TYPE_OPTIONS.map(({ value, label }) => {
              const selected = activeTypes.has(value)
              return (
                <button
                  key={value}
                  type='button'
                  className={cn(
                    'flex w-full items-center gap-2 rounded-[5px] px-2 py-[3px] text-left text-[13px] font-medium',
                    'transition-colors duration-[80ms] hover:bg-bg-hover'
                  )}
                  onClick={() => toggleType(value)}
                >
                  <div
                    className={cn(
                      'flex size-3.5 items-center justify-center rounded-[3px] border transition-colors duration-[80ms]',
                      selected ? 'border-primary bg-primary' : 'border-border'
                    )}
                  >
                    {selected && (
                      <Check className='size-2.5 text-primary-foreground' strokeWidth={3} />
                    )}
                  </div>
                  <span className='flex-1'>{label}</span>
                </button>
              )
            })}
          </FilterPopover>

          <button
            type='button'
            className='inline-flex h-7 items-center gap-1 rounded-[5px] bg-primary px-2 text-[13px] font-semibold text-primary-foreground transition-colors duration-[80ms] hover:opacity-90 sm:px-2.5'
            onClick={() => setModalCustomer('create')}
          >
            <Plus className='size-3.5' />
            <span className='hidden sm:inline'>New Customer</span>
          </button>
        </div>
      </header>

      {/* Active filter chips */}
      {hasFilters && (
        <div
          className='flex shrink-0 flex-wrap items-center gap-1.5 border-b border-border px-6 py-1.5'
        >
          <button
            type='button'
            className='text-[13px] font-medium text-text-tertiary transition-colors duration-[80ms] hover:text-foreground'
            onClick={clearAllFilters}
          >
            Clear
          </button>
          {Array.from(activeTypes).map((type) => (
            <FilterChip key={`type-${type}`} onRemove={() => toggleType(type)}>
              <span className='text-text-tertiary'>Type is</span>
              {CUSTOMER_TYPE_LABELS[type as CustomerType] ?? type}
            </FilterChip>
          ))}
        </div>
      )}

      {/* Customer list */}
      <div className='flex-1 overflow-y-auto'>
        {/* Column labels */}
        {!isMobile && (customers.length > 0 || isLoading) && (
          <div
            className={cn(
              'sticky top-0 z-10 flex select-none items-center border-b border-border bg-bg-secondary/60 text-[13px] font-medium text-text-tertiary backdrop-blur-sm',
              bp === 'tablet' ? 'gap-4 px-5 py-1' : 'gap-6 px-6 py-1',
            )}
          >
            <div className='min-w-0 flex-1'>Customer</div>
            <div className='w-[130px] shrink-0'>Phone</div>
            {bp !== 'tablet' && <div className='w-[160px] shrink-0'>Email</div>}
            <div className='w-[80px] shrink-0'>Type</div>
            <div className='w-[62px] shrink-0' />
            <div className='w-[28px] shrink-0' />
          </div>
        )}

        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center border-b border-border-light',
                isMobile ? 'gap-2 px-3.5 py-2.5' : bp === 'tablet' ? 'gap-4 px-5 py-1.5' : 'gap-6 px-6 py-1.5',
              )}
            >
              <div className='flex min-w-0 flex-1 items-center gap-2'>
                <Skeleton className='size-5 shrink-0 rounded-full' />
                <Skeleton className='h-3.5 w-28 rounded' />
                <Skeleton className='h-3.5 w-12 rounded' />
              </div>
              {!isMobile && (
                <>
                  <div className='w-[130px] shrink-0'><Skeleton className='h-3.5 w-[90px] rounded' /></div>
                  {bp !== 'tablet' && <div className='w-[160px] shrink-0'><Skeleton className='h-3.5 w-[120px] rounded' /></div>}
                  <div className='w-[80px] shrink-0'><Skeleton className='h-[18px] w-[50px] rounded-[4px]' /></div>
                  <div className='w-[62px] shrink-0' />
                  <div className='w-[28px] shrink-0' />
                </>
              )}
            </div>
          ))
        ) : customers.length === 0 ? (
          <PageEmpty icon={Users} title='No matching customers' description='Try adjusting your search or filters.' />
        ) : (
          customers.map((customer) => (
            <CustomerRow
              key={customer.id}
              customer={customer}
              isMobile={isMobile}
              isTablet={bp === 'tablet'}
              canAssign={canAssign}
              projectId={projectId}
              onEdit={setModalCustomer}
              onDelete={setDeleteCustomer}
              onNotes={setCustomerForNotes}
              onAssign={setAssignCustomer}
              onClick={() =>
                navigate({
                  to: '/customers/$customerId',
                  params: { customerId: customer.id },
                })
              }
            />
          ))
        )}
      </div>

      {/* Footer */}
      {customers.length > 0 && (
        <div
          className={cn(
            'shrink-0 border-t border-border py-2',
            isMobile ? 'px-4' : 'px-6'
          )}
        >
          <p className='text-[13px] tabular-nums text-text-tertiary'>
            {customers.length} customer{customers.length !== 1 ? 's' : ''}
            {data?.count && data.count !== customers.length && (
              <span> of {data.count} total</span>
            )}
          </p>
        </div>
      )}

      {/* Dialogs */}
      <CustomerModal
        key={editingCustomer?.id ?? 'create'}
        open={modalCustomer !== null}
        onOpenChange={(open) => !open && setModalCustomer(null)}
        customer={editingCustomer}
      />
      <CustomerDeleteDialog
        customer={deleteCustomer}
        open={!!deleteCustomer}
        onOpenChange={(open) => !open && setDeleteCustomer(null)}
      />
      <CustomerAssignDialog
        customer={assignCustomer}
        open={!!assignCustomer}
        onOpenChange={(open) => !open && setAssignCustomer(null)}
        projectId={projectId}
      />
      <EntityNotesSheet
        open={!!customerForNotes}
        onOpenChange={(open) => !open && setCustomerForNotes(null)}
        entityType='customer'
        entityLabel={
          customerForNotes
            ? `Customer ${customerForNotes.l_name ?? customerForNotes.autoid}`
            : ''
        }
        autoid={customerForNotes?.autoid ?? ''}
        projectId={projectId}
      />
    </div>
  )
}

// ── Customer Row ────────────────────────────────────────────

function CustomerRow({
  customer,
  isMobile,
  isTablet,
  canAssign,
  projectId,
  onEdit,
  onDelete,
  onNotes,
  onAssign,
  onClick,
}: {
  customer: Customer
  isMobile: boolean
  isTablet: boolean
  canAssign: boolean
  projectId: number | null
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
  onNotes: (customer: Customer) => void
  onAssign: (customer: Customer) => void
  onClick: () => void
}) {
  const initials = getInitials(customer.l_name || '?')
  const phone = customer.contact_1 ? formatPhone(customer.contact_1) : null
  const email = customer.contact_3 || null
  const typeLabel = getCustomerTypeLabel(customer.in_level)

  const { data: notes } = useQuery({
    ...getEntityNotesQuery('customer', customer.autoid, projectId),
    staleTime: 5 * 60 * 1000,
  })
  const noteCount = notes?.length ?? 0

  if (isMobile) {
    return (
      <div
        className='cursor-pointer border-b border-border-light px-3.5 py-2 transition-colors duration-100 hover:bg-bg-hover'
        onClick={onClick}
      >
        <div className='mb-1 flex items-center gap-2'>
          <InitialsAvatar initials={initials} size={20} />
          <span className='min-w-0 flex-1 truncate text-[13px] font-medium text-foreground'>
            {customer.l_name}
          </span>
        </div>
        <div className='flex flex-wrap items-center gap-2 pl-[28px]'>
          <span className='text-[13px] tabular-nums text-text-tertiary'>
            CUS-{customer.id}
          </span>
          {phone && (
            <span className='text-[13px] text-text-tertiary'>{phone}</span>
          )}
          {typeLabel !== '—' && (
            <span className='inline-flex items-center rounded-[4px] bg-bg-secondary px-1.5 py-0.5 text-[13px] font-medium text-text-tertiary'>
              {typeLabel}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group/row flex cursor-pointer items-center border-b border-border-light text-foreground transition-colors duration-100 hover:bg-bg-hover',
        isTablet ? 'gap-4 px-5 py-1.5' : 'gap-6 px-6 py-1.5'
      )}
      onClick={onClick}
    >
      {/* Customer: avatar + name + ID */}
      <div className='flex min-w-0 flex-1 items-center gap-2'>
        <InitialsAvatar initials={initials} size={20} />
        <Tooltip>
          <TooltipTrigger asChild>
            <span className='min-w-0 truncate text-[13px] font-medium'>{customer.l_name}</span>
          </TooltipTrigger>
          <TooltipContent side='top'>{customer.l_name}</TooltipContent>
        </Tooltip>
        <span className='shrink-0 text-[13px] tabular-nums text-text-tertiary'>
          CUS-{customer.id}
        </span>
      </div>

      {/* Phone */}
      <div className='w-[130px] shrink-0 truncate text-[13px] text-text-secondary'>
        {phone ?? <span className='text-text-tertiary'>&mdash;</span>}
      </div>

      {/* Email */}
      {!isTablet && (
        <div className='w-[160px] shrink-0'>
          {email ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className='block truncate text-[13px] text-text-secondary'>{email}</span>
              </TooltipTrigger>
              <TooltipContent>{email}</TooltipContent>
            </Tooltip>
          ) : (
            <span className='text-[13px] text-text-tertiary'>&mdash;</span>
          )}
        </div>
      )}

      {/* Type */}
      <div className='w-[80px] shrink-0'>
        {typeLabel !== '—' ? (
          <span className='inline-flex items-center rounded-[4px] bg-bg-secondary px-1.5 py-0.5 text-[13px] font-medium text-text-secondary'>
            {typeLabel}
          </span>
        ) : (
          <span className='text-[13px] text-text-tertiary'>&mdash;</span>
        )}
      </div>

      {/* Notes */}
      <div className='flex w-[62px] shrink-0 justify-center'>
        <button
          type='button'
          className={cn(
            'inline-flex items-center gap-1.5 rounded-[6px] border px-2 py-1 text-[13px] font-medium transition-colors duration-[80ms]',
            noteCount > 0
              ? 'border-border bg-bg-secondary text-text-secondary hover:bg-bg-active'
              : 'border-transparent text-text-tertiary hover:bg-bg-hover hover:text-text-secondary'
          )}
          aria-label='Open notes'
          onClick={(e) => {
            e.stopPropagation()
            onNotes(customer)
          }}
        >
          <StickyNote className='size-3.5' />
          <span className='tabular-nums'>{noteCount}</span>
        </button>
      </div>

      {/* Actions */}
      <div
        className='flex w-[28px] shrink-0 items-center justify-center'
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role='group'
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type='button'
              className='inline-flex size-6 items-center justify-center rounded-[6px] text-text-tertiary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground'
              aria-label='Customer actions'
            >
              <MoreHorizontal className='size-4' />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align='end'
            className='w-[180px] rounded-[8px] p-1'
            style={{ boxShadow: 'var(--dropdown-shadow)' }}
          >
            {canAssign && (
              <DropdownMenuItem
                className='cursor-pointer gap-2 rounded-[6px] px-2 py-1 text-[13px]'
                onClick={() => onAssign(customer)}
              >
                <UserPlus className='size-3.5' />
                Assign
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className='cursor-pointer gap-2 rounded-[6px] px-2 py-1 text-[13px]'
              onClick={() => onEdit(customer)}
            >
              <Pencil className='size-3.5' />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              variant='destructive'
              className='cursor-pointer gap-2 rounded-[6px] px-2 py-1 text-[13px]'
              onClick={() => onDelete(customer)}
            >
              <Trash2 className='size-3.5' />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/customers/')({
  component: CustomersPage,
  head: () => ({
    meta: [{ title: 'Customers' }],
  }),
})
