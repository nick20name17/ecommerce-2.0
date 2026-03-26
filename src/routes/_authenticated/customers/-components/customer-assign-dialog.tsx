import { CUSTOMER_QUERY_KEYS } from '@/api/customer/query'
import type { Customer } from '@/api/customer/schema'
import { customerService } from '@/api/customer/service'
import { MultiAssignDialog } from '@/components/common/multi-assign-dialog'

interface CustomerAssignDialogProps {
  customer: Customer | null
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId?: number | null
}

export const CustomerAssignDialog = ({
  customer,
  open,
  onOpenChange,
  projectId,
}: CustomerAssignDialogProps) => {
  if (!customer) return null

  return (
    <MultiAssignDialog
      open={open}
      onOpenChange={onOpenChange}
      entityLabel={customer.l_name}
      assignedUsers={customer.assigned_users ?? (customer.assigned_user ? [customer.assigned_user] : [])}
      assignFn={(payload) => customerService.assign(customer.autoid, payload, projectId)}
      invalidateQueryKey={CUSTOMER_QUERY_KEYS.all()}
      projectId={projectId}
    />
  )
}
