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

      {/* Desktop table (sm+) */}
      <div className='hidden overflow-x-auto sm:block'>
        <table className='w-full'>
          <thead>
            <tr className='border-t border-border text-[12px] text-text-tertiary'>
              <th className='px-3 py-2 text-left font-medium sm:px-4'>Status</th>
              <th className='px-3 py-2 text-left font-medium sm:px-4'>Invoice</th>
              <th className='hidden px-3 py-2 text-left font-medium md:table-cell'>Name</th>
              <th className='px-3 py-2 text-right font-medium sm:px-4'>Total</th>
              <th className='px-3 py-2 text-right font-medium sm:px-4'>Date</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-border'>
            {orders.map((order) => (
              <tr key={order.autoid}>
                <td className='px-3 py-2.5 sm:px-4'>
                  <div className='flex items-center gap-2'>
                    <StatusIcon
                      status={ORDER_STATUS_LABELS[order.status]}
                      color={STATUS_COLORS[order.status]}
                      size={14}
                    />
                    <span className='hidden text-[13px] text-text-tertiary lg:inline'>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                </td>
                <td className='px-3 py-2.5 sm:px-4'>
                  <Link
                    to='/orders/$orderId'
                    params={{ orderId: order.autoid }}
                    className='whitespace-nowrap text-[13px] font-medium text-text-primary hover:underline'
                  >
                    {order.invoice || order.id}
                  </Link>
                </td>
                <td className='hidden max-w-[200px] truncate px-3 py-2.5 text-[13px] text-text-secondary md:table-cell'>
                  {order.name || '—'}
                </td>
                <td className='whitespace-nowrap px-3 py-2.5 text-right text-[13px] tabular-nums sm:px-4'>
                  {formatCurrency(order.total)}
                </td>
                <td className='whitespace-nowrap px-3 py-2.5 text-right text-[13px] text-text-tertiary tabular-nums sm:px-4'>
                  {formatDate(order.inv_date)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked list */}
      <div className='divide-y divide-border sm:hidden'>
        {orders.map((order) => (
          <Link
            key={order.autoid}
            to='/orders/$orderId'
            params={{ orderId: order.autoid }}
            className='flex items-center gap-3 px-4 py-2.5 transition-colors duration-100 hover:bg-bg-hover'
          >
            <StatusIcon
              status={ORDER_STATUS_LABELS[order.status]}
              color={STATUS_COLORS[order.status]}
              size={14}
            />
            <div className='min-w-0 flex-1'>
              <div className='flex items-center gap-2'>
                <span className='text-[13px] font-medium text-foreground'>
                  {order.invoice || order.id}
                </span>
                <span className='text-[12px] text-text-tertiary'>
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
              </div>
              <div className='flex items-center gap-2 text-[12px] text-text-tertiary'>
                {order.name && (
                  <span className='truncate'>{order.name}</span>
                )}
                {order.name && order.inv_date && <span>·</span>}
                {order.inv_date && (
                  <span className='shrink-0 tabular-nums'>{formatDate(order.inv_date)}</span>
                )}
              </div>
            </div>
            <span className='shrink-0 text-[13px] font-medium tabular-nums'>
              {formatCurrency(order.total)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
