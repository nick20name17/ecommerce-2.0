import { Link } from '@tanstack/react-router'
import {
  CheckSquare,
  ClipboardList,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Settings,
  ShoppingCart,
  StickyNote,
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

const NAV_ITEMS = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Projects', url: '/projects', icon: FolderKanban },
  { title: 'Customers', url: '/customers', icon: UsersRound },
  { title: 'Users', url: '/users', icon: Users },
  { title: 'Orders', url: '/orders', icon: ShoppingCart },
  { title: 'Proposals', url: '/proposals', icon: FileText },
  { title: 'Tasks', url: '/tasks', icon: CheckSquare },
  { title: 'Order Desk', url: '/order-desk', icon: ClipboardList },
  { title: 'Shipping', url: '/shipping', icon: Truck },
  { title: 'Notes', url: '/notes', icon: StickyNote },
  { title: 'Settings', url: '/settings', icon: Settings }
] as const

export const NavMain = () => {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {NAV_ITEMS.map((item) => (
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
