import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { parseAsString, useQueryState } from 'nuqs'
import { Database, Settings } from 'lucide-react'
import { useMemo } from 'react'

import { FieldsDataTable } from './-components/fields-data-table'
import type {
  FieldConfigResponse,
  FieldConfigRow
} from '@/api/field-config/schema'
import { fieldConfigService } from '@/api/field-config/service'
import {
  FIELD_CONFIG_QUERY_KEYS,
  getFieldConfigQuery
} from '@/api/field-config/query'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { queryClient } from '@/providers/react-query'
import { useProjectId } from '@/hooks/use-project-id'

export const Route = createFileRoute('/_authenticated/settings/')({
  component: SettingsPage,
  head: () => ({
    meta: [{ title: 'Settings' }]
  })
})

const TABLE_LABELS: Record<string, string> = {
  customer: 'Customers Data',
  product: 'Products Data',
  order: 'Orders Data',
  order_item: 'Line Items Data',
  order_detail: 'Line Items Data',
  default_component: 'Default Components',
  component: 'Components',
  shipper: 'Shippers',
  ship_info: 'Ship Info',
  proposal: 'Proposals Data'
}

function getTableLabel(name: string): string {
  return TABLE_LABELS[name] ?? name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ')
}

function applyFieldToggle(
  prev: FieldConfigResponse | undefined,
  entity: string,
  fieldName: string,
  enabled: boolean
): FieldConfigResponse | undefined {
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
        client.setQueryData(
          FIELD_CONFIG_QUERY_KEYS.fieldConfig(projectId),
          context.prev
        )
    },
    meta: {
      invalidatesQuery: projectId
        ? FIELD_CONFIG_QUERY_KEYS.fieldConfig(projectId)
        : undefined,
      successMessage: 'Field configuration updated'
    }
  })

  const entities = useMemo(
    () => Object.keys(data ?? {}),
    [data]
  )
  const currentTab = activeTab ?? entities[0] ?? ''

  const fields: FieldConfigRow[] = useMemo(() => {
    const entityFields = data?.[currentTab]
    if (!entityFields) return []
    return entityFields
      .filter((entry) => !entry.extra)
      .map((entry) => ({
        field: entry.field,
        default: entry.default,
        enabled: entry.enabled,
        entity: currentTab
      }))
  }, [data, currentTab])

  const handleFieldToggle = (entity: string, fieldName: string, enabled: boolean) => {
    if (!projectId || !data?.[entity]) return
    const entityFields = data[entity].filter((e) => !e.extra)
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
      <div className='flex h-full flex-col items-center justify-center gap-3 text-muted-foreground'>
        <Database className='size-12 opacity-50' />
        <h1 className='text-2xl font-bold text-foreground'>Settings</h1>
        <p className='text-sm'>Please select a project first.</p>
      </div>
    )
  }

  const showTabSkeleton = isLoading && !data

  return (
    <div className='flex h-full flex-col gap-5'>
      <header className='flex items-center gap-3'>
        <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
          <Settings className='size-5' />
        </div>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>Settings</h1>
          <p className='text-sm text-muted-foreground'>
            Data schema and field configuration
          </p>
        </div>
      </header>

      <Tabs value={currentTab} onValueChange={setActiveTab} className='flex h-full min-h-0 flex-col'>
        <TabsList variant='line' className='flex-wrap'>
          {showTabSkeleton ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className='h-9 w-28 rounded-md' />
            ))
          ) : (
            entities.map((entity) => (
              <TabsTrigger key={entity} value={entity}>
                {getTableLabel(entity)}
              </TabsTrigger>
            ))
          )}
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
          <div className='mt-4 flex flex-1 items-center justify-center text-sm text-muted-foreground'>
            No field configuration available.
          </div>
        ) : (
          entities.map((entity) => (
            <TabsContent key={entity} value={entity} className='mt-4 min-h-0 flex-1'>
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
