import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

import { OrdersDataTable } from './-components/orders-data-table'
import { getOrdersQuery } from '@/api/order/query'
import type { OrderParams } from '@/api/order/schema'
import { Pagination } from '@/components/common/filters/pagination'
import { SearchFilter } from '@/components/common/filters/search'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ORDER_STATUS } from '@/constants/order'
import type { OrderStatus } from '@/constants/order'
import { useOrdering } from '@/hooks/use-ordering'
import { useProjectId } from '@/hooks/use-project-id'
import {
  useLimitParam,
  useOffsetParam,
  useOrderAutoidParam,
  useOrderProjectIdParam,
  useOrderStatusParam,
  useSearchParam
} from '@/hooks/use-query-params'

export const Route = createFileRoute('/_authenticated/orders/')({
  component: OrdersPage,
  head: () => ({
    meta: [{ title: 'Orders' }]
  })
})

const STATUS_TABS = [
  { label: 'Unprocessed', value: ORDER_STATUS.unprocessed },
  { label: 'Open', value: ORDER_STATUS.open },
  { label: 'Closed', value: ORDER_STATUS.closed },
  { label: 'All Orders', value: 'all' }
] as const

const VALID_STATUS_VALUES = new Set<string>(Object.values(ORDER_STATUS))

function OrdersPage() {
  const navigate = useNavigate()
  const [search] = useSearchParam()
  const [offset, setOffset] = useOffsetParam()
  const [limit] = useLimitParam()
  const [projectIdFromStorage] = useProjectId()
  const [autoidFromUrl] = useOrderAutoidParam()
  const [projectIdFromUrl] = useOrderProjectIdParam()
  const [status, setStatus] = useOrderStatusParam()
  const projectId = projectIdFromUrl ?? projectIdFromStorage
  const { sorting, setSorting, ordering } = useOrdering()

  const activeStatus = status ?? ORDER_STATUS.unprocessed

  const apiStatus: OrderStatus | undefined =
    activeStatus !== 'all' && VALID_STATUS_VALUES.has(activeStatus)
      ? (activeStatus as OrderStatus)
      : undefined

  const params: OrderParams = {
    search: search || undefined,
    autoid: autoidFromUrl ?? undefined,
    offset,
    limit,
    ordering,
    status: apiStatus,
    project_id: projectId ?? undefined
  }

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getOrdersQuery(params),
    placeholderData: keepPreviousData
  })

  const handleStatusChange = (value: string) => {
    setStatus(value)
    setOffset(null)
  }

  return (
    <div className='flex h-full flex-col gap-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Orders</h1>
        <Button onClick={() => navigate({ to: '/create' })}>
          <Plus />
          Create Order
        </Button>
      </div>

      <Tabs
        value={activeStatus}
        onValueChange={handleStatusChange}
      >
        <TabsList variant='line'>
          {STATUS_TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <SearchFilter placeholder='Search by invoice number...' />

      <OrdersDataTable
        data={data?.results ?? []}
        isLoading={isLoading || isPlaceholderData}
        sorting={sorting}
        setSorting={setSorting}
      />

      <Pagination totalCount={data?.count ?? 0} />
    </div>
  )
}
