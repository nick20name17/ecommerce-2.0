import { defaultPreset } from '@dnd-kit/dom'
import { OptimisticSortingPlugin, SortableKeyboardPlugin } from '@dnd-kit/dom/sortable'
import { DragDropProvider } from '@dnd-kit/react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { Database, MapPin, MoreHorizontal, Pencil, Plus, Star, Trash2, TriangleAlert } from 'lucide-react'

import { ISettings, PAGE_COLORS, PageHeaderIcon, ViewToggle, type ViewOption } from '@/components/ds'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { FieldsDataTable } from './-components/fields-data-table'
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
import { getUsersQuery } from '@/api/user/query'
import type { User, UserParams } from '@/api/user/schema'
import { StatusList } from '@/components/tasks/task-status-manager'
import { Pagination } from '@/components/common/filters/pagination'
import { SearchFilter } from '@/components/common/filters/search'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { isAdmin } from '@/constants/user'
import type { UserRole } from '@/constants/user'
import { getSession } from '@/helpers/auth'
import { useProjectId } from '@/hooks/use-project-id'
import { useOrdering } from '@/hooks/use-ordering'
import { useLimitParam, useOffsetParam, useSearchParam } from '@/hooks/use-query-params'
import { UserDeleteDialog } from '../users/-components/user-delete-dialog'
import { UserModal } from '../users/-components/user-modal'
import { UsersDataTable } from '../users/-components/users-data-table'

// ── Top-level section type ──────────────────────────────────

type SettingsSection = 'data-control' | 'tasks' | 'shipping' | 'users'

const SECTION_LABELS: Record<SettingsSection, string> = {
  'data-control': 'Data Control',
  tasks: 'Tasks',
  shipping: 'Shipping',
  users: 'Users',
}

const SECTION_OPTIONS: ViewOption<SettingsSection>[] = Object.entries(SECTION_LABELS).map(([key, label]) => ({
  value: key as SettingsSection,
  label,
}))

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

// ── Main component ──────────────────────────────────────────

const SettingsPage = () => {
  const [projectId] = useProjectId()
  const [section, setSection] = useQueryState('section', parseAsString)

  const currentSection = (section ?? 'data-control') as SettingsSection

  if (!projectId) {
    return (
      <div className='text-text-tertiary flex h-full flex-col items-center justify-center gap-3'>
        <Database className='size-12 opacity-50' />
        <h1 className='text-foreground text-[16px] font-semibold'>Settings</h1>
        <p className='text-[13px]'>Please select a project first.</p>
      </div>
    )
  }

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      <header className='flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-6'>
        <div className='flex items-center gap-1.5'>
          <PageHeaderIcon icon={ISettings} color={PAGE_COLORS.settings} />
          <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>Settings</h1>
        </div>

        {/* Top-level section tabs */}
        <ViewToggle
          options={SECTION_OPTIONS}
          value={currentSection}
          onChange={(val) => setSection(val === 'data-control' ? null : val)}
        />
      </header>

      {currentSection === 'data-control' && <DataControlSection projectId={projectId} />}
      {currentSection === 'tasks' && <TasksSection projectId={projectId} />}
      {currentSection === 'shipping' && <ShippingSection projectId={projectId} />}
      {currentSection === 'users' && <UsersSection />}
    </div>
  )
}

// ── Data Control Section ────────────────────────────────────

