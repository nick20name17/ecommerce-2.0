import { Link } from '@tanstack/react-router'
import {
  CheckSquare,
  ClipboardList,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  UsersRound
} from 'lucide-react'

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'
import { isSuperAdmin } from '@/constants/user'
import { useAuth } from '@/providers/auth'

const NAV_ITEMS = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Projects', url: '/projects', icon: FolderKanban, superAdminOnly: true },
  { title: 'Customers', url: '/customers', icon: UsersRound },
  { title: 'Users', url: '/users', icon: Users },
  { title: 'Orders', url: '/orders', icon: ShoppingCart },
  { title: 'Proposals', url: '/proposals', icon: FileText },
  { title: "To-Do's", url: '/tasks', icon: CheckSquare },
  { title: 'Order Desk', url: '/create', icon: ClipboardList },
  { title: 'Shipping', url: '/shipping', icon: Truck },
  // { title: 'Notes', url: '/notes', icon: StickyNote },
  { title: 'Settings', url: '/settings', icon: Settings }
] as const

export const NavMain = () => {
  const { user } = useAuth()
  const userIsSuperAdmin = !!user?.role && isSuperAdmin(user.role)
  const items = NAV_ITEMS.filter((item) => !('superAdminOnly' in item && item.superAdminOnly) || userIsSuperAdmin)

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              tooltip={item.title}
              asChild
            >
              <Link
                className='[.active]:bg-primary [.active]:text-primary-foreground'
                to={item.url}
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
