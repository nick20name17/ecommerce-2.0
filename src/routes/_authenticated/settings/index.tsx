import { defaultPreset } from '@dnd-kit/dom'
import { OptimisticSortingPlugin, SortableKeyboardPlugin } from '@dnd-kit/dom/sortable'
import { DragDropProvider } from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import {
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  TriangleAlert,
} from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useDebouncedCallback } from 'use-debounce'

import { PageEmpty } from '@/components/common/page-empty'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { FieldsDataTable } from './-components/fields-data-table'
import { FilterGroupsSection } from './-components/filter-groups-section'
import { ShippingAddressModal } from './-components/shipping-address-modal'
import { SHIPPING_ADDRESS_QUERY_KEYS, getShippingAddressesQuery } from '@/api/shipping-address/query'
import type { ShippingAddress } from '@/api/shipping-address/schema'
import { shippingAddressService } from '@/api/shipping-address/service'
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
import { CUSTOMER_QUERY_KEYS } from '@/api/customer/query'
import { FIELD_CONFIG_QUERY_KEYS, getFieldConfigQuery } from '@/api/field-config/query'
import type { FieldConfigResponse, FieldConfigRow } from '@/api/field-config/schema'
import { fieldConfigService } from '@/api/field-config/service'
import { ORDER_QUERY_KEYS } from '@/api/order/query'
import { PROPOSAL_QUERY_KEYS } from '@/api/proposal/query'
import { TASK_QUERY_KEYS, getTaskStatusesQuery } from '@/api/task/query'
import type { TaskStatus } from '@/api/task/schema'
import { taskService } from '@/api/task/service'
import { USER_QUERY_KEYS, getUsersQuery } from '@/api/user/query'
import type { User, UserParams } from '@/api/user/schema'
import { userService } from '@/api/user/service'
import { ColorPicker } from '@/components/ui/color-picker'
import { ISettings, InitialsAvatar, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import { RoleBadge } from '@/components/common/role-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { isAdmin, isSuperAdmin } from '@/constants/user'
import type { UserRole } from '@/constants/user'
import { getSession } from '@/helpers/auth'
import { useProjectId } from '@/hooks/use-project-id'
import { cn } from '@/lib/utils'
import { useAuth } from '@/providers/auth'
import { UserDeleteDialog } from '../users/-components/user-delete-dialog'
import { UserModal } from '../users/-components/user-modal'

// ── Section definitions ─────────────────────────────────────

type SettingsSection = 'data-control' | 'filters' | 'tasks' | 'shipping' | 'users'

const SECTIONS: { value: SettingsSection; label: string }[] = [
  { value: 'data-control', label: 'Data Control' },
  { value: 'filters', label: 'Filters' },
  { value: 'tasks', label: 'Statuses' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'users', label: 'Users' },
]

// ── Field config helpers ────────────────────────────────────

const TABLE_LABELS: Record<string, string> = {
  customer: 'Customers',
  product: 'Products',
  order: 'Orders',
  order_item: 'Order Items',
  order_detail: 'Order Items',
  default_component: 'Default Components',
  component: 'Components',
  shipper: 'Shippers',
  ship_info: 'Ship Info',
  proposal: 'Proposals',
  proposal_item: 'Proposal Items'
}

const getTableLabel = (name: string): string =>
  TABLE_LABELS[name] ?? name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ')

const getQueryKeyToInvalidate = (entity: string): readonly unknown[] | undefined => {
  switch (entity) {
    case 'customer':
      return CUSTOMER_QUERY_KEYS.all()
    case 'order':
    case 'order_item':
    case 'order_detail':
      return ORDER_QUERY_KEYS.all()
    case 'proposal':
    case 'proposal_item':
      return PROPOSAL_QUERY_KEYS.all()
    default:
      return undefined
  }
}

const applyFieldToggle = (
  prev: FieldConfigResponse | undefined,
  entity: string,
  fieldName: string,
  enabled: boolean
): FieldConfigResponse | undefined => {
  if (!prev?.[entity]) return prev
  return {
    ...prev,
    [entity]: prev[entity].map((entry) =>
      entry.field === fieldName ? { ...entry, enabled } : entry
    )
  }
}

const applyEditableToggle = (
  prev: FieldConfigResponse | undefined,
  entity: string,
  fieldName: string,
  editable: boolean
): FieldConfigResponse | undefined => {
  if (!prev?.[entity]) return prev
  return {
    ...prev,
    [entity]: prev[entity].map((entry) =>
      entry.field === fieldName ? { ...entry, editable } : entry
    )
  }
}

// ── Main component ──────────────────────────────────────────

const SettingsPage = () => {
  const [projectId] = useProjectId()
  const [section, setSection] = useQueryState('section', parseAsString)

  const currentSection = (section ?? 'data-control') as SettingsSection

  if (!projectId) {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-5'>
        <div className='flex size-12 items-center justify-center rounded-[12px] bg-primary/[0.08] text-primary dark:bg-primary/15'>
          <ISettings className='size-6' />
        </div>
        <div className='flex flex-col items-center gap-1.5 text-center'>
          <h1 className='text-[16px] font-semibold tracking-[-0.02em] text-foreground'>Settings</h1>
          <p className='max-w-[280px] text-[13px] leading-snug text-text-tertiary'>Select a project in the sidebar to manage settings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* ── Header bar ── */}
      <header className='flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-6'>
        <SidebarTrigger className='-ml-1' />
        <PageHeaderIcon icon={ISettings} color={PAGE_COLORS.settings} />
        <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>Settings</h1>
      </header>

      {/* Sidebar + Content */}
      <div className='flex min-h-0 flex-1 overflow-hidden'>
        {/* Vertical sidebar tabs */}
        <nav className='flex w-[180px] shrink-0 flex-col gap-px border-r border-border bg-bg-secondary/40 px-3 py-3'>
          {SECTIONS.map((s) => {
            const isActive = currentSection === s.value
            return (
              <button
                key={s.value}
                type='button'
                className={cn(
                  'flex h-[30px] items-center rounded-[6px] px-2.5 text-[13px] font-medium transition-colors duration-[80ms]',
                  isActive
                    ? 'bg-bg-active text-foreground'
                    : 'text-text-tertiary hover:bg-bg-hover hover:text-foreground'
                )}
                onClick={() => setSection(s.value === 'data-control' ? null : s.value)}
              >
                {s.label}
              </button>
            )
          })}
        </nav>

        {/* Content */}
        <div className='flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'>
          {currentSection === 'data-control' && <DataControlSection projectId={projectId} />}
          {currentSection === 'filters' && <FilterGroupsSection />}
          {currentSection === 'tasks' && <TasksSection projectId={projectId} />}
          {currentSection === 'shipping' && <ShippingSection projectId={projectId} />}
          {currentSection === 'users' && <UsersSection />}
        </div>
      </div>
    </div>
  )
}

