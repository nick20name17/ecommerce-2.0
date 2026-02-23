import { Badge } from '@/components/ui/badge'
import { getUserRoleLabel, USER_ROLES } from '@/constants/user'
import type { UserRole } from '@/constants/user'
import { cn } from '@/lib/utils'

const roleColorClasses: Record<UserRole, string> = {
  [USER_ROLES.superadmin]:
    'bg-role-superadmin/15 text-role-superadmin dark:bg-role-superadmin/25',
  [USER_ROLES.admin]:
    'bg-role-admin/15 text-role-admin dark:bg-role-admin/25',
  [USER_ROLES.sale]:
    'bg-role-sale/15 text-role-sale dark:bg-role-sale/25',
  [USER_ROLES.manager]:
    'bg-role-manager/15 text-role-manager dark:bg-role-manager/25',
}

interface RoleBadgeProps {
  role: UserRole
  className?: string
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <Badge className={cn(roleColorClasses[role], className)}>
      {getUserRoleLabel(role)}
    </Badge>
  )
}
