import { defaultPreset } from '@dnd-kit/dom'
import { OptimisticSortingPlugin, SortableKeyboardPlugin } from '@dnd-kit/dom/sortable'
import { DragDropProvider } from '@dnd-kit/react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { Database, Settings } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { FieldsDataTable } from './-components/fields-data-table'
import { CUSTOMER_QUERY_KEYS } from '@/api/customer/query'
import { FIELD_CONFIG_QUERY_KEYS, getFieldConfigQuery } from '@/api/field-config/query'
import type { FieldConfigResponse, FieldConfigRow } from '@/api/field-config/schema'
import { fieldConfigService } from '@/api/field-config/service'
import { ORDER_QUERY_KEYS } from '@/api/order/query'
import { PROPOSAL_QUERY_KEYS } from '@/api/proposal/query'
import { TASK_QUERY_KEYS, getTaskStatusesQuery } from '@/api/task/query'
import type { TaskStatus } from '@/api/task/schema'
import { taskService } from '@/api/task/service'
import { StatusList } from '@/routes/_authenticated/tasks/-components/task-status-manager'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { isAdmin } from '@/constants/user'
import type { UserRole } from '@/constants/user'
import { getSession } from '@/helpers/auth'
import { useProjectId } from '@/hooks/use-project-id'

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

const SettingsPage = () => {
  const [projectId] = useProjectId()
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
    }) => fieldConfigService.patchFieldConfig(projectId!, payload),
    onMutate: async ({ entity, fieldName, enabled }) => {
      if (!projectId) return
      const key = FIELD_CONFIG_QUERY_KEYS.fieldConfig(projectId)
      await client.cancelQueries({ queryKey: key })
      const prev = client.getQueryData<FieldConfigResponse>(key)
      const next = applyFieldToggle(prev, entity, fieldName, enabled)
      if (next) client.setQueryData(key, next)
      return { prev }
    },
    onError: (_err, _variables, context) => {
      if (context?.prev && projectId)
        client.setQueryData(FIELD_CONFIG_QUERY_KEYS.fieldConfig(projectId), context.prev)
    },
    onSuccess: (_data, variables) => {
      const queryKey = getQueryKeyToInvalidate(variables.entity)
      if (queryKey) client.invalidateQueries({ queryKey })
    },
    meta: {
      invalidatesQuery: projectId ? FIELD_CONFIG_QUERY_KEYS.fieldConfig(projectId) : undefined,
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
      default: entry.default,
      enabled: entry.enabled,
      entity: currentTab
    }))
  }, [data, currentTab])

  const handleFieldToggle = (entity: string, fieldName: string, enabled: boolean) => {
    if (!projectId || !data?.[entity]) return
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

  if (!projectId) {
    return (
      <div className='text-muted-foreground flex h-full flex-col items-center justify-center gap-3'>
        <Database className='size-12 opacity-50' />
        <h1 className='text-foreground text-2xl font-bold'>Settings</h1>
        <p className='text-sm'>Please select a project first.</p>
      </div>
    )
  }

  const showTabSkeleton = isLoading && !data

  return (
    <div className='flex h-full flex-col gap-5'>
      <header className='flex items-center gap-3'>
        <div className='bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg'>
          <Settings className='size-5' />
        </div>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>Settings</h1>
          <p className='text-muted-foreground text-sm'>Data schema and field configuration</p>
        </div>
      </header>

      <Tabs
        value={currentTab}
        onValueChange={setActiveTab}
        className='flex h-full min-h-0 flex-col'
      >
        <TabsList
          variant='line'
          className='flex-wrap'
        >
          {showTabSkeleton
            ? <>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className='h-9 w-28 rounded-md'
                  />
                ))}
                <TabsTrigger value='task_statuses'>
                  Task Statuses
                </TabsTrigger>
              </>
            : <>
                {entities.map((entity) => (
                  <TabsTrigger
                    key={entity}
                    value={entity}
                  >
                    {getTableLabel(entity)}
                  </TabsTrigger>
                ))}
                <TabsTrigger value='task_statuses'>
                  Task Statuses
                </TabsTrigger>
              </>}
        </TabsList>

        {showTabSkeleton ? (
          <div className='mt-4 min-h-0 flex-1'>
            <FieldsDataTable
              fields={[]}
              isLoading
              entity={currentTab}
              projectId={projectId}
              onFieldToggle={handleFieldToggle}
              isPending={patchMutation.isPending}
            />
          </div>
        ) : entities.length === 0 ? (
          <div className='text-muted-foreground mt-4 flex flex-1 items-center justify-center text-sm'>
            No field configuration available.
          </div>
        ) : (
          entities.map((entity) => (
            <TabsContent
              key={entity}
              value={entity}
              className='mt-4 min-h-0 flex-1'
            >
              <FieldsDataTable
                fields={entity === currentTab ? fields : []}
                isLoading={isLoading || isPlaceholderData}
                entity={entity}
                projectId={projectId}
                onFieldToggle={handleFieldToggle}
                isPending={patchMutation.isPending}
              />
            </TabsContent>
          ))
        )}

        <TabsContent value='task_statuses' className='mt-4 min-h-0 flex-1'>
          <TaskStatusesTab projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ── Task Statuses Tab ────────────────────────────────────────

const SORTABLE_PLUGINS = [...defaultPreset.plugins, OptimisticSortingPlugin, SortableKeyboardPlugin]

const arrayMove = <T,>(array: T[], from: number, to: number): T[] => {
  const next = array.slice()
  next.splice(to, 0, next.splice(from, 1)[0]!)
  return next
}

const TaskStatusesTab = ({ projectId }: { projectId: number }) => {
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
      <div className='flex max-w-md flex-col gap-2'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className='h-10 w-full rounded-md' />
        ))}
      </div>
    )
  }

  return (
    <div className='max-w-md'>
      <p className='text-muted-foreground mb-3 text-sm'>
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