// ── Data Control Section ────────────────────────────────────

const DataControlSection = ({ projectId }: { projectId: number }) => {
  const [activeTab, setActiveTab] = useQueryState('tab', parseAsString)
  const client = useQueryClient()
  const { user } = useAuth()
  const userIsSuperAdmin = !!user?.role && isSuperAdmin(user.role)

  const { data, isLoading } = useQuery({
    ...getFieldConfigQuery(projectId),
    placeholderData: keepPreviousData
  })

  const patchMutation = useMutation({
    mutationFn: ({
      payload
    }: {
      payload: Record<string, string[]>
      entity: string
      fieldName: string
      enabled: boolean
    }) => fieldConfigService.patchFieldConfig(projectId, payload),
    onMutate: async ({ entity, fieldName, enabled }) => {
      const key = FIELD_CONFIG_QUERY_KEYS.fieldConfig(projectId)
      await client.cancelQueries({ queryKey: key })
      const prev = client.getQueryData<FieldConfigResponse>(key)
      const next = applyFieldToggle(prev, entity, fieldName, enabled)
      if (next) client.setQueryData(key, next)
      return { prev }
    },
    onError: (_err, _variables, context) => {
      if (context?.prev)
        client.setQueryData(FIELD_CONFIG_QUERY_KEYS.fieldConfig(projectId), context.prev)
    },
    onSuccess: (_data, variables) => {
      const queryKey = getQueryKeyToInvalidate(variables.entity)
      if (queryKey) client.invalidateQueries({ queryKey })
    },
    meta: {
      invalidatesQuery: FIELD_CONFIG_QUERY_KEYS.fieldConfig(projectId),
      successMessage: 'Field configuration updated'
    }
  })

  const entities = useMemo(() => Object.keys(data ?? {}), [data])
  const currentTab = activeTab ?? entities[0] ?? ''

  const fields: FieldConfigRow[] = useMemo(() => {
    const entityFields = data?.[currentTab]
    if (!entityFields) return []
    return entityFields.map((entry) => ({
      field: entry.field,
      alias: entry.alias,
      default: entry.default,
      enabled: entry.enabled,
      editable: entry.editable,
      entity: currentTab
    }))
  }, [data, currentTab])

  const editableMutation = useMutation({
    mutationFn: ({
      payload
    }: {
      payload: Record<string, unknown>
      entity: string
      fieldName: string
      editable: boolean
    }) => fieldConfigService.patchFieldConfig(projectId, payload as unknown as Record<string, string[]>),
    onMutate: async ({ entity, fieldName, editable }) => {
      const key = FIELD_CONFIG_QUERY_KEYS.fieldConfig(projectId)
      await client.cancelQueries({ queryKey: key })
      const prev = client.getQueryData<FieldConfigResponse>(key)
      const next = applyEditableToggle(prev, entity, fieldName, editable)
      if (next) client.setQueryData(key, next)
      return { prev }
    },
    onError: (_err, _variables, context) => {
      if (context?.prev)
        client.setQueryData(FIELD_CONFIG_QUERY_KEYS.fieldConfig(projectId), context.prev)
    },
    meta: {
      invalidatesQuery: FIELD_CONFIG_QUERY_KEYS.fieldConfig(projectId),
      successMessage: 'Editable fields updated'
    }
  })

  const handleEditableToggle = (entity: string, fieldName: string, editable: boolean) => {
    if (!data?.[entity]) return
    const entityFields = data[entity]
    const newEditable = entityFields
      .filter((e) => (e.field === fieldName ? editable : !!e.editable))
      .map((e) => e.field)
    editableMutation.mutate({
      payload: { _editable: { [entity]: newEditable } },
      entity,
      fieldName,
      editable
    })
  }

  const handleAliasSubmit = (entity: string, fieldName: string, alias: string) => {
    patchMutation.mutate({
      payload: { _aliases: { [entity]: { [fieldName]: alias } } } as unknown as Record<string, string[]>,
      entity,
      fieldName,
      enabled: true
    })
  }

  const handleFieldToggle = (entity: string, fieldName: string, enabled: boolean) => {
    if (!data?.[entity]) return
    const entityFields = data[entity]
    const nonDefaultFields = entityFields.filter((e) => !e.default)
    const newEnabled = nonDefaultFields
      .filter((e) => (e.field === fieldName ? enabled : e.enabled))
      .map((e) => e.field)
    patchMutation.mutate({
      payload: { [entity]: newEnabled },
      entity,
      fieldName,
      enabled
    })
  }

  const showTabSkeleton = isLoading && !data

  return (
    <Tabs
      value={currentTab}
      onValueChange={setActiveTab}
      className='flex min-h-0 flex-1 flex-col'
    >
      <div className='shrink-0 border-b border-border px-6'>
        <TabsList variant='line' className='flex-wrap'>
          {showTabSkeleton
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className='h-4 w-20 rounded' />
              ))
            : entities.map((entity) => (
                <TabsTrigger key={entity} value={entity}>
                  {getTableLabel(entity)}
                </TabsTrigger>
              ))}
        </TabsList>
      </div>

      <div className='min-h-0 flex-1 overflow-auto'>
        {showTabSkeleton ? (
          <FieldsDataTable
            fields={[]}
            isLoading
            entity={currentTab}
            projectId={projectId}
            onFieldToggle={handleFieldToggle}
            onAliasSubmit={handleAliasSubmit}
            onEditableToggle={handleEditableToggle}
            isPending={patchMutation.isPending}
            isAliasPending={patchMutation.isPending}
            isEditablePending={editableMutation.isPending}
            isSuperAdmin={userIsSuperAdmin}
          />
        ) : entities.length === 0 ? (
          <PageEmpty icon={TriangleAlert} title='No field configuration' description='No field configuration is available for this project.' />
        ) : (
          entities.map((entity) => (
            <TabsContent key={entity} value={entity}>
              <FieldsDataTable
                fields={entity === currentTab ? fields : []}
                isLoading={isLoading}
                entity={entity}
                projectId={projectId}
                onFieldToggle={handleFieldToggle}
                onAliasSubmit={handleAliasSubmit}
                onEditableToggle={handleEditableToggle}
                isPending={patchMutation.isPending}
                isAliasPending={patchMutation.isPending}
                isEditablePending={editableMutation.isPending}
                isSuperAdmin={userIsSuperAdmin}
              />
            </TabsContent>
          ))
        )}
      </div>
    </Tabs>
  )
}

