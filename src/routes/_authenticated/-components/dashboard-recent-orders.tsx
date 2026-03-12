import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { getOrdersQuery } from '@/api/order/query'
import { ORDER_STATUS_LABELS } from '@/constants/order'
import { StatusIcon } from '@/components/ds/status-icon'
import { formatCurrency, formatDate } from '@/helpers/formatters'
import { Skeleton } from '@/components/ui/skeleton'

const STATUS_COLORS: Record<string, string> = {
  U: '#f59e0b',
  O: '#3b82f6',
  X: '#22c55e',
  P: '#10b981',
  V: '#ef4444',
  H: '#94a3b8',
  A: '#6b7280',
}

interface DashboardRecentOrdersProps {
  projectId: number | null
  customerId?: string
}

export function DashboardRecentOrders({ projectId, customerId }: DashboardRecentOrdersProps) {
  const { data, isLoading } = useQuery({
    ...getOrdersQuery({
      limit: 5,
      ordering: '-inv_date',
      project_id: projectId ?? undefined,
      customer_id: customerId,
    }),
    enabled: projectId != null,
  })

  if (isLoading) {
    return (
      <div className='rounded-[8px] border border-border bg-background'>
        <div className='px-4 py-3'>
          <Skeleton className='h-4 w-28' />
        </div>
        <div className='divide-y divide-border'>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className='flex items-center gap-3 px-4 py-2.5'>
              <Skeleton className='size-3.5 rounded-full' />
              <Skeleton className='h-3 w-16' />
              <Skeleton className='h-3 w-32' />
              <div className='flex-1' />
              <Skeleton className='h-3 w-16' />
              <Skeleton className='h-3 w-20' />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const orders = data?.results ?? []

  if (orders.length === 0) return null

  return (
    <div className='rounded-[8px] border border-border bg-background'>
      <div className='px-4 py-3'>
        <h2 className='text-[14px] font-semibold'>Recent orders</h2>
      </div>
      <table className='w-full'>
        <thead>
          <tr className='border-t border-border text-[13px] text-text-tertiary'>
            <th className='px-4 py-2 text-left font-medium'>Status</th>
            <th className='px-4 py-2 text-left font-medium'>Invoice</th>
            <th className='px-4 py-2 text-left font-medium'>Name</th>
            <th className='px-4 py-2 text-right font-medium'>Total</th>
            <th className='px-4 py-2 text-right font-medium'>Date</th>
          </tr>
        </thead>
        <tbody className='divide-y divide-border'>
          {orders.map((order) => (
            <tr key={order.autoid} className='group'>
              <td className='px-4 py-2.5'>
                <div className='flex items-center gap-2'>
                  <StatusIcon
                    status={ORDER_STATUS_LABELS[order.status]}
                    color={STATUS_COLORS[order.status]}
                    size={14}
                  />
                  <span className='text-[13px] text-text-tertiary'>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>
              </td>
              <td className='px-4 py-2.5'>
                <Link
                  to='/orders/$orderId'
                  params={{ orderId: order.autoid }}
                  className='text-[13px] font-medium text-text-primary hover:underline'
                >
                  {order.invoice || order.id}
                </Link>
              </td>
              <td className='max-w-[200px] truncate px-4 py-2.5 text-[13px] text-text-secondary'>
                {order.name || '—'}
              </td>
              <td className='px-4 py-2.5 text-right text-[13px] tabular-nums'>
                {formatCurrency(order.total)}
              </td>
              <td className='px-4 py-2.5 text-right text-[13px] text-text-tertiary tabular-nums'>
                {formatDate(order.inv_date)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
