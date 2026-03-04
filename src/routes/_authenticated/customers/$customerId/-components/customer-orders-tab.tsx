'use no memo'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getCoreRowModel, getExpandedRowModel, useReactTable } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { getOrdersQuery } from '@/api/order/query'
import type { Order, OrderParams } from '@/api/order/schema'
import { DataTable } from '@/components/common/data-table'
import { Pagination } from '@/components/common/filters/pagination'
import { SearchFilter } from '@/components/common/filters/search'
import { useOrdering } from '@/hooks/use-ordering'
import { useProjectId } from '@/hooks/use-project-id'
import { useLimitParam, useOffsetParam, useSearchParam } from '@/hooks/use-query-params'
import {
  type OrderRow,
  getOrderColumns
} from '@/routes/_authenticated/orders/-components/order-columns'
import { OrderDeleteDialog } from '@/routes/_authenticated/orders/-components/order-delete-dialog'
import { OrderExpandedRow } from '@/routes/_authenticated/orders/-components/order-expanded-row'

interface CustomerOrdersTabProps {
  customerId: string
}

export const CustomerOrdersTab = ({ customerId }: CustomerOrdersTabProps) => {
  const [search] = useSearchParam()
  const [offset] = useOffsetParam()
  const [limit] = useLimitParam()
  const [projectId] = useProjectId()
  const { sorting, setSorting, ordering } = useOrdering()

  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)

  const params: OrderParams = {
    customer_id: customerId,
    invoice: search || undefined,
    offset,
    limit,
    ordering,
    project_id: projectId ?? undefined
  }

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getOrdersQuery(params),
    placeholderData: keepPreviousData
  })

  const results: OrderRow[] = data?.results ?? []

  const columns = useMemo(
    () =>
      getOrderColumns({
        fieldConfig: null,
        data: results,
        onDelete: setOrderToDelete,
        actionsVariant: 'deleteOnly'
      }),
    [results, setOrderToDelete]
  )

  const table = useReactTable({
    columns,
    data: results,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: (row) => !!row.original.items?.length,
    onSortingChange: setSorting,
    state: { sorting },
    manualSorting: true
  })

  return (
    <div className='flex h-full min-w-0 flex-col gap-4'>
      <SearchFilter placeholder='Search orders...' />

      <DataTable
        table={table}
        isLoading={isLoading || isPlaceholderData}
        className='min-w-0 flex-1'
        renderSubComponent={(row) => <OrderExpandedRow row={row} />}
        fitWidth
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