// ── Tasks Section ───────────────────────────────────────────

const SORTABLE_PLUGINS = [...defaultPreset.plugins, OptimisticSortingPlugin, SortableKeyboardPlugin]

const arrayMove = <T,>(array: T[], from: number, to: number): T[] => {
  const next = array.slice()
  next.splice(to, 0, next.splice(from, 1)[0]!)
  return next
}

const defaultStatusColorHex = '#6B7280'

const TasksSection = ({ projectId }: { projectId: number }) => {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery(getTaskStatusesQuery(projectId))
  const statuses = data?.results ?? []

  const [orderedStatuses, setOrderedStatuses] = useState<TaskStatus[]>([])
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(defaultStatusColorHex)
  const [deleteTarget, setDeleteTarget] = useState<TaskStatus | null>(null)

  const statusKey = statuses.map((s) => `${s.id}:${s.name}:${s.color}`).join(',')
  useEffect(() => {
    setOrderedStatuses([...statuses].sort((a, b) => a.order - b.order))
  }, [statusKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const reorderMutation = useMutation({
    mutationFn: ({ id, order }: { id: number; order: number }) =>
      taskService.updateStatus(id, { order })
  })

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; color: string }) =>
      taskService.createStatus({
        ...payload,
        project: projectId,
        order: orderedStatuses.length + 1
      }),
    meta: { invalidatesQuery: TASK_QUERY_KEYS.statuses(projectId) }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => taskService.deleteStatus(id),
    onSuccess: (_, id) => {
      setOrderedStatuses((prev) => prev.filter((s) => s.id !== id))
      setDeleteTarget(null)
    },
    meta: { invalidatesQuery: TASK_QUERY_KEYS.statuses(projectId) }
  })

  const handleAddStatus = () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    createMutation.mutate({ name: trimmed, color: newColor })
    setNewName('')
    setNewColor(defaultStatusColorHex)
  }

  const handleDragEnd = (event: unknown) => {
    const e = event as {
      canceled?: boolean
      operation?: { source: { id: string | number } | null; target: { id: string | number } | null }
    }
    if (e.canceled) return
    const op = e.operation
    if (!op?.source) return

    const { source, target } = op
    const sortableSource = source as { initialIndex?: number; index?: number }
    const useSortableIndices =
      typeof sortableSource.initialIndex === 'number' && typeof sortableSource.index === 'number'

    // Only custom (non-default) statuses are in the sortable — indices are relative to that sub-array
    const nonDefault = orderedStatuses.filter((s) => !s.is_default)
    const defaults = orderedStatuses.filter((s) => s.is_default)

    const fromIndex = useSortableIndices
      ? sortableSource.initialIndex
      : nonDefault.findIndex((s) => s.id === Number(source?.id))
    const toIndex = useSortableIndices
      ? sortableSource.index
      : target != null
        ? nonDefault.findIndex((s) => s.id === Number(target.id))
        : -1

    if (
      typeof fromIndex !== 'number' ||
      typeof toIndex !== 'number' ||
      fromIndex === -1 ||
      toIndex === -1 ||
      fromIndex === toIndex
    )
      return

    const next = arrayMove(nonDefault, fromIndex, toIndex)
    setOrderedStatuses([...defaults, ...next])

    Promise.all(
      next.map((status, i) => reorderMutation.mutateAsync({ id: status.id as number, order: i + 1 }))
    )
      .then(() => {
        queryClient.invalidateQueries({
          queryKey: TASK_QUERY_KEYS.statuses(projectId)
        })
        toast.success('Status order saved')
      })
      .catch(() => {})
  }

  // Split for rendering: defaults (non-done) at top, custom (sortable) in middle, "Done" pinned at bottom
  const defaultStatuses = orderedStatuses.filter((s) => s.is_default && s.name.toLowerCase() !== 'done')
  const doneStatus = orderedStatuses.find((s) => s.is_default && s.name.toLowerCase() === 'done')
  const customStatuses = orderedStatuses.filter((s) => !s.is_default)

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='flex-1 overflow-auto'>
        <div className='mx-auto max-w-[560px] px-8 py-8'>
          {isLoading ? (
            <div className='overflow-hidden rounded-[10px] border border-border'>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={cn('flex items-center gap-3 px-4 py-3', i < 5 && 'border-b border-border-light')}>
                  <Skeleton className='size-4 rounded-full' />
                  <Skeleton className='h-4 w-32' />
                </div>
              ))}
            </div>
          ) : (
            <div className='overflow-hidden rounded-[10px] border border-border'>
              {/* Add new status row — at the top */}
              <div className='flex items-center gap-3 border-b border-dashed border-border-light px-4 py-2'>
                <ColorPicker
                  value={newColor}
                  onChange={setNewColor}
                  className='!size-4 !min-h-0 !min-w-0 !rounded-full !border-0 !p-0 !shadow-none ring-2 ring-border'
                />
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddStatus()}
                  placeholder='Add a status...'
                  className='h-7 min-w-0 flex-1 bg-transparent text-[13px] font-medium outline-none placeholder:text-text-quaternary'
                />
                {newName.trim() && (
                  <button
                    type='button'
                    className='inline-flex h-7 shrink-0 items-center gap-1.5 rounded-[6px] bg-primary px-3 text-[12px] font-medium text-primary-foreground transition-opacity duration-[80ms] hover:opacity-90 disabled:opacity-40'
                    disabled={createMutation.isPending}
                    onClick={handleAddStatus}
                  >
                    {createMutation.isPending ? 'Adding...' : 'Add'}
                  </button>
                )}
              </div>

              {/* Default statuses — static, not draggable */}
              {defaultStatuses.map((status) => (
                <div
                  key={status.id}
                  className='flex items-center gap-3 border-b border-border-light px-4 py-2.5'
                >
                  <div
                    className='size-4 shrink-0 rounded-full'
                    style={{ backgroundColor: status.color ?? defaultStatusColorHex }}
                  />
                  <span className='min-w-0 flex-1 truncate text-[13px] font-medium text-foreground'>
                    {status.name}
                  </span>
                  <span className='shrink-0 rounded-[5px] bg-bg-secondary/80 px-2 py-[3px] text-[11px] font-medium text-text-quaternary'>
                    Default
                  </span>
                </div>
              ))}

              {/* Custom statuses — sortable, whole row is draggable */}
              {customStatuses.length > 0 && (
                <DragDropProvider plugins={SORTABLE_PLUGINS} onDragEnd={handleDragEnd}>
                  <div>
                    {customStatuses.map((status, index) => (
                      <SortableStatusRow
                        key={status.id}
                        status={status}
                        index={index}
                        projectId={projectId}
                        onDelete={() => setDeleteTarget(status)}
                      />
                    ))}
                  </div>
                </DragDropProvider>
              )}

              {/* Done status — always pinned at the bottom */}
              {doneStatus && (
                <div className='flex items-center gap-3 px-4 py-2.5'>
                  <div
                    className='size-4 shrink-0 rounded-full'
                    style={{ backgroundColor: doneStatus.color ?? defaultStatusColorHex }}
                  />
                  <span className='min-w-0 flex-1 truncate text-[13px] font-medium text-foreground'>
                    {doneStatus.name}
                  </span>
                  <span className='shrink-0 rounded-[5px] bg-bg-secondary/80 px-2 py-[3px] text-[11px] font-medium text-text-quaternary'>
                    Default
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className='bg-destructive/10 text-destructive'>
              <TriangleAlert />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.name}&rdquo;? Tasks using this status will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              isPending={deleteMutation.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ── Sortable status row ──────────────────────────────────────

const SortableStatusRow = ({
  status,
  index,
  projectId,
  onDelete,
}: {
  status: TaskStatus
  index: number
  projectId: number
  onDelete: () => void
}) => {
  const { ref, isDragging } = useSortable({
    id: status.id,
    index,
  })

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(status.name)
  const [editColor, setEditColor] = useState(status.color ?? defaultStatusColorHex)

  const updateMutation = useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) =>
      taskService.updateStatus(status.id, { name, color }),
    meta: {
      successMessage: 'Status updated',
      invalidatesQuery: TASK_QUERY_KEYS.statuses(projectId),
    },
    onSuccess: () => setEditing(false),
  })

  const handleSave = () => {
    const trimmed = editName.trim()
    if (!trimmed) return
    updateMutation.mutate({ name: trimmed, color: editColor })
  }

  const statusColor = status.color ?? defaultStatusColorHex

  if (editing) {
    return (
      <div
        ref={ref}
        className='flex items-center gap-3 border-b border-border-light bg-bg-hover/20 px-4 py-2.5'
      >
        <ColorPicker
          value={editColor}
          onChange={setEditColor}
          className='!size-4 !min-h-0 !min-w-0 !rounded-full !border-0 !p-0 !shadow-none ring-2 ring-border'
        />
        <input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') setEditing(false)
          }}
          className='h-7 min-w-0 flex-1 rounded-[6px] border border-border bg-background px-2.5 text-[13px] font-medium outline-none transition-[border-color,box-shadow] focus:border-primary focus:ring-2 focus:ring-primary/20'
          autoFocus
        />
        <div className='flex shrink-0 items-center gap-1.5'>
          <button
            type='button'
            className='inline-flex h-7 items-center rounded-[6px] px-2.5 text-[12px] font-medium text-text-tertiary transition-colors duration-[80ms] hover:bg-bg-hover hover:text-foreground'
            onClick={() => setEditing(false)}
          >
            Cancel
          </button>
          <button
            type='button'
            className='inline-flex h-7 items-center rounded-[6px] bg-primary px-3 text-[12px] font-medium text-primary-foreground transition-opacity duration-[80ms] hover:opacity-90 disabled:opacity-40'
            onClick={handleSave}
            disabled={updateMutation.isPending || !editName.trim()}
          >
            Save
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className={cn(
        'group/row flex cursor-grab items-center gap-3 border-b border-border-light px-4 py-2.5 transition-colors duration-75 active:cursor-grabbing',
        isDragging && 'z-10 rounded-[10px] border border-primary/20 bg-background shadow-lg shadow-primary/5',
        !isDragging && 'hover:bg-bg-hover/40',
      )}
    >
      {/* Color dot */}
      <div
        className='size-4 shrink-0 rounded-full'
        style={{ backgroundColor: statusColor }}
      />

      {/* Name */}
      <span className='min-w-0 flex-1 truncate text-[13px] font-medium text-foreground'>{status.name}</span>

      {/* Actions — appear on hover */}
      <div className='flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-75 group-hover/row:opacity-100'>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type='button'
              className='inline-flex size-7 items-center justify-center rounded-[6px] text-text-quaternary transition-colors duration-75 hover:bg-bg-active hover:text-foreground'
              onClick={(e) => {
                e.stopPropagation()
                setEditName(status.name)
                setEditColor(status.color ?? defaultStatusColorHex)
                setEditing(true)
              }}
            >
              <Pencil className='size-3.5' />
            </button>
          </TooltipTrigger>
          <TooltipContent>Edit</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type='button'
              className='inline-flex size-7 items-center justify-center rounded-[6px] text-text-quaternary transition-colors duration-75 hover:bg-destructive/10 hover:text-destructive'
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
            >
              <Trash2 className='size-3.5' />
            </button>
          </TooltipTrigger>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

