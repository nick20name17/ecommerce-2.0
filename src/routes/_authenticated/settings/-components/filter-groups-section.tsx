import {
  ChevronDown,
  ChevronRight,
  Filter,
  GripVertical,
  Package,
  Pencil,
  Plus,
  Trash2,
  Users,
  FileText,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_CLASS,
  type OrderStatus,
} from '@/constants/order'
import {
  PROPOSAL_STATUS_LABELS,
  PROPOSAL_STATUS_CLASS,
  type ProposalStatus,
} from '@/constants/proposal'
import {
  CUSTOMER_TYPE_LABELS,
  type CustomerType,
} from '@/constants/customer'
import { USER_ROLES, USER_ROLE_LABELS, type UserRole } from '@/constants/user'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────

type EntityType = 'orders' | 'proposals' | 'customers'

interface FilterCondition {
  id: string
  field: string
  operator: string
  value: string
  label: string
}

type AssignTarget =
  | { type: 'role'; value: UserRole }
  | { type: 'user'; userId: string; userName: string }

interface FilterGroup {
  id: string
  name: string
  entity: EntityType
  assignedTo: AssignTarget[]
  conditions: FilterCondition[]
  isActive: boolean
}

// ── Sample data ──────────────────────────────────────────────

const SAMPLE_FILTER_GROUPS: FilterGroup[] = [
  {
    id: 'fg-1',
    name: 'Active Orders',
    entity: 'orders',
    assignedTo: [{ type: 'role', value: 'sale' }],
    conditions: [
      { id: 'c1', field: 'status', operator: 'is', value: 'U', label: 'Unprocessed' },
      { id: 'c2', field: 'status', operator: 'is', value: 'O', label: 'Open' },
    ],
    isActive: true,
  },
  {
    id: 'fg-2',
    name: 'Completed Orders',
    entity: 'orders',
    assignedTo: [
      { type: 'role', value: 'admin' },
      { type: 'role', value: 'manager' },
    ],
    conditions: [
      { id: 'c3', field: 'status', operator: 'is', value: 'X', label: 'Closed' },
      { id: 'c4', field: 'status', operator: 'is', value: 'P', label: 'Paid' },
    ],
    isActive: true,
  },
  {
    id: 'fg-3',
    name: 'New Proposals',
    entity: 'proposals',
    assignedTo: [{ type: 'role', value: 'sale' }],
    conditions: [
      { id: 'c5', field: 'status', operator: 'is', value: 'N', label: 'New' },
      { id: 'c6', field: 'status', operator: 'is', value: 'O', label: 'Open' },
    ],
    isActive: true,
  },
  {
    id: 'fg-4',
    name: 'Wholesale Accounts',
    entity: 'customers',
    assignedTo: [
      { type: 'user', userId: 'u-1', userName: 'Sarah Miller' },
    ],
    conditions: [
      { id: 'c7', field: 'type', operator: 'is', value: 'W', label: 'Wholesale' },
    ],
    isActive: false,
  },
]

// ── Entity config ────────────────────────────────────────────

const ENTITY_CONFIG: Record<EntityType, {
  label: string
  icon: typeof Package
  color: string
  fields: { value: string; label: string; options: { value: string; label: string; className?: string }[] }[]
}> = {
  orders: {
    label: 'Orders',
    icon: Package,
    color: 'text-amber-600 bg-amber-500/10 dark:text-amber-400',
    fields: [
      {
        value: 'status',
        label: 'Status',
        options: Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({
          value,
          label,
          className: ORDER_STATUS_CLASS[value as OrderStatus],
        })),
      },
    ],
  },
  proposals: {
    label: 'Proposals',
    icon: FileText,
    color: 'text-violet-600 bg-violet-500/10 dark:text-violet-400',
    fields: [
      {
        value: 'status',
        label: 'Status',
        options: Object.entries(PROPOSAL_STATUS_LABELS).map(([value, label]) => ({
          value,
          label,
          className: PROPOSAL_STATUS_CLASS[value as ProposalStatus],
        })),
      },
    ],
  },
  customers: {
    label: 'Customers',
    icon: Users,
    color: 'text-blue-600 bg-blue-500/10 dark:text-blue-400',
    fields: [
      {
        value: 'type',
        label: 'Type',
        options: Object.entries(CUSTOMER_TYPE_LABELS).map(([value, label]) => ({
          value,
          label,
        })),
      },
    ],
  },
}

