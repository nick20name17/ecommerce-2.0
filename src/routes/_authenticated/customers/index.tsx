import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowDown,
  ArrowUp,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  StickyNote,
  Trash2,
  UserPlus,
  UserRound,
  Users,
} from 'lucide-react'
import { useState } from 'react'

import { CustomerAssignDialog } from './-components/customer-assign-dialog'
import { CustomerDeleteDialog } from './-components/customer-delete-dialog'
import { CustomerModal } from './-components/customer-modal'
import { getCustomerDetailQuery, getCustomersQuery } from '@/api/customer/query'
import { getFieldConfigQuery } from '@/api/field-config/query'
import type { Customer } from '@/api/customer/schema'
import { EntityNotesSheet } from '@/components/common/entity-notes/entity-notes-sheet'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Pagination } from '@/components/common/filters/pagination'
import { PageEmpty } from '@/components/common/page-empty'
import { FilterChip, ICustomers, InitialsAvatar, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import { PresetPicker } from '@/components/common/filters/preset-picker'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  getCustomerTypeLabel,
} from '@/constants/customer'
import { isAdmin } from '@/constants/user'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { useProjectId } from '@/hooks/use-project-id'
import { formatPhone, getInitials, getUserDisplayName } from '@/helpers/formatters'
import { useLimitParam, useOffsetParam, useSearchParam } from '@/hooks/use-query-params'
import { cn } from '@/lib/utils'
import { useAuth } from '@/providers/auth'

// ── Helpers ──────────────────────────────────────────────────

type SortField = 'l_name' | 'contact_3' | 'in_level'
type SortDir = 'asc' | 'desc'

// ── Page Component ───────────────────────────────────────────

function CustomersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const [projectId] = useProjectId()
  const { user } = useAuth()
  const canAssign = !!user?.role && isAdmin(user.role)

  const [search, setSearch] = useSearchParam()
  const [offset] = useOffsetParam()
  const [limit] = useLimitParam()
  const [sortField, setSortField] = useState<SortField | null>('l_name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const [assignedToMe, setAssignedToMe] = useState(false)
  const [activePresetId, setActivePresetId] = useState<number | null>(null)

  const toggleAssignedToMe = () => {
    setAssignedToMe((v) => !v)
    setActivePresetId(null)
  }

  const selectPreset = (id: number | null) => {
    setActivePresetId(id)
    if (id != null) {
      setAssignedToMe(false)
    }
  }
  const [modalCustomer, setModalCustomer] = useState<Customer | 'create' | null>(null)
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null)
  const [customerForNotes, setCustomerForNotes] = useState<Customer | null>(null)
  const [assignCustomer, setAssignCustomer] = useState<Customer | null>(null)

  const ordering = sortField ? (sortDir === 'desc' ? `-${sortField}` : sortField) : undefined

  const params = {
    search: search || undefined,
    project_id: projectId ?? undefined,
    ordering,
    offset,
    limit,
    notes: true as const,
    assigned_to: assignedToMe ? 'me' : undefined,
    preset_id: activePresetId ?? undefined,
  }

  const { data, isLoading } = useQuery({
    ...getCustomersQuery(params),
    placeholderData: keepPreviousData,
  })

  const { data: _fieldConfig } = useQuery(getFieldConfigQuery(projectId))

  const customers = data?.results ?? []
  const totalCount = data?.count ?? 0

  // ── Sorting ──
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDir === 'asc') setSortDir('desc')
      else { setSortField(null); setSortDir('asc') }
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const editingCustomer = typeof modalCustomer === 'object' ? modalCustomer : null

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* ── Header ── */}
      <header
        className={cn('flex h-12 shrink-0 items-center gap-2.5 border-b border-border', isMobile ? 'px-3.5' : 'px-6')}
      >
        <SidebarTrigger className='-ml-1' />
        <div className='flex items-center gap-1.5'>
          <PageHeaderIcon icon={ICustomers} color={PAGE_COLORS.customers} />
          <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>Customers</h1>
        </div>

        <PresetPicker
          entityType='customer'
          value={activePresetId}
          onChange={selectPreset}
        />

        <div className='flex-1' />

        {/* Search */}
        <div className='hidden h-7 w-full max-w-[260px] items-center gap-1.5 rounded-[5px] border border-border bg-background px-2 transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50 sm:flex'>
          <Search className='size-3 shrink-0 text-text-tertiary' />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search by name, email, or phone...'
            className='flex-1 bg-transparent text-[13px] outline-none placeholder:text-text-tertiary'
          />
        </div>

        <div className='flex items-center gap-1.5'>
          <button
            type='button'
            className={cn(
              'inline-flex h-7 items-center gap-1 rounded-[5px] border px-2 text-[13px] font-medium',
              'transition-colors duration-[80ms] hover:bg-bg-hover',
              assignedToMe
                ? 'border-primary/30 bg-primary/5 text-foreground'
                : 'border-border bg-background text-text-secondary'
            )}
            onClick={toggleAssignedToMe}
          >
            <UserRound className='size-3' />
            Assigned to me
          </button>

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
      {(assignedToMe || activePresetId !== null) && (
        <div className={cn('flex shrink-0 flex-wrap items-center gap-1.5 border-b border-border py-1.5', isMobile ? 'px-3.5' : 'px-6')}>
          <button
            type='button'
            className='text-[13px] font-medium text-text-tertiary transition-colors duration-[80ms] hover:text-foreground'
            onClick={() => {
              setAssignedToMe(false)
              setActivePresetId(null)
            }}
          >
            Clear
          </button>
          {assignedToMe && (
            <FilterChip onRemove={() => setAssignedToMe(false)}>
              <UserRound className='size-3 text-text-tertiary' />
              Assigned to me
            </FilterChip>
          )}
        </div>
      )}

      {/* Customer list */}
      <div className='flex-1 overflow-y-auto'>
        {/* Column labels */}
        {!isMobile && (customers.length > 0 || isLoading) && (
          <div
            className={cn(
              'sticky top-0 z-10 flex select-none items-center border-b border-border bg-bg-secondary text-[13px] font-medium text-text-tertiary',
              bp === 'tablet' ? 'gap-4 px-5 py-1' : 'gap-6 px-6 py-1',
            )}
          >
            <SortableHeader field='l_name' label='Customer' sortField={sortField} sortDir={sortDir} onSort={handleSort} className='min-w-0 flex-1' />
            <div className='w-[130px] shrink-0'>Phone</div>
            {bp !== 'tablet' && <SortableHeader field='contact_3' label='Email' sortField={sortField} sortDir={sortDir} onSort={handleSort} className='w-[160px] shrink-0' />}
            <SortableHeader field='in_level' label='Type' sortField={sortField} sortDir={sortDir} onSort={handleSort} className='w-[100px] shrink-0' />
            <div className='w-[120px] shrink-0'>Responsible</div>
            <div className='w-[46px] shrink-0' />
            <div className='w-[28px] shrink-0' />
          </div>
        )}

        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) =>
            isMobile ? (
              <div key={i} className='border-b border-border-light px-3.5 py-2'>
                <div className='mb-1 flex items-center gap-2'>
                  <Skeleton className='size-5 shrink-0 rounded-full' />
                  <Skeleton className='h-3.5 w-28 rounded' />
                </div>
                <div className='flex items-center gap-2 pl-[28px]'>
                  <Skeleton className='h-3.5 w-14 rounded' />
                  <Skeleton className='h-3.5 w-20 rounded' />
                </div>
              </div>
            ) : (
              <div
                key={i}
                className={cn(
                  'flex items-center border-b border-border-light',
                  bp === 'tablet' ? 'gap-4 px-5 py-1.5' : 'gap-6 px-6 py-1.5'
                )}
              >
                <div className='flex min-w-0 flex-1 items-center gap-2'>
                  <Skeleton className='size-5 shrink-0 rounded-full' />
                  <Skeleton className='h-3.5 w-28 rounded' />
                  <Skeleton className='h-3.5 w-12 rounded' />
                </div>
                <div className='w-[130px] shrink-0'><Skeleton className='h-3.5 w-[90px] rounded' /></div>
                {bp !== 'tablet' && <div className='w-[160px] shrink-0'><Skeleton className='h-3.5 w-[120px] rounded' /></div>}
                <div className='w-[100px] shrink-0'><Skeleton className='h-[18px] w-[50px] rounded-[4px]' /></div>
                <div className='w-[120px] shrink-0'><Skeleton className='h-3.5 w-[70px] rounded' /></div>
                <div className='w-[46px] shrink-0' />
                <div className='w-[28px] shrink-0' />
              </div>
            )
          )
        ) : customers.length === 0 ? (
          <PageEmpty icon={Users} title='No matching customers' description='Try adjusting your search or filters.' />
        ) : (
          <>
            {customers.map((customer) => (
              <CustomerRow
                key={customer.id}
                customer={customer}
                isMobile={isMobile}
                isTablet={bp === 'tablet'}
                canAssign={canAssign}
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
                onMouseEnter={() => queryClient.prefetchQuery(getCustomerDetailQuery(customer.id, projectId))}
              />
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div className={cn('shrink-0 border-t border-border py-2', isMobile ? 'px-3.5' : 'px-6')}>
        <Pagination totalCount={totalCount} />
      </div>

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

// ── Sortable Header ─────────────────────────────────────────

function SortableHeader({
  field,
  label,
  sortField,
  sortDir,
  onSort,
  className,
}: {
  field: SortField
  label: string
  sortField: SortField | null
  sortDir: SortDir
  onSort: (field: SortField) => void
  className?: string
}) {
  const active = sortField === field
  return (
    <button
      type='button'
      className={cn(
        'group inline-flex items-center gap-1 text-left transition-colors duration-[80ms] hover:text-foreground',
        active && 'text-foreground',
        className
      )}
      onClick={() => onSort(field)}
    >
      {label}
      {active ? (
        sortDir === 'asc'
          ? <ArrowUp className='size-3' />
          : <ArrowDown className='size-3' />
      ) : (
        <ArrowUp className='size-3 opacity-30 group-hover:opacity-60 transition-opacity' />
      )}
    </button>
  )
}

// ── Customer Row ────────────────────────────────────────────

function CustomerRow({
  customer,
  isMobile,
  isTablet,
  canAssign,
  onEdit,
  onDelete,
  onNotes,
  onAssign,
  onClick,
  onMouseEnter,
}: {
  customer: Customer
  isMobile: boolean
  isTablet: boolean
  canAssign: boolean
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
  onNotes: (customer: Customer) => void
  onAssign: (customer: Customer) => void
  onClick: () => void
  onMouseEnter?: () => void
}) {
  const initials = getInitials(customer.l_name || '?')
  const phone = customer.contact_1 ? formatPhone(customer.contact_1) : null
  const email = customer.contact_3 || null
  const typeLabel = getCustomerTypeLabel(customer.in_level)

  const noteCount = typeof customer.notes_count === 'number' ? customer.notes_count : Array.isArray(customer.notes) ? customer.notes.length : 0

  if (isMobile) {
    return (
      <div
        className='cursor-pointer border-b border-border-light px-3.5 py-2 transition-colors duration-100 hover:bg-bg-hover'
        onClick={onClick}
        onMouseEnter={onMouseEnter}
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
      onMouseEnter={onMouseEnter}
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
      <div className='w-[100px] shrink-0'>
        {typeLabel !== '—' ? (
          <span className='inline-flex items-center rounded-[4px] bg-bg-secondary px-1.5 py-0.5 text-[13px] font-medium text-text-secondary'>
            {typeLabel}
          </span>
        ) : (
          <span className='text-[13px] text-text-tertiary'>&mdash;</span>
        )}
      </div>

      {/* Assign */}
      <div className='w-[120px] shrink-0'>
        {(() => {
          const assigned = customer.assigned_users?.length ? customer.assigned_users : customer.assigned_user ? [customer.assigned_user] : []
          const first = assigned[0]
          if (canAssign) {
            return (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type='button'
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-[5px] px-1 py-0.5 text-[13px] transition-colors duration-75 hover:bg-bg-active',
                      first ? 'text-text-secondary' : 'text-text-tertiary'
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      onAssign(customer)
                    }}
                  >
                    {first ? (
                      <>
                        <InitialsAvatar initials={getInitials(getUserDisplayName(first))} size={16} />
                        <span className='truncate'>{getUserDisplayName(first)}</span>
                        {assigned.length > 1 && <span className='text-[11px] text-text-tertiary'>+{assigned.length - 1}</span>}
                      </>
                    ) : (
                      <>
                        <UserPlus className='size-3.5' />
                        <span>Assign</span>
                      </>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {first ? `Assigned to ${assigned.map((u) => getUserDisplayName(u)).join(', ')} — click to change` : 'Assign a sales user'}
                </TooltipContent>
              </Tooltip>
            )
          }
          if (first) {
            return (
              <span className='inline-flex items-center gap-1.5 px-1 py-0.5 text-[13px] text-text-secondary'>
                <InitialsAvatar initials={getInitials(getUserDisplayName(first))} size={16} />
                <span className='truncate'>{getUserDisplayName(first)}</span>
                {assigned.length > 1 && <span className='text-[11px] text-text-tertiary'>+{assigned.length - 1}</span>}
              </span>
            )
          }
          return <span className='px-1 text-[13px] text-text-tertiary'>&mdash;</span>
        })()}
      </div>

      {/* Notes */}
      <div className='flex w-[46px] shrink-0 justify-center'>
        <button
          type='button'
          className={cn(
            'inline-flex h-[26px] w-[46px] items-center justify-center gap-1 rounded-[6px] border text-[12px] font-medium tabular-nums transition-colors duration-[80ms]',
            noteCount > 0
              ? 'border-border bg-bg-secondary text-text-secondary hover:bg-bg-active'
              : 'border-transparent text-text-quaternary hover:bg-bg-hover hover:text-text-tertiary',
          )}
          aria-label='Open notes'
          onClick={(e) => {
            e.stopPropagation()
            onNotes(customer)
          }}
        >
          <StickyNote className='size-3.5' />
          {noteCount > 0 && <span>{noteCount}</span>}
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
