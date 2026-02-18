export const USER_ROLES = {
  superadmin: 'superadmin',
  admin: 'admin',
  sale: 'sale',
  manager: 'manager',
  user: 'user',
} as const

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [USER_ROLES.superadmin]: 'Super Admin',
  [USER_ROLES.admin]: 'Admin',
  [USER_ROLES.sale]: 'Sale',
  [USER_ROLES.manager]: 'Manager',
  [USER_ROLES.user]: 'User',
}

export function getUserRoleLabel(role: UserRole): string {
  return USER_ROLE_LABELS[role] ?? role
}

export function isSuperAdmin(role: UserRole): boolean {
  return role === USER_ROLES.superadmin
}

export function isAdmin(role: UserRole): boolean {
  return role === USER_ROLES.admin || role === USER_ROLES.superadmin
}