const ROLE_OPTIONS = Object.entries(USER_ROLE_LABELS).map(([value, label]) => ({
  value: value as UserRole,
  label,
}))

// ── Main component ───────────────────────────────────────────

export const FilterGroupsSection = () => {
  const [groups, setGroups] = useState<FilterGroup[]>(SAMPLE_FILTER_GROUPS)
  const [expandedId, setExpandedId] = useState<string | null>(SAMPLE_FILTER_GROUPS[0]?.id ?? null)
  const [editingGroup, setEditingGroup] = useState<FilterGroup | 'create' | null>(null)

  const handleToggle = (id: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, isActive: !g.isActive } : g))
    )
    toast.info('Filter groups will be synced once the backend is connected.')
  }

  const handleDelete = (id: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== id))
    toast.info('Filter group removed (local only).')
  }

  const handleSave = (group: FilterGroup) => {
    setGroups((prev) => {
      const exists = prev.find((g) => g.id === group.id)
      if (exists) return prev.map((g) => (g.id === group.id ? group : g))
      return [...prev, group]
    })
    setEditingGroup(null)
    toast.info('Filter group saved (local only).')
  }

  const entityGroups = (['orders', 'proposals', 'customers'] as EntityType[]).map((entity) => ({
    entity,
    config: ENTITY_CONFIG[entity],
    groups: groups.filter((g) => g.entity === entity),
  }))

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      {/* Banner */}
      <div className='flex shrink-0 items-center gap-2.5 border-b border-amber-200 bg-amber-50 px-6 py-2 dark:border-amber-900/50 dark:bg-amber-950/30'>
        <Filter className='size-3.5 shrink-0 text-amber-600 dark:text-amber-400' />
        <p className='flex-1 text-[13px] text-amber-800 dark:text-amber-300'>
          Filter groups are a preview — changes are local only. Backend integration is coming soon.
        </p>
        <span className='shrink-0 rounded-[4px] bg-amber-200/60 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-800/40 dark:text-amber-300'>
          Coming soon
        </span>
      </div>

      <div className='flex-1 overflow-y-scroll'>
        <div className='mx-auto max-w-[680px] px-8 py-6'>
          {/* Description */}
          <div className='mb-6'>
            <h2 className='text-[14px] font-semibold text-foreground'>Filter Groups</h2>
            <p className='mt-1 text-[13px] leading-relaxed text-text-tertiary'>
              Configure which filter presets are available on list pages. Assign them to roles or specific users to control what each person sees by default.
            </p>
          </div>

          {/* Add button */}
          <div className='mb-4'>
            <button
              type='button'
              className='inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-[6px] border border-dashed border-border text-[13px] font-medium text-text-secondary transition-colors duration-75 hover:border-primary/30 hover:bg-primary/[0.04] hover:text-primary'
              onClick={() => setEditingGroup('create')}
            >
              <Plus className='size-3.5' />
              New Filter Group
            </button>
          </div>

          {/* Grouped by entity */}
          {entityGroups.map(({ entity, config, groups: entityGrps }) => {
            const Icon = config.icon
            return (
              <div key={entity} className='mb-5'>
                {/* Entity heading */}
                <div className='mb-2 flex items-center gap-2'>
                  <div className={cn('flex size-5 items-center justify-center rounded-[4px]', config.color)}>
                    <Icon className='size-3' />
                  </div>
                  <span className='text-[12px] font-semibold uppercase tracking-[0.05em] text-text-tertiary'>
                    {config.label}
                  </span>
                  <span className='text-[11px] tabular-nums text-text-quaternary'>
                    {entityGrps.length}
                  </span>
                </div>

                {entityGrps.length === 0 ? (
                  <div className='rounded-[8px] border border-dashed border-border px-4 py-5 text-center text-[13px] text-text-quaternary'>
                    No filter groups for {config.label.toLowerCase()}
                  </div>
                ) : (
                  <div className='overflow-hidden rounded-[8px] border border-border'>
                    {entityGrps.map((group, i) => {
                      const isExpanded = expandedId === group.id
                      return (
                        <div
                          key={group.id}
                          className={cn(i < entityGrps.length - 1 && 'border-b border-border-light')}
                        >
                          {/* Row header */}
                          <div
                            className='flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors duration-75 hover:bg-bg-hover/40'
                            onClick={() => setExpandedId(isExpanded ? null : group.id)}
                          >
                            <GripVertical className='size-3.5 shrink-0 text-text-quaternary' />
                            {isExpanded ? (
                              <ChevronDown className='size-3.5 shrink-0 text-text-tertiary' />
                            ) : (
                              <ChevronRight className='size-3.5 shrink-0 text-text-tertiary' />
                            )}
                            <span className='min-w-0 flex-1 truncate text-[13px] font-medium text-foreground'>
                              {group.name}
                            </span>

                            {/* Assigned to badges */}
                            <div className='flex items-center gap-1'>
                              {group.assignedTo.slice(0, 2).map((target, ti) => (
                                <span
                                  key={ti}
                                  className='rounded-[4px] bg-bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-text-secondary'
                                >
                                  {target.type === 'role'
                                    ? USER_ROLE_LABELS[target.value]
                                    : target.userName}
                                </span>
                              ))}
                              {group.assignedTo.length > 2 && (
                                <span className='text-[11px] text-text-quaternary'>
                                  +{group.assignedTo.length - 2}
                                </span>
                              )}
                            </div>

                            {/* Condition count */}
                            <span className='shrink-0 rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[11px] font-medium tabular-nums text-text-tertiary'>
                              {group.conditions.length} rule{group.conditions.length !== 1 ? 's' : ''}
                            </span>

                            {/* Toggle */}
                            <button
                              type='button'
                              className={cn(
                                'relative inline-flex h-[18px] w-[30px] shrink-0 items-center rounded-full transition-colors duration-150',
                                group.isActive ? 'bg-primary' : 'bg-foreground/15'
                              )}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggle(group.id)
                              }}
                            >
                              <span
                                className={cn(
                                  'inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform duration-150',
                                  group.isActive ? 'translate-x-[14px]' : 'translate-x-[2px]'
                                )}
                              />
                            </button>

                            {/* Actions */}
                            <div className='flex items-center gap-0.5'>
                              <button
                                type='button'
                                className='inline-flex size-6 items-center justify-center rounded-[5px] text-text-quaternary transition-colors duration-75 hover:bg-bg-active hover:text-foreground'
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingGroup(group)
                                }}
                              >
                                <Pencil className='size-3' />
                              </button>
                              <button
                                type='button'
                                className='inline-flex size-6 items-center justify-center rounded-[5px] text-text-quaternary transition-colors duration-75 hover:bg-destructive/10 hover:text-destructive'
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDelete(group.id)
                                }}
                              >
                                <Trash2 className='size-3' />
                              </button>
                            </div>
                          </div>

                          {/* Expanded detail */}
                          {isExpanded && (
                            <div className='border-t border-border-light bg-foreground/[0.015] px-4 py-3'>
                              {/* Conditions */}
                              <div className='mb-3'>
                                <span className='text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary'>
                                  Conditions
                                </span>
                                <div className='mt-1.5 flex flex-wrap gap-1.5'>
                                  {group.conditions.map((cond) => (
                                    <span
                                      key={cond.id}
                                      className='inline-flex items-center gap-1.5 rounded-[5px] border border-border bg-background px-2 py-1 text-[12px]'
                                    >
                                      <span className='font-medium text-text-secondary'>{cond.field}</span>
                                      <span className='text-text-quaternary'>{cond.operator}</span>
                                      <span className='font-medium text-foreground'>{cond.label}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Assigned to */}
                              <div>
                                <span className='text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary'>
                                  Assigned To
                                </span>
                                <div className='mt-1.5 flex flex-wrap gap-1.5'>
                                  {group.assignedTo.map((target, ti) => (
                                    <span
                                      key={ti}
                                      className='inline-flex items-center gap-1.5 rounded-[5px] border border-border bg-background px-2 py-1 text-[12px]'
                                    >
                                      {target.type === 'role' ? (
                                        <>
                                          <span className='size-1.5 rounded-full bg-primary' />
                                          <span className='font-medium text-foreground'>
                                            {USER_ROLE_LABELS[target.value]}
                                          </span>
                                          <span className='text-text-quaternary'>role</span>
                                        </>
                                      ) : (
                                        <>
                                          <span className='size-1.5 rounded-full bg-blue-500' />
                                          <span className='font-medium text-foreground'>
                                            {target.userName}
                                          </span>
                                          <span className='text-text-quaternary'>user</span>
                                        </>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Create / Edit dialog */}
      {editingGroup !== null && (
        <FilterGroupDialog
          group={editingGroup === 'create' ? null : editingGroup}
          open
          onOpenChange={(open) => !open && setEditingGroup(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

// ── Create/Edit Dialog ───────────────────────────────────────

function FilterGroupDialog({
  group,
  open,
  onOpenChange,
  onSave,
}: {
  group: FilterGroup | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (group: FilterGroup) => void
}) {
  const isNew = !group
  const [name, setName] = useState(group?.name ?? '')
  const [entity, setEntity] = useState<EntityType>(group?.entity ?? 'orders')
  const [conditions, setConditions] = useState<FilterCondition[]>(group?.conditions ?? [])
  const [assignedTo, setAssignedTo] = useState<AssignTarget[]>(group?.assignedTo ?? [])

  const entityConfig = ENTITY_CONFIG[entity]
  const statusField = entityConfig.fields[0]

  const toggleConditionValue = (value: string, label: string) => {
    setConditions((prev) => {
      const exists = prev.find((c) => c.value === value)
      if (exists) return prev.filter((c) => c.value !== value)
      return [...prev, {
        id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        field: statusField.value,
        operator: 'is',
        value,
        label,
      }]
    })
  }

  const toggleRole = (role: UserRole) => {
    setAssignedTo((prev) => {
      const exists = prev.find((a) => a.type === 'role' && a.value === role)
      if (exists) return prev.filter((a) => !(a.type === 'role' && a.value === role))
      return [...prev, { type: 'role', value: role }]
    })
  }

  const handleSubmit = () => {
    if (!name.trim()) return
    onSave({
      id: group?.id ?? `fg-${Date.now()}`,
      name: name.trim(),
      entity,
      conditions,
      assignedTo,
      isActive: group?.isActive ?? true,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[500px]'>
        <DialogHeader className='border-b border-border px-5 py-3'>
          <DialogTitle className='text-[14px]'>
            {isNew ? 'New Filter Group' : 'Edit Filter Group'}
          </DialogTitle>
        </DialogHeader>

        <div className='min-h-0 flex-1 overflow-y-auto'>
          <div className='space-y-5 px-5 py-4'>
            {/* Name */}
            <div>
              <label className='mb-1.5 block text-[12px] font-medium text-text-secondary'>
                Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g. Active Orders for Sales'
                className='h-9 w-full rounded-[6px] border border-border bg-background px-3 text-[13px] outline-none transition-[border-color,box-shadow] placeholder:text-text-quaternary focus:border-ring focus:ring-2 focus:ring-ring/50'
              />
            </div>

            {/* Entity selector */}
            <div>
              <label className='mb-1.5 block text-[12px] font-medium text-text-secondary'>
                Entity
              </label>
              <div className='flex gap-1.5'>
                {(['orders', 'proposals', 'customers'] as EntityType[]).map((e) => {
                  const cfg = ENTITY_CONFIG[e]
                  const Icon = cfg.icon
                  const isSelected = entity === e
                  return (
                    <button
                      key={e}
                      type='button'
                      className={cn(
                        'inline-flex h-8 items-center gap-1.5 rounded-[6px] border px-3 text-[13px] font-medium transition-colors duration-75',
                        isSelected
                          ? 'border-primary/30 bg-primary/[0.08] text-primary'
                          : 'border-border bg-background text-text-secondary hover:bg-bg-hover'
                      )}
                      onClick={() => {
                        setEntity(e)
                        setConditions([])
                      }}
                    >
                      <Icon className='size-3.5' />
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Filter values */}
            <div>
              <label className='mb-1.5 block text-[12px] font-medium text-text-secondary'>
                {statusField.label} filter
              </label>
              <div className='flex flex-wrap gap-1.5'>
                {statusField.options.map((opt) => {
                  const isSelected = conditions.some((c) => c.value === opt.value)
                  return (
                    <button
                      key={opt.value}
                      type='button'
                      className={cn(
                        'inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[12px] font-medium transition-all duration-75',
                        isSelected
                          ? 'border-primary/30 bg-primary/[0.08] text-primary ring-1 ring-primary/20'
                          : 'border-border bg-background text-text-secondary hover:bg-bg-hover'
                      )}
                      onClick={() => toggleConditionValue(opt.value, opt.label)}
                    >
                      {isSelected && (
                        <span className='size-1.5 rounded-full bg-primary' />
                      )}
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Assign to roles */}
            <div>
              <label className='mb-1.5 block text-[12px] font-medium text-text-secondary'>
                Assign to roles
              </label>
              <div className='flex flex-wrap gap-1.5'>
                {ROLE_OPTIONS.map((role) => {
                  const isSelected = assignedTo.some(
                    (a) => a.type === 'role' && a.value === role.value
                  )
                  return (
                    <button
                      key={role.value}
                      type='button'
                      className={cn(
                        'inline-flex h-7 items-center gap-1.5 rounded-[6px] border px-2.5 text-[12px] font-medium transition-all duration-75',
                        isSelected
                          ? 'border-primary/30 bg-primary/[0.08] text-primary ring-1 ring-primary/20'
                          : 'border-border bg-background text-text-secondary hover:bg-bg-hover'
                      )}
                      onClick={() => toggleRole(role.value)}
                    >
                      {isSelected && (
                        <span className='size-1.5 rounded-full bg-primary' />
                      )}
                      {role.label}
                    </button>
                  )
                })}
              </div>
              <p className='mt-1.5 text-[11px] text-text-quaternary'>
                Per-user assignment will be available when the backend is connected.
              </p>
            </div>

            {/* Preview */}
            {conditions.length > 0 && (
              <div>
                <label className='mb-1.5 block text-[12px] font-medium text-text-secondary'>
                  Preview
                </label>
                <div className='rounded-[8px] border border-border bg-foreground/[0.02] px-3 py-2.5'>
                  <div className='flex flex-wrap items-center gap-1.5 text-[12px]'>
                    <span className='text-text-tertiary'>Show {ENTITY_CONFIG[entity].label.toLowerCase()} where</span>
                    <span className='font-medium text-text-secondary'>{statusField.label}</span>
                    <span className='text-text-tertiary'>is</span>
                    {conditions.map((c, i) => (
                      <span key={c.id} className='inline-flex items-center gap-1'>
                        {i > 0 && <span className='text-text-quaternary'>or</span>}
                        <span className='rounded-[4px] bg-primary/[0.08] px-1.5 py-0.5 font-medium text-primary'>
                          {c.label}
                        </span>
                      </span>
                    ))}
                  </div>
                  {assignedTo.length > 0 && (
                    <div className='mt-1.5 flex flex-wrap items-center gap-1.5 text-[12px]'>
                      <span className='text-text-tertiary'>Visible to</span>
                      {assignedTo.map((a, i) => (
                        <span key={i} className='inline-flex items-center gap-1'>
                          {i > 0 && <span className='text-text-quaternary'>&</span>}
                          <span className='rounded-[4px] bg-foreground/[0.06] px-1.5 py-0.5 font-medium text-text-secondary'>
                            {a.type === 'role' ? USER_ROLE_LABELS[a.value] : a.userName}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className='flex items-center justify-end gap-2 border-t border-border px-5 py-3'>
          <button
            type='button'
            className='inline-flex h-8 items-center rounded-[6px] border border-border px-3 text-[13px] font-medium text-text-secondary transition-colors duration-75 hover:bg-bg-hover'
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            type='button'
            className='inline-flex h-8 items-center rounded-[6px] bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition-opacity duration-[80ms] hover:opacity-90 disabled:opacity-40'
            disabled={!name.trim() || conditions.length === 0}
            onClick={handleSubmit}
          >
            {isNew ? 'Create' : 'Save Changes'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
