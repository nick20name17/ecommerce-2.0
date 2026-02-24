import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { parseAsString, useQueryState } from 'nuqs'
import { Database } from 'lucide-react'
import { useMemo } from 'react'

import { FieldsDataTable } from './-components/fields-data-table'
import { getDataSchemaQuery } from '@/api/data-schema/query'
import type { TableField } from '@/api/data-schema/schema'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useProjectId } from '@/hooks/use-project-id'
import { useOrdering } from '@/hooks/use-ordering'

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
  order_detail: 'Line Items Data',
  default_component: 'Default Components',
  component: 'Components',
  shipper: 'Shippers',
  ship_info: 'Ship Info'
}

function getTableLabel(name: string): string {
  return TABLE_LABELS[name] ?? name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ')
}

function SettingsPage() {
  const [projectId] = useProjectId()
  const [activeTab, setActiveTab] = useQueryState('tab', parseAsString)
  const { sorting, setSorting } = useOrdering()

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getDataSchemaQuery(projectId),
    placeholderData: keepPreviousData
  })

  const tables = data?.tables ?? []
  const currentTab = activeTab ?? tables[0]?.name ?? ''

  const currentTable = tables.find((t) => t.name === currentTab)

  const fields: TableField[] = useMemo(() => {
    if (!currentTable) return []

    const defaultFieldsSet = new Set(currentTable.default_fields)

    return currentTable.all_fields.map((fieldName) => ({
      name: fieldName,
      dbTable: currentTable.db_table,
      isEnabled: defaultFieldsSet.has(fieldName)
    }))
  }, [currentTable])

  if (!projectId) {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-3 text-muted-foreground'>
        <Database className='size-12 opacity-50' />
        <h1 className='text-2xl font-bold text-foreground'>Settings</h1>
        <p className='text-sm'>Please select a project first.</p>
      </div>
    )
  }

  return (
    <div className='flex h-full flex-col gap-4'>
      <header>
        <h1 className='text-lg font-semibold tracking-tight'>Settings</h1>
      </header>

      <Tabs value={currentTab} onValueChange={setActiveTab} className='flex h-full min-h-0 flex-col'>
        <TabsList variant='outline' className='flex-wrap'>
          {tables.map((table) => (
            <TabsTrigger key={table.name} value={table.name}>
              {getTableLabel(table.name)}
            </TabsTrigger>
          ))}
        </TabsList>

        {tables.map((table) => (
          <TabsContent key={table.name} value={table.name} className='mt-4 min-h-0 flex-1'>
            <FieldsDataTable
              fields={table.name === currentTab ? fields : []}
              isLoading={isLoading || isPlaceholderData}
              sorting={sorting}
              setSorting={setSorting}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