// ── Shipping Section ────────────────────────────────────────

const ShippingSection = ({ projectId }: { projectId: number }) => {
  const { data: addresses, isLoading } = useQuery(getShippingAddressesQuery(projectId))

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
      {/* Column labels + Add button */}
      <div
        className='sticky top-0 z-10 flex select-none items-center gap-6 border-b border-border bg-bg-secondary/60 px-6 py-1 backdrop-blur-sm'
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
    </div>
  )
}

// ── Users Section ───────────────────────────────────────────

const getInitials = (firstName?: string, lastName?: string, email?: string): string => {
  const first = firstName?.trim()
  const last = lastName?.trim()
  if (first && last) return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
  if (first || last) return (first || last)!.charAt(0).toUpperCase()
  return (email?.charAt(0) ?? '?').toUpperCase()
}

const UserStatusToggle = ({
  user,
  currentUserId,
}: {
  user: User
  currentUserId: number | undefined
}) => {
  const isSelf = user.id === currentUserId

  const toggleMutation = useMutation({
    mutationFn: () => userService.update({ id: user.id, payload: { is_active: !user.is_active } }),
    meta: {
      successMessage: `User ${user.is_active ? 'deactivated' : 'activated'}`,
      invalidatesQuery: USER_QUERY_KEYS.lists(),
    },
  })

  const toggle = (
    <Switch
      checked={user.is_active}
      disabled={isSelf || toggleMutation.isPending}
      onCheckedChange={() => toggleMutation.mutate()}
      aria-label={user.is_active ? 'Deactivate user' : 'Activate user'}
    />
  )

  if (!isSelf) return toggle

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className='inline-flex'>{toggle}</span>
      </TooltipTrigger>
      <TooltipContent>You cannot deactivate yourself</TooltipContent>
    </Tooltip>
  )
}

