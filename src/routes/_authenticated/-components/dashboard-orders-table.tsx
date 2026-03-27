import { useQuery } from '@tanstack/react-query'

import { getOrdersQuery } from '@/api/order/query'
import type { OrderStatus } from '@/api/order/schema'
import { ORDER_STATUS, ORDER_STATUS_LABELS } from '@/constants/order'
import { StatusIcon } from '@/components/ds/status-icon'
import { Skeleton } from '@/components/ui/skeleton'

const STATUS_COLORS: Record<string, string> = {
  [ORDER_STATUS.unprocessed]: '#f59e0b',
  [ORDER_STATUS.outstandingInvoice]: '#3b82f6',
}

const TRACKED_STATUSES: OrderStatus[] = [
  ORDER_STATUS.unprocessed,
  ORDER_STATUS.outstandingInvoice,
]

interface DashboardOrdersTableProps {
  projectId: number | null
  customerId?: string
}

export function DashboardOrdersTable({ projectId, customerId }: DashboardOrdersTableProps) {
  const queries = TRACKED_STATUSES.map((status) => {
    const params = {
      status,
      limit: 1,
      project_id: projectId ?? undefined,
      customer_id: customerId,
    }
    return useQuery({
      ...getOrdersQuery(params),
      enabled: projectId != null,
    })
  })

  const isLoading = queries.some((q) => q.isLoading)

  if (isLoading) {
    return (
      <div className='rounded-[8px] border border-border bg-background'>
        <div className='px-4 py-3'>
          <Skeleton className='h-4 w-32' />
        </div>
        <div className='divide-y divide-border'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='flex items-center gap-3 px-4 py-2.5'>
              <Skeleton className='size-3.5 rounded-full' />
              <Skeleton className='h-3 w-24' />
              <div className='flex-1' />
              <Skeleton className='h-3 w-12' />
              <Skeleton className='h-3 w-16' />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const rows = TRACKED_STATUSES.map((status, i) => {
    const data = queries[i].data
    return {
      status,
      label: ORDER_STATUS_LABELS[status],
      color: STATUS_COLORS[status],
      count: data?.count ?? 0,
    }
  }).filter((r) => r.count > 0)

  if (rows.length === 0) return null

  return (
    <div className='rounded-[8px] border border-border bg-background'>
      <div className='px-4 py-3'>
        <h2 className='text-[14px] font-semibold'>Orders to process</h2>
      </div>
      <table className='w-full'>
        <thead>
          <tr className='border-t border-border text-[12px] text-text-tertiary'>
            <th className='px-4 py-2 text-left font-medium'>Status</th>
            <th className='px-4 py-2 text-right font-medium'>Count</th>
          </tr>
        </thead>
        <tbody className='divide-y divide-border'>
          {rows.map((row) => (
            <tr key={row.status}>
              <td className='px-4 py-2.5'>
                <div className='flex items-center gap-2.5'>
                  <StatusIcon status={row.label} color={row.color} size={14} />
                  <span className='text-[13px]'>{row.label}</span>
                </div>
              </td>
              <td className='px-4 py-2.5 text-right text-[13px] tabular-nums'>
                {row.count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
