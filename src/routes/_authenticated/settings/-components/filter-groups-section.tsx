import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Globe,
  Lock,
  Package,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import {
  FILTER_PRESET_QUERY_KEYS,
  getFilterPresetsQuery,
} from '@/api/filter-preset/query'
import type {
  CreateFilterPresetPayload,
  FilterConditionGroup,
  FilterConditionLeaf,
  FilterPreset,
  FilterPresetEntityType,
  FilterOp,
  UpdateFilterPresetPayload,
} from '@/api/filter-preset/schema'
import { isConditionGroup } from '@/api/filter-preset/schema'
import { filterPresetService } from '@/api/filter-preset/service'
import { getFieldTypesQuery } from '@/api/data/query'
import type { FieldTypesResponse } from '@/api/data/schema'
import { getFieldConfigQuery } from '@/api/field-config/query'
import type { FieldConfigEntry, FieldConfigResponse } from '@/api/field-config/schema'
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
import { CUSTOMER_TYPE_LABELS } from '@/constants/customer'
import { USER_ROLE_LABELS } from '@/constants/user'
import type { UserRole } from '@/constants/user'
import { getUsersQuery } from '@/api/user/query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { useProjectId } from '@/hooks/use-project-id'
import { cn } from '@/lib/utils'

// ── Constants ───────────────────────────────────────────────

const ENTITY_TYPES: FilterPresetEntityType[] = ['order', 'proposal', 'customer']

const ENTITY_META: Record<
  FilterPresetEntityType,
  { label: string; pluralLabel: string; icon: typeof Package; color: string }
> = {
  order: {
    label: 'Order',
    pluralLabel: 'Orders',
    icon: Package,
    color: 'text-amber-600 bg-amber-500/10 dark:text-amber-400',
  },
  proposal: {
    label: 'Proposal',
    pluralLabel: 'Proposals',
    icon: FileText,
    color: 'text-violet-600 bg-violet-500/10 dark:text-violet-400',
  },
  customer: {
    label: 'Customer',
    pluralLabel: 'Customers',
    icon: Users,
    color: 'text-blue-600 bg-blue-500/10 dark:text-blue-400',
  },
}

/** Known dropdown options for specific fields */
const KNOWN_OPTIONS: Record<string, Record<string, { value: string; label: string; className?: string; dotClass?: string }[]>> = {
  order: {
    status: Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({
      value,
      label,
      className: ORDER_STATUS_CLASS[value as OrderStatus],
      dotClass: { U: 'bg-amber-500', O: 'bg-blue-500', X: 'bg-emerald-500' }[value],
    })),
  },
  proposal: {
    status: Object.entries(PROPOSAL_STATUS_LABELS).map(([value, label]) => ({
      value,
      label,
      className: PROPOSAL_STATUS_CLASS[value as ProposalStatus],
      dotClass: { O: 'bg-blue-500', A: 'bg-green-500', L: 'bg-red-500', C: 'bg-slate-400', E: 'bg-amber-500', N: 'bg-violet-500', H: 'bg-slate-400' }[value],
    })),
  },
  customer: {
    in_level: Object.entries(CUSTOMER_TYPE_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  },
}

const FILTER_OPS: { value: FilterOp; label: string }[] = [
  { value: 'eq', label: 'equals' },
  { value: 'neq', label: 'not equals' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'startswith', label: 'starts with' },
  { value: 'in', label: 'in' },
  { value: 'gt', label: '>' },
  { value: 'gte', label: '>=' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '<=' },
  { value: 'is_empty', label: 'is empty' },
  { value: 'is_not_empty', label: 'is not empty' },
]

const NO_VALUE_OPS: FilterOp[] = ['is_empty', 'is_not_empty']

// ── Helpers ─────────────────────────────────────────────────

