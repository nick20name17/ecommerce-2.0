import { ORDER_QUERY_KEYS } from '@/api/order/query'
import type { Order } from '@/api/order/schema'
import { orderService } from '@/api/order/service'
import { MultiAssignDialog } from '@/components/common/multi-assign-dialog'

interface OrderAssignDialogProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId?: number | null
}

export const OrderAssignDialog = ({
  order,
  open,
  onOpenChange,
  projectId,
}: OrderAssignDialogProps) => {
  if (!order) return null

  return (
    <MultiAssignDialog
      open={open}
      onOpenChange={onOpenChange}
      entityLabel={`order ${order.invoice ?? order.autoid}`}
      assignedUsers={order.assigned_users ?? (order.assigned_user ? [order.assigned_user] : [])}
      assignFn={(payload) => orderService.assign(order.autoid, payload, projectId)}
      invalidateQueryKey={ORDER_QUERY_KEYS.all()}
      projectId={projectId}
    />
  )
}