const UsersSection = () => {
  const [search, setSearch] = useState('')
  const debouncedSetSearch = useDebouncedCallback((value: string) => setSearch(value), 300)
  const { user: currentUser } = useAuth()

  const [modalUser, setModalUser] = useState<User | 'create' | null>(null)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)

  const params: UserParams = {
    search: search || undefined,
    limit: 500,
  }

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getUsersQuery(params),
    placeholderData: keepPreviousData,
  })

  const users = data?.results ?? []
  const editingUser = typeof modalUser === 'object' ? modalUser : null
  const loading = isLoading || isPlaceholderData

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      {/* Toolbar */}
      <div className='flex shrink-0 items-center gap-2 border-b border-border px-6 py-1.5'>
        <div className='flex h-7 w-[220px] items-center gap-1.5 rounded-[5px] border border-border bg-background px-2 transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50'>
          <Search className='size-3 shrink-0 text-text-tertiary' />
          <input
            defaultValue={search}
            onChange={(e) => debouncedSetSearch(e.target.value)}
            placeholder='Search users...'
            className='flex-1 bg-transparent text-[13px] outline-none placeholder:text-text-tertiary'
          />
        </div>
        <div className='flex-1' />
        <button
          type='button'
          className='inline-flex h-7 items-center gap-1 rounded-[5px] bg-primary px-2.5 text-[13px] font-semibold text-primary-foreground transition-opacity duration-[80ms] hover:opacity-90'
          onClick={() => setModalUser('create')}
        >
          <Plus className='size-3.5' />
          New User
        </button>
      </div>

      {/* Table header */}
      <div className='sticky top-0 z-10 flex shrink-0 items-center gap-4 border-b border-border bg-bg-secondary/60 px-6 py-1.5 backdrop-blur-sm'>
        <div className='min-w-0 flex-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary'>
          User
        </div>
        <div className='hidden w-[180px] shrink-0 text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary sm:block'>
          Email
        </div>
        <div className='w-[80px] shrink-0 text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary'>
          Role
        </div>
        <div className='w-[60px] shrink-0 text-center text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary'>
          Active
        </div>
        <div className='w-[56px] shrink-0' />
      </div>

      {/* Table body */}
      <div className='min-h-0 flex-1 overflow-auto'>
        {loading && !users.length ? (
          <div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className='flex items-center gap-4 border-b border-border-light px-6 py-2'>
                <div className='flex min-w-0 flex-1 items-center gap-2.5'>
                  <Skeleton className='size-7 rounded-full' />
                  <Skeleton className='h-3.5 w-28' />
                </div>
                <div className='hidden w-[180px] shrink-0 sm:block'>
                  <Skeleton className='h-3.5 w-36' />
                </div>
                <div className='w-[80px] shrink-0'>
                  <Skeleton className='h-5 w-14 rounded-[4px]' />
                </div>
                <div className='flex w-[60px] shrink-0 justify-center'>
                  <Skeleton className='h-5 w-9 rounded-full' />
                </div>
                <div className='w-[56px] shrink-0' />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <PageEmpty icon={Search} title='No users found' description={search ? 'Try a different search term.' : 'Add your first user to get started.'} />
        ) : (
          users.map((user) => {
            const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || user.email
            const initials = getInitials(user.first_name, user.last_name, user.email)
            const isSelf = user.id === currentUser?.id

            return (
              <div
                key={user.id}
                className={cn(
                  'group/row flex items-center gap-4 border-b border-border-light px-6 py-1.5 transition-colors duration-75 hover:bg-bg-hover/40',
                  loading && 'opacity-60',
                )}
              >
                {/* Name + avatar */}
                <div className='flex min-w-0 flex-1 items-center gap-2.5'>
                  <InitialsAvatar initials={initials} size={26} />
                  <span className='truncate text-[13px] font-medium text-foreground'>{fullName}</span>
                  {isSelf && (
                    <span className='shrink-0 rounded-[4px] bg-primary/10 px-1.5 py-[1px] text-[10px] font-semibold text-primary'>
                      You
                    </span>
                  )}
                </div>

                {/* Email */}
                <div className='hidden w-[180px] shrink-0 sm:block'>
                  <span className='block truncate text-[13px] text-text-tertiary'>{user.email}</span>
                </div>

                {/* Role */}
                <div className='w-[80px] shrink-0'>
                  <RoleBadge role={user.role} />
                </div>

                {/* Active toggle */}
                <div className='flex w-[60px] shrink-0 justify-center'>
                  <UserStatusToggle user={user} currentUserId={currentUser?.id} />
                </div>

                {/* Actions */}
                <div className='flex w-[56px] shrink-0 items-center justify-end gap-1 opacity-0 transition-opacity duration-75 group-hover/row:opacity-100'>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type='button'
                        className='inline-flex size-7 items-center justify-center rounded-[6px] text-text-quaternary transition-colors duration-75 hover:bg-bg-active hover:text-foreground'
                        onClick={() => setModalUser(user)}
                      >
                        <Pencil className='size-3.5' />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Edit</TooltipContent>
                  </Tooltip>
                  {!isSelf && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type='button'
                          className='inline-flex size-7 items-center justify-center rounded-[6px] text-text-quaternary transition-colors duration-75 hover:bg-destructive/10 hover:text-destructive'
                          onClick={() => setDeleteUser(user)}
                        >
                          <Trash2 className='size-3.5' />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      <UserModal
        key={editingUser?.id ?? 'create'}
        open={modalUser !== null}
        onOpenChange={(open) => !open && setModalUser(null)}
        user={editingUser}
      />
      <UserDeleteDialog
        user={deleteUser}
        open={!!deleteUser}
        onOpenChange={(open) => !open && setDeleteUser(null)}
      />
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/settings/')({
  beforeLoad: () => {
    const session = getSession()
    const role = session?.user?.role as UserRole | undefined
    if (!role || !isAdmin(role)) {
      throw redirect({ to: '/', replace: true })
    }
  },
  component: SettingsPage,
  head: () => ({
    meta: [{ title: 'Settings' }]
  })
})
