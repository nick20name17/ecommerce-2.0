import { USER_ROLES, getUserRoleLabel } from '@/constants/user'
import type { UserRole } from '@/constants/user'
import { cn } from '@/lib/utils'

const roleDotColors: Record<UserRole, string> = {
  [USER_ROLES.superadmin]: 'bg-role-superadmin',
  [USER_ROLES.admin]: 'bg-role-admin',
  [USER_ROLES.sale]: 'bg-role-sale',
  [USER_ROLES.manager]: 'bg-role-manager'
}

const roleTextColors: Record<UserRole, string> = {
  [USER_ROLES.superadmin]: 'text-role-superadmin',
  [USER_ROLES.admin]: 'text-role-admin',
  [USER_ROLES.sale]: 'text-role-sale',
  [USER_ROLES.manager]: 'text-role-manager'
}

interface RoleBadgeProps {
  role: UserRole
  className?: string
}

export const RoleBadge = ({ role, className }: RoleBadgeProps) => {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[12px] font-semibold', roleTextColors[role], className)}>
      <span className={cn('size-2 rounded-full', roleDotColors[role])} />
      {getUserRoleLabel(role)}
    </span>
  )
}