function getFieldLabel(field: string, entityType: FilterPresetEntityType, fieldConfig?: FieldConfigResponse | null): string {
  const entry = fieldConfig?.[entityType]?.find((e) => e.field === field)
  if (entry?.alias?.trim()) return entry.alias.trim()
  return field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const DYNAMIC_DATE_LABELS: Record<string, string> = {
  '$today': 'Today',
  '$tomorrow': 'Tomorrow',
}

function getValueLabel(field: string, value: string, entityType: FilterPresetEntityType): string {
  if (value in DYNAMIC_DATE_LABELS) return DYNAMIC_DATE_LABELS[value]
  const opts = KNOWN_OPTIONS[entityType]?.[field]
  if (opts) {
    const opt = opts.find((o) => o.value === value)
    if (opt) return opt.label
  }
  return value
}

function getOpLabel(op: FilterOp): string {
  return FILTER_OPS.find((o) => o.value === op)?.label ?? op
}

function getFieldType(field: string, entityType: string, fieldTypes?: FieldTypesResponse | null): string {
  return fieldTypes?.[entityType]?.[field] ?? 'string'
}

const BOOLEAN_OPS: FilterOp[] = ['eq', 'neq', 'is_empty', 'is_not_empty']
const NUMERIC_OPS: FilterOp[] = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'is_empty', 'is_not_empty']
const DATE_OPS: FilterOp[] = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'is_empty', 'is_not_empty']

function getOpsForType(type: string): { value: FilterOp; label: string }[] {
  switch (type) {
    case 'boolean': return FILTER_OPS.filter((o) => BOOLEAN_OPS.includes(o.value))
    case 'integer':
    case 'number': return FILTER_OPS.filter((o) => NUMERIC_OPS.includes(o.value))
    case 'date': return FILTER_OPS.filter((o) => DATE_OPS.includes(o.value))
    default: return FILTER_OPS
  }
}

function flattenLeaves(group: FilterConditionGroup): FilterConditionLeaf[] {
  const leaves: FilterConditionLeaf[] = []
  for (const c of group.conditions) {
    if (isConditionGroup(c)) leaves.push(...flattenLeaves(c))
    else leaves.push(c)
  }
  return leaves
}

// ── Condition row type for the builder ──────────────────────

interface ConditionRow {
  id: string
  field: string
  op: FilterOp
  value: string
}

// ── Main component ──────────────────────────────────────────

