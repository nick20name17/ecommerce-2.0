import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { TriangleAlert } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useMemo } from 'react'

import { PageEmpty } from '@/components/common/page-empty'
import { FieldsDataTable } from './fields-data-table'
import { CUSTOMER_QUERY_KEYS } from '@/api/customer/query'
import { FIELD_CONFIG_QUERY_KEYS, getFieldConfigQuery } from '@/api/field-config/query'
import type { FieldConfigResponse, FieldConfigRow } from '@/api/field-config/schema'
import { fieldConfigService } from '@/api/field-config/service'
import { ORDER_QUERY_KEYS } from '@/api/order/query'
import { PROPOSAL_QUERY_KEYS } from '@/api/proposal/query'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { isSuperAdmin } from '@/constants/user'
import { useAuth } from '@/providers/auth'

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

export const DataControlSection = ({ projectId }: { projectId: number }) => {
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