const DataControlSection = ({ projectId }: { projectId: number }) => {
  const [activeTab, setActiveTab] = useQueryState('tab', parseAsString)
  const client = useQueryClient()

  const { data, isLoading, isPlaceholderData } = useQuery({
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
      entity: currentTab
    }))
  }, [data, currentTab])

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
                <Skeleton key={i} className='h-9 w-28 rounded-md' />
              ))
            : entities.map((entity) => (
                <TabsTrigger key={entity} value={entity}>
                  {getTableLabel(entity)}
                </TabsTrigger>
              ))}
        </TabsList>
      </div>

      <div className='flex-1 overflow-auto px-6 py-4'>
        {showTabSkeleton ? (
          <FieldsDataTable
            fields={[]}
            isLoading
            entity={currentTab}
            projectId={projectId}
            onFieldToggle={handleFieldToggle}
            onAliasSubmit={handleAliasSubmit}
            isPending={patchMutation.isPending}
            isAliasPending={patchMutation.isPending}
          />
        ) : entities.length === 0 ? (
          <div className='text-text-tertiary mt-4 flex flex-1 items-center justify-center text-[13px]'>
            No field configuration available.
          </div>
        ) : (
          entities.map((entity) => (
            <TabsContent key={entity} value={entity}>
              <FieldsDataTable
                fields={entity === currentTab ? fields : []}
                isLoading={isLoading || isPlaceholderData}
                entity={entity}
                projectId={projectId}
                onFieldToggle={handleFieldToggle}
                onAliasSubmit={handleAliasSubmit}
                isPending={patchMutation.isPending}
                isAliasPending={patchMutation.isPending}
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

const TasksSection = ({ projectId }: { projectId: number }) => {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery(getTaskStatusesQuery(projectId))
  const statuses = data?.results ?? []

  const [orderedStatuses, setOrderedStatuses] = useState<TaskStatus[]>([])

  const statusIds = statuses.map((s) => s.id).join(',')
  useEffect(() => {
    setOrderedStatuses([...statuses].sort((a, b) => a.order - b.order))
  }, [statusIds])

  const reorderMutation = useMutation({
    mutationFn: ({ id, order }: { id: number; order: number }) =>
      taskService.updateStatus(id, { order })
  })

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

    const fromIndex = useSortableIndices
      ? sortableSource.initialIndex
      : orderedStatuses.findIndex((s) => s.id === Number(source?.id))
    const toIndex = useSortableIndices
      ? sortableSource.index
      : target != null
        ? orderedStatuses.findIndex((s) => s.id === Number(target.id))
        : -1

    if (
      typeof fromIndex !== 'number' ||
      typeof toIndex !== 'number' ||
      fromIndex === -1 ||
      toIndex === -1 ||
      fromIndex === toIndex
    )
      return

    const next = arrayMove(orderedStatuses, fromIndex, toIndex)
    setOrderedStatuses(next)

    Promise.all(
      next
        .filter((s) => !s.is_default && s.id != null)
        .map((status, i) => reorderMutation.mutateAsync({ id: status.id as number, order: i }))
    )
      .then(() => {
        queryClient.invalidateQueries({
          queryKey: TASK_QUERY_KEYS.statuses(projectId)
        })
        toast.success('Status order saved')
      })
      .catch(() => {})
  }

  if (isLoading) {
    return (
      <div className='px-6 py-4'>
        <div className='flex max-w-md flex-col gap-2'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className='h-10 w-full rounded-md' />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className='flex-1 overflow-auto px-6 py-4'>
      <div className='max-w-md'>
        <p className='text-text-tertiary mb-3 text-[13px]'>
          Drag rows to reorder. Default status is fixed and cannot be edited or deleted.
        </p>
        <DragDropProvider
          plugins={SORTABLE_PLUGINS}
          onDragEnd={handleDragEnd}
        >
          <StatusList
            projectId={projectId}
            statuses={orderedStatuses}
            onStatusesChange={setOrderedStatuses}
          />
        </DragDropProvider>
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

  if (isLoading) {
    return (
      <div className='px-6 py-4'>
        <div className='flex max-w-2xl flex-col gap-2'>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className='h-20 w-full rounded-lg' />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-6'>
        <p className='text-[13px] text-text-tertiary'>
          Ship-from addresses used with ShipEngine for label creation.
        </p>
        <div className='flex-1' />
        <button
          type='button'
          className='inline-flex h-7 items-center gap-1 rounded-[5px] bg-primary px-2.5 text-[13px] font-semibold text-primary-foreground transition-colors duration-[80ms] hover:opacity-90'
          onClick={() => setModalAddress('create')}
        >
          <Plus className='size-3.5' />
          <span className='hidden sm:inline'>Add Address</span>
        </button>
      </div>

      <div className='flex-1 overflow-auto px-6 py-4'>
        {!addresses?.length ? (
          <div className='flex flex-col items-center justify-center py-16 text-center'>
            <MapPin className='mb-3 size-10 text-text-quaternary' />
            <p className='text-[13px] font-medium text-text-secondary'>No shipping addresses</p>
            <p className='mt-1 text-[12px] text-text-tertiary'>
              Add a warehouse or office address to use as ship-from when creating shipping labels.
            </p>
          </div>
        ) : (
          <div className='flex max-w-2xl flex-col gap-2'>
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className='group relative flex items-start gap-4 rounded-lg border border-border bg-bg-secondary/40 px-4 py-3 transition-colors duration-75 hover:bg-bg-secondary/70'
              >
                <div className='flex size-8 shrink-0 items-center justify-center rounded-md bg-bg-secondary text-text-tertiary'>
                  <MapPin className='size-4' />
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center gap-2'>
                    <span className='text-[13px] font-semibold text-foreground'>{addr.title}</span>
                    {addr.is_default && (
                      <span className='inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-amber-700 dark:border-amber-600 dark:bg-amber-500/20 dark:text-amber-300'>
                        <Star className='size-2.5' />
                        Default
                      </span>
                    )}
                  </div>
                  <p className='mt-0.5 text-[13px] text-text-secondary'>
                    {[addr.address_line1, addr.address_line2].filter(Boolean).join(', ')}
                  </p>
                  <p className='text-[12px] text-text-tertiary'>
                    {[addr.city, addr.state, addr.postal_code, addr.country_code].filter(Boolean).join(', ')}
                  </p>
                  {(addr.name || addr.phone) && (
                    <p className='mt-1 text-[12px] text-text-tertiary'>
                      {[addr.name, addr.phone].filter(Boolean).join(' \u00b7 ')}
                    </p>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type='button'
                      className='inline-flex size-7 items-center justify-center rounded-[5px] text-text-tertiary opacity-0 transition-all duration-75 hover:bg-bg-hover hover:text-foreground group-hover:opacity-100'
                    >
                      <MoreHorizontal className='size-4' />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem onClick={() => setModalAddress(addr)}>
                      <Pencil className='mr-2 size-3.5' />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className='text-destructive focus:text-destructive'
                      onClick={() => setDeleteAddress(addr)}
                    >
                      <Trash2 className='mr-2 size-3.5' />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
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

const UsersSection = () => {
  const [search] = useSearchParam()
  const [offset] = useOffsetParam()
  const [limit] = useLimitParam()
  const { sorting, setSorting, ordering } = useOrdering()

  const [modalUser, setModalUser] = useState<User | 'create' | null>(null)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)

  const params: UserParams = {
    search: search || undefined,
    offset,
    limit,
    ordering
  }

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getUsersQuery(params),
    placeholderData: keepPreviousData
  })

  const editingUser = typeof modalUser === 'object' ? modalUser : null

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-6'>
        <SearchFilter className='max-w-[240px]' placeholder='Search by name or email...' />
        <div className='flex-1' />
        <button
          type='button'
          className='inline-flex h-7 items-center gap-1 rounded-[5px] bg-primary px-2.5 text-[13px] font-semibold text-primary-foreground transition-colors duration-[80ms] hover:opacity-90'
          onClick={() => setModalUser('create')}
        >
          <Plus className='size-3.5' />
          <span className='hidden sm:inline'>Add User</span>
        </button>
      </div>

      <div className='flex-1 overflow-auto'>
        <UsersDataTable
          data={data?.results ?? []}
          isLoading={isLoading || isPlaceholderData}
          sorting={sorting}
          setSorting={setSorting}
          onEdit={setModalUser}
          onDelete={setDeleteUser}
        />
      </div>

      <div className='shrink-0 border-t border-border px-6 py-2'>
        <Pagination totalCount={data?.count ?? 0} />
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
