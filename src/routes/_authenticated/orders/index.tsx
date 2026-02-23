import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Plus, ShoppingCart, X } from 'lucide-react'
import { useState } from 'react'

import { OrderDeleteDialog } from './-components/order-delete-dialog'
import { OrdersDataTable } from './-components/orders-data-table'
import { getOrdersQuery, ORDER_QUERY_KEYS } from '@/api/order/query'
import { orderService } from '@/api/order/service'
import type { Order, OrderParams } from '@/api/order/schema'
import { Pagination } from '@/components/common/filters/pagination'
import { SearchFilter } from '@/components/common/filters/search'
import { Badge } from '@/components/ui/badge'
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
  const [autoidFromUrl, setAutoidFromUrl] = useOrderAutoidParam()
  const [projectIdFromUrl] = useOrderProjectIdParam()
  const [status, setStatus] = useOrderStatusParam()
  const projectId = projectIdFromUrl ?? projectIdFromStorage
  const { sorting, setSorting, ordering } = useOrdering()

  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)

  const deleteLinkedProposalMutation = useMutation({
    mutationFn: (autoid: string) => orderService.deleteLinkedProposal(autoid),
    meta: {
      successMessage: 'Linked proposal deleted',
      errorMessage: 'Failed to delete linked proposal',
      invalidatesQuery: ORDER_QUERY_KEYS.lists(),
    },
  })

  const activeStatus = status ?? ORDER_STATUS.unprocessed

  const apiStatus: OrderStatus | undefined =
    activeStatus !== 'all' && VALID_STATUS_VALUES.has(activeStatus)
      ? (activeStatus as OrderStatus)
      : undefined

  const params: OrderParams = {
    invoice: search || undefined,
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
    <div className='flex h-full flex-col gap-5'>
      <header className='flex items-start justify-between'>
        <div className='flex items-center gap-3'>
          <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
            <ShoppingCart className='size-5' />
          </div>
          <div>
            <h1 className='text-2xl font-semibold tracking-tight'>Orders</h1>
            <p className='text-sm text-muted-foreground'>{data?.count ?? 0} total</p>
          </div>
        </div>
        <Button onClick={() => navigate({ to: '/create' })} className='gap-2'>
          <Plus className='size-4' />
          Create Order
        </Button>
      </header>

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

      <div className='flex flex-wrap items-center gap-2'>
        <SearchFilter placeholder='Search by invoice number...' />
        {autoidFromUrl && (
          <Badge
            variant='secondary'
            className='cursor-pointer gap-1 pr-1 transition-opacity hover:opacity-80'
            onClick={() => setAutoidFromUrl(null)}
          >
            Order: {autoidFromUrl}
            <button
              type='button'
              className='rounded-sm p-0.5 hover:bg-muted'
              onClick={(e) => {
                e.stopPropagation()
                setAutoidFromUrl(null)
              }}
              aria-label='Clear order filter'
            >
              <X className='size-3' />
            </button>
          </Badge>
        )}
      </div>

      <OrdersDataTable
        data={data?.results ?? []}
        isLoading={isLoading || isPlaceholderData}
        sorting={sorting}
        setSorting={setSorting}
        onDelete={setOrderToDelete}
        onDeleteLinkedProposal={(order) => deleteLinkedProposalMutation.mutate(order.autoid)}
      />

      <Pagination totalCount={data?.count ?? 0} />

      <OrderDeleteDialog
        order={orderToDelete}
        projectId={projectId}
        open={!!orderToDelete}
        onOpenChange={(open) => !open && setOrderToDelete(null)}
      />
    </div>
  )
}