export const FilterGroupsSection = () => {
  const queryClient = useQueryClient()
  const [projectId] = useProjectId()
  const { data: presets, isLoading } = useQuery(getFilterPresetsQuery())
  const { data: fieldConfig } = useQuery(getFieldConfigQuery(projectId))
  const { data: fieldTypes } = useQuery(getFieldTypesQuery(projectId))
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [editingPreset, setEditingPreset] = useState<FilterPreset | 'create' | null>(null)

  const deleteMutation = useMutation({
    mutationFn: (id: number) => filterPresetService.delete(id),
    meta: {
      successMessage: 'Filter preset deleted',
      errorMessage: 'Failed to delete filter preset',
      invalidatesQuery: FILTER_PRESET_QUERY_KEYS.all(),
    },
  })

  const entityGroups = ENTITY_TYPES.map((entityType) => ({
    entityType,
    config: ENTITY_META[entityType],
    presets: (presets ?? []).filter((p) => p.entity_type === entityType),
  }))

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='flex-1 overflow-y-scroll'>
        <div className='mx-auto max-w-[680px] px-8 py-6'>
          {/* Description */}
          <div className='mb-6'>
            <h2 className='text-[14px] font-semibold text-foreground'>Filter Presets</h2>
            <p className='mt-1 text-[13px] leading-relaxed text-text-tertiary'>
              Create saved filter combinations for orders, proposals, and customers.
              Shared presets are visible to all project users.
            </p>
          </div>

          {/* Add button */}
          <div className='mb-4'>
            <button
              type='button'
              className='inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-[6px] border border-dashed border-border text-[13px] font-medium text-text-secondary transition-colors duration-75 hover:border-primary/30 hover:bg-primary/[0.04] hover:text-primary'
              onClick={() => setEditingPreset('create')}
            >
              <Plus className='size-3.5' />
              New Filter Preset
            </button>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className='space-y-4'>
              {[1, 2, 3].map((i) => (
                <div key={i} className='rounded-[8px] border border-border p-3'>
                  <div className='flex items-center gap-3'>
                    <Skeleton className='size-5 rounded-[4px]' />
                    <Skeleton className='h-4 w-32 rounded' />
                    <div className='flex-1' />
                    <Skeleton className='h-5 w-16 rounded-full' />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Grouped by entity */}
          {!isLoading &&
            entityGroups.map(({ entityType, config, presets: entityPresets }) => {
              const Icon = config.icon
              return (
                <div key={entityType} className='mb-5'>
                  <div className='mb-2 flex items-center gap-2'>
                    <div className={cn('flex size-5 items-center justify-center rounded-[4px]', config.color)}>
                      <Icon className='size-3' />
                    </div>
                    <span className='text-[12px] font-semibold uppercase tracking-[0.05em] text-text-tertiary'>
                      {config.pluralLabel}
                    </span>
                    <span className='text-[11px] tabular-nums text-text-quaternary'>
                      {entityPresets.length}
                    </span>
                  </div>

                  {entityPresets.length === 0 ? (
                    <div className='rounded-[8px] border border-dashed border-border px-4 py-5 text-center text-[13px] text-text-quaternary'>
                      No filter presets for {config.pluralLabel.toLowerCase()}
                    </div>
                  ) : (
                    <div className='overflow-hidden rounded-[8px] border border-border'>
                      {entityPresets.map((preset, i) => {
                        const isExpanded = expandedId === preset.id
                        const leaves = flattenLeaves(preset.conditions)
                        return (
                          <div
                            key={preset.id}
                            className={cn(i < entityPresets.length - 1 && 'border-b border-border-light')}
                          >
                            {/* Row header */}
                            <div
                              className='flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors duration-75 hover:bg-bg-hover/40'
                              onClick={() => setExpandedId(isExpanded ? null : preset.id)}
                            >
                              {isExpanded ? (
                                <ChevronDown className='size-3.5 shrink-0 text-text-tertiary' />
                              ) : (
                                <ChevronRight className='size-3.5 shrink-0 text-text-tertiary' />
                              )}
                              <span className='min-w-0 flex-1 truncate text-[13px] font-medium text-foreground'>
                                {preset.name}
                              </span>

                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[11px] font-medium',
                                  preset.shared
                                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                    : (preset.visible_to_roles?.length > 0 || preset.visible_to_users?.length > 0)
                                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                      : 'bg-foreground/[0.06] text-text-tertiary'
                                )}
                              >
                                {preset.shared ? (
                                  <><Globe className='size-2.5' /> Shared</>
                                ) : (preset.visible_to_roles?.length > 0 || preset.visible_to_users?.length > 0) ? (
                                  <><Users className='size-2.5' /> Limited</>
                                ) : (
                                  <><Lock className='size-2.5' /> Private</>
                                )}
                              </span>

                              <span className='shrink-0 rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[11px] font-medium tabular-nums text-text-tertiary'>
                                {leaves.length} rule{leaves.length !== 1 ? 's' : ''}
                              </span>

                              <div className='flex items-center gap-0.5'>
                                <button
                                  type='button'
                                  className='inline-flex size-6 items-center justify-center rounded-[5px] text-text-quaternary transition-colors duration-75 hover:bg-bg-active hover:text-foreground'
                                  onClick={(e) => { e.stopPropagation(); setEditingPreset(preset) }}
                                >
                                  <Pencil className='size-3' />
                                </button>
                                <button
                                  type='button'
                                  className='inline-flex size-6 items-center justify-center rounded-[5px] text-text-quaternary transition-colors duration-75 hover:bg-destructive/10 hover:text-destructive disabled:opacity-40'
                                  disabled={deleteMutation.isPending}
                                  onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(preset.id) }}
                                >
                                  {deleteMutation.isPending && deleteMutation.variables === preset.id
                                    ? <Spinner className='size-3' />
                                    : <Trash2 className='size-3' />}
                                </button>
                              </div>
                            </div>

                            {/* Expanded detail */}
                            {isExpanded && (
                              <div className='border-t border-border-light bg-foreground/[0.015] px-4 py-3'>
                                <span className='text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary'>
                                  Conditions
                                </span>
                                <div className='mt-1.5 flex flex-wrap gap-1.5'>
                                  {leaves.map((cond, ci) => (
                                    <span
                                      key={ci}
                                      className='inline-flex items-center gap-1.5 rounded-[5px] border border-border bg-background px-2 py-1 text-[12px]'
                                    >
                                      <span className='font-medium text-text-secondary'>
                                        {getFieldLabel(cond.field, entityType, fieldConfig)}
                                      </span>
                                      <span className='text-text-quaternary'>{getOpLabel(cond.op)}</span>
                                      {!NO_VALUE_OPS.includes(cond.op) && (
                                        <span className='font-medium text-foreground'>
                                          {getValueLabel(cond.field, String(cond.value), entityType)}
                                        </span>
                                      )}
                                    </span>
                                  ))}
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
      {editingPreset !== null && (
        <FilterPresetDialog
          preset={editingPreset === 'create' ? null : editingPreset}
          fieldConfig={fieldConfig}
          fieldTypes={fieldTypes}
          open
          onOpenChange={(open) => !open && setEditingPreset(null)}
          onSaved={() => {
            setEditingPreset(null)
            queryClient.invalidateQueries({ queryKey: FILTER_PRESET_QUERY_KEYS.all() })
          }}
        />
      )}
    </div>
  )
}

// ── Create/Edit Dialog ──────────────────────────────────────

function FilterPresetDialog({
  preset,
  fieldConfig,
  fieldTypes,
  open,
  onOpenChange,
  onSaved,
}: {
  preset: FilterPreset | null
  fieldConfig: FieldConfigResponse | null | undefined
  fieldTypes: FieldTypesResponse | null | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const isNew = !preset

  const [name, setName] = useState(preset?.name ?? '')
  const [entityType, setEntityType] = useState<FilterPresetEntityType>(preset?.entity_type ?? 'order')
  const [shared, setShared] = useState(preset?.shared ?? false)
  const [visibleToRoles, setVisibleToRoles] = useState<string[]>(preset?.visible_to_roles ?? [])
  const [visibleToUsers, setVisibleToUsers] = useState<number[]>(preset?.visible_to_users ?? [])

  const { data: usersData } = useQuery(getUsersQuery({ limit: 500 }))
  const users = usersData?.results ?? []

  // Build initial condition rows from preset
  const initialRows: ConditionRow[] = preset
    ? flattenLeaves(preset.conditions).map((c, i) => ({
        id: `r-${i}`,
        field: c.field,
        op: c.op,
        value: NO_VALUE_OPS.includes(c.op) ? '' : String(c.value),
      }))
    : []

  const [rows, setRows] = useState<ConditionRow[]>(initialRows)

  // Get available fields for current entity — include fields from existing rows
  // so that preset conditions with fields not in field-config still display
  const configFields: FieldConfigEntry[] = fieldConfig?.[entityType]?.filter((e) => e.enabled) ?? []
  const configFieldSet = new Set(configFields.map((f) => f.field))
  const extraFields: FieldConfigEntry[] = rows
    .filter((r) => r.field && !configFieldSet.has(r.field))
    .reduce<FieldConfigEntry[]>((acc, r) => {
      if (!acc.some((f) => f.field === r.field)) {
        acc.push({ field: r.field, alias: null, default: false, enabled: true })
      }
      return acc
    }, [])
  const entityFields = [...configFields, ...extraFields]

  // Reset rows when entity type changes (only for new presets)
  useEffect(() => {
    if (isNew) setRows([])
  }, [entityType, isNew])

  const addRow = () => {
    const firstField = entityFields[0]?.field ?? 'status'
    setRows((prev) => [
      ...prev,
      { id: `r-${Date.now()}`, field: firstField, op: 'eq', value: '' },
    ])
  }

  const updateRow = (id: string, updates: Partial<ConditionRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)))
  }

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  const buildConditions = (): FilterConditionGroup => {
    const leaves: FilterConditionLeaf[] = rows
      .filter((r) => r.field && (NO_VALUE_OPS.includes(r.op) || r.value.trim()))
      .map((r) => ({
        field: r.field,
        op: r.op,
        value: NO_VALUE_OPS.includes(r.op) ? '' : r.value.trim(),
      }))

    // Group by field — same-field conditions get OR'd
    const byField = new Map<string, FilterConditionLeaf[]>()
    for (const leaf of leaves) {
      const existing = byField.get(leaf.field) ?? []
      existing.push(leaf)
      byField.set(leaf.field, existing)
    }

    const topConditions: (FilterConditionLeaf | FilterConditionGroup)[] = []
    for (const [, fieldLeaves] of byField) {
      if (fieldLeaves.length === 1) {
        topConditions.push(fieldLeaves[0])
      } else {
        topConditions.push({ operator: 'or', conditions: fieldLeaves })
      }
    }

    return { operator: 'and', conditions: topConditions }
  }

  const createMutation = useMutation({
    mutationFn: (payload: CreateFilterPresetPayload) => filterPresetService.create(payload),
    meta: { successMessage: 'Filter preset created', errorMessage: 'Failed to create filter preset' },
    onSuccess: () => onSaved(),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateFilterPresetPayload }) =>
      filterPresetService.update(id, payload),
    meta: { successMessage: 'Filter preset updated', errorMessage: 'Failed to update filter preset' },
    onSuccess: () => onSaved(),
  })

  const isPending = createMutation.isPending || updateMutation.isPending
  const validRows = rows.filter((r) => r.field && (NO_VALUE_OPS.includes(r.op) || r.value.trim()))

  const handleSubmit = () => {
    if (!name.trim() || validRows.length === 0) return
    const conditions = buildConditions()
    const visibility = {
      shared,
      visible_to_roles: shared ? [] : visibleToRoles,
      visible_to_users: shared ? [] : visibleToUsers,
    }
    if (isNew) {
      createMutation.mutate({ entity_type: entityType, name: name.trim(), conditions, ...visibility })
    } else {
      updateMutation.mutate({ id: preset.id, payload: { entity_type: entityType, name: name.trim(), conditions, ...visibility } })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[560px]'>
        <DialogHeader className='border-b border-border px-5 py-3'>
          <DialogTitle className='text-[14px]'>
            {isNew ? 'New Filter Preset' : 'Edit Filter Preset'}
          </DialogTitle>
        </DialogHeader>

        <div className='min-h-0 flex-1 overflow-y-auto'>
          <div className='space-y-5 px-5 py-4'>
            {/* Name */}
            <div>
              <label className='mb-1.5 block text-[12px] font-medium text-text-secondary'>Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g. Open Orders (AARON)'
              />
            </div>

            {/* Entity selector */}
            {isNew && (
              <div>
                <label className='mb-1.5 block text-[12px] font-medium text-text-secondary'>Entity</label>
                <div className='flex gap-1.5'>
                  {ENTITY_TYPES.map((e) => {
                    const cfg = ENTITY_META[e]
                    const Icon = cfg.icon
                    return (
                      <button
                        key={e}
                        type='button'
                        className={cn(
                          'inline-flex h-8 items-center gap-1.5 rounded-[6px] border px-3 text-[13px] font-medium transition-colors duration-75',
                          entityType === e
                            ? 'border-primary/30 bg-primary/[0.08] text-primary'
                            : 'border-border bg-background text-text-secondary hover:bg-bg-hover'
                        )}
                        onClick={() => setEntityType(e)}
                      >
                        <Icon className='size-3.5' />
                        {cfg.pluralLabel}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Conditions */}
            <div>
              <label className='mb-1.5 block text-[12px] font-medium text-text-secondary'>Conditions</label>
              <div className='space-y-2'>
                {rows.map((row, i) => {
                  const knownOpts = KNOWN_OPTIONS[entityType]?.[row.field]
                  const fType = getFieldType(row.field, entityType, fieldTypes)
                  const availableOps = knownOpts ? FILTER_OPS : getOpsForType(fType)
                  const hasValue = !NO_VALUE_OPS.includes(row.op)
                  return (
                    <div key={row.id} className='flex items-center gap-1.5'>
                      {i > 0 && (
                        <span className='w-[32px] shrink-0 text-center text-[11px] font-medium text-text-quaternary'>
                          AND
                        </span>
                      )}
                      {i === 0 && rows.length > 1 && <div className='w-[32px] shrink-0' />}

                      {/* Field */}
                      <Select
                        value={row.field}
                        onValueChange={(v) => {
                          const newType = getFieldType(v, entityType, fieldTypes)
                          updateRow(row.id, {
                            field: v,
                            value: newType === 'boolean' ? 'true' : '',
                            op: newType === 'boolean' ? 'eq' : row.op,
                          })
                        }}
                      >
                        <SelectTrigger size='sm' className='w-[130px] shrink-0'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {entityFields.map((f) => (
                            <SelectItem key={f.field} value={f.field}>
                              {f.alias?.trim() || f.field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Operator */}
                      <Select
                        value={row.op}
                        onValueChange={(v) => updateRow(row.id, { op: v as FilterOp })}
                      >
                        <SelectTrigger size='sm' className='w-[110px] shrink-0'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableOps.map((op) => (
                            <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Value — type-aware */}
                      {hasValue && (
                        knownOpts ? (
                          <Select
                            value={row.value || undefined}
                            onValueChange={(v) => updateRow(row.id, { value: v })}
                          >
                            <SelectTrigger size='sm' className='min-w-0 flex-1'>
                              <SelectValue placeholder='Select...' />
                            </SelectTrigger>
                            <SelectContent>
                              {knownOpts.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  <span className='flex items-center gap-2'>
                                    {opt.dotClass && <span className={cn('size-2 shrink-0 rounded-full', opt.dotClass)} />}
                                    {opt.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : fType === 'boolean' ? (
                          <button
                            type='button'
                            className={cn(
                              'relative inline-flex h-7 w-[52px] shrink-0 items-center rounded-full border transition-colors duration-200',
                              row.value === 'true'
                                ? 'border-emerald-300 bg-emerald-500 dark:border-emerald-600'
                                : 'border-border bg-bg-active',
                            )}
                            onClick={() => updateRow(row.id, { value: row.value === 'true' ? 'false' : 'true' })}
                          >
                            <span
                              className={cn(
                                'inline-block size-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                                row.value === 'true' ? 'translate-x-[27px]' : 'translate-x-[3px]',
                              )}
                            />
                          </button>
                        ) : fType === 'integer' || fType === 'number' ? (
                          <Input
                            type='number'
                            value={row.value}
                            onChange={(e) => updateRow(row.id, { value: e.target.value })}
                            placeholder='0'
                            step={fType === 'integer' ? '1' : 'any'}
                            className='h-7 w-[100px] shrink-0 text-[13px] tabular-nums'
                          />
                        ) : fType === 'date' ? (
                          <div className='flex min-w-0 flex-1 items-center gap-1.5'>
                            {row.value === '$today' || row.value === '$tomorrow' ? (
                              <button
                                type='button'
                                className='flex h-7 items-center gap-1.5 rounded-[6px] border border-primary/30 bg-primary/5 px-2.5 text-[12px] font-medium text-primary'
                                onClick={() => updateRow(row.id, { value: '' })}
                              >
                                {row.value === '$today' ? 'Today' : 'Tomorrow'}
                                <X className='size-3' />
                              </button>
                            ) : (
                              <DatePicker
                                value={row.value ? new Date(row.value) : undefined}
                                onChange={(d) => updateRow(row.id, { value: d ? d.toISOString().split('T')[0] : '' })}
                                placeholder='Pick date...'
                                className='h-7 min-w-0 flex-1 text-[13px]'
                              />
                            )}
                            <button
                              type='button'
                              className={cn(
                                'h-7 shrink-0 rounded-[5px] border px-2 text-[11px] font-medium transition-colors',
                                row.value === '$today'
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-border text-text-tertiary hover:border-primary/50 hover:text-primary',
                              )}
                              onClick={() => updateRow(row.id, { value: row.value === '$today' ? '' : '$today' })}
                            >
                              Today
                            </button>
                            <button
                              type='button'
                              className={cn(
                                'h-7 shrink-0 rounded-[5px] border px-2 text-[11px] font-medium transition-colors',
                                row.value === '$tomorrow'
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-border text-text-tertiary hover:border-primary/50 hover:text-primary',
                              )}
                              onClick={() => updateRow(row.id, { value: row.value === '$tomorrow' ? '' : '$tomorrow' })}
                            >
                              Tmrw
                            </button>
                          </div>
                        ) : (
                          <Input
                            value={row.value}
                            onChange={(e) => updateRow(row.id, { value: e.target.value })}
                            placeholder='Value...'
                            className='h-7 min-w-0 flex-1 text-[13px]'
                          />
                        )
                      )}

                      {/* Remove */}
                      <button
                        type='button'
                        className='inline-flex size-6 shrink-0 items-center justify-center rounded-[5px] text-text-quaternary transition-colors duration-75 hover:bg-destructive/10 hover:text-destructive'
                        onClick={() => removeRow(row.id)}
                      >
                        <X className='size-3' />
                      </button>
                    </div>
                  )
                })}

                <button
                  type='button'
                  className='inline-flex h-7 items-center gap-1 rounded-[5px] border border-dashed border-border px-2 text-[12px] font-medium text-text-secondary transition-colors duration-75 hover:border-primary/30 hover:text-primary'
                  onClick={addRow}
                >
                  <Plus className='size-3' />
                  Add condition
                </button>
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label className='mb-1.5 block text-[12px] font-medium text-text-secondary'>Visibility</label>
              <p className='mb-3 text-[11px] text-text-quaternary'>
                Options can be combined. Leave all empty for creator-only.
              </p>

              <div className='space-y-3'>
                {/* Shared toggle */}
                <div className='flex items-center justify-between'>
                  <span className='text-[13px] text-text-secondary'>Shared with everyone</span>
                  <button
                    type='button'
                    className={cn(
                      'relative inline-flex h-[18px] w-[30px] shrink-0 items-center rounded-full transition-colors duration-150',
                      shared ? 'bg-primary' : 'bg-foreground/15'
                    )}
                    onClick={() => setShared((v) => !v)}
                  >
                    <span
                      className={cn(
                        'inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform duration-150',
                        shared ? 'translate-x-[14px]' : 'translate-x-[2px]'
                      )}
                    />
                  </button>
                </div>

                {/* Visible to roles */}
                {!shared && (
                  <div>
                    <span className='mb-1 block text-[12px] text-text-tertiary'>Visible to roles</span>
                    <div className='flex flex-wrap gap-1'>
                      {(Object.entries(USER_ROLE_LABELS) as [UserRole, string][]).map(([role, label]) => {
                        const selected = visibleToRoles.includes(role)
                        return (
                          <button
                            key={role}
                            type='button'
                            className={cn(
                              'inline-flex h-6 items-center rounded-[5px] border px-2 text-[12px] font-medium transition-colors duration-75',
                              selected
                                ? 'border-primary/30 bg-primary/[0.08] text-primary'
                                : 'border-border bg-background text-text-tertiary hover:text-text-secondary'
                            )}
                            onClick={() => {
                              setVisibleToRoles((prev) =>
                                selected ? prev.filter((r) => r !== role) : [...prev, role]
                              )
                            }}
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Visible to users */}
                {!shared && (
                  <div>
                    <span className='mb-1 block text-[12px] text-text-tertiary'>Visible to users</span>
                    <div className='flex flex-wrap gap-1'>
                      {users.map((u) => {
                        const selected = visibleToUsers.includes(u.id)
                        const displayName = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email
                        return (
                          <button
                            key={u.id}
                            type='button'
                            className={cn(
                              'inline-flex h-6 items-center rounded-[5px] border px-2 text-[12px] font-medium transition-colors duration-75',
                              selected
                                ? 'border-primary/30 bg-primary/[0.08] text-primary'
                                : 'border-border bg-background text-text-tertiary hover:text-text-secondary'
                            )}
                            onClick={() => {
                              setVisibleToUsers((prev) =>
                                selected ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                              )
                            }}
                          >
                            {displayName}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Preview */}
            {validRows.length > 0 && (
              <div>
                <label className='mb-1.5 block text-[12px] font-medium text-text-secondary'>Preview</label>
                <div className='rounded-[8px] border border-border bg-foreground/[0.02] px-3 py-2.5'>
                  <div className='flex flex-wrap items-center gap-1.5 text-[12px]'>
                    <span className='text-text-tertiary'>
                      Show {ENTITY_META[entityType].pluralLabel.toLowerCase()} where
                    </span>
                    {validRows.map((row, i) => (
                      <span key={row.id} className='inline-flex items-center gap-1'>
                        {i > 0 && <span className='text-text-quaternary'>and</span>}
                        <span className='font-medium text-text-secondary'>
                          {getFieldLabel(row.field, entityType, fieldConfig)}
                        </span>
                        <span className='text-text-quaternary'>{getOpLabel(row.op)}</span>
                        {!NO_VALUE_OPS.includes(row.op) && (
                          <span className='rounded-[4px] bg-primary/[0.08] px-1.5 py-0.5 font-medium text-primary'>
                            {getValueLabel(row.field, row.value, entityType)}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
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
            className='inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition-opacity duration-[80ms] hover:opacity-90 disabled:opacity-40'
            disabled={!name.trim() || validRows.length === 0 || isPending}
            onClick={handleSubmit}
          >
            {isPending && <Spinner className='size-3' />}
            {isNew ? 'Create' : 'Save Changes'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
