export const USER_ROLES = {
  superadmin: 'superadmin',
  admin: 'admin',
  sale: 'sale',
  manager: 'manager'
} as const

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [USER_ROLES.superadmin]: 'Super Admin',
  [USER_ROLES.admin]: 'Admin',
  [USER_ROLES.sale]: 'Sale',
  [USER_ROLES.manager]: 'Manager'
}

export const getUserRoleLabel = (role: UserRole): string =>
  USER_ROLE_LABELS[role] ?? role

export const isSuperAdmin = (role: UserRole): boolean =>
  role === USER_ROLES.superadmin

export const isAdmin = (role: UserRole): boolean =>
  role === USER_ROLES.admin || role === USER_ROLES.superadmin
