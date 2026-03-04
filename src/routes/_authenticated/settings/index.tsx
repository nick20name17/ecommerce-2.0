import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { Database, Settings } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useMemo } from 'react'

import { FieldsDataTable } from './-components/fields-data-table'
import { CUSTOMER_QUERY_KEYS } from '@/api/customer/query'
import { FIELD_CONFIG_QUERY_KEYS, getFieldConfigQuery } from '@/api/field-config/query'
import type { FieldConfigResponse, FieldConfigRow } from '@/api/field-config/schema'
import { fieldConfigService } from '@/api/field-config/service'
import { ORDER_QUERY_KEYS } from '@/api/order/query'
import { PROPOSAL_QUERY_KEYS } from '@/api/proposal/query'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { isAdmin } from '@/constants/user'
import type { UserRole } from '@/constants/user'
import { getSession } from '@/helpers/auth'
import { useProjectId } from '@/hooks/use-project-id'

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

function SettingsPage() {
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
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className='h-9 w-28 rounded-md'
                />
              ))
            : entities.map((entity) => (
                <TabsTrigger
                  key={entity}
                  value={entity}
                >
                  {getTableLabel(entity)}
                </TabsTrigger>
              ))}
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
      </Tabs>
    </div>
  )
}
