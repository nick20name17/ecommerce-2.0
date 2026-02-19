'use client'

import { Link } from '@tanstack/react-router'
import {
  CheckSquare,
  ClipboardList,
  FolderKanban,
  Home,
  Settings,
  Ship,
  ShoppingCart,
  StickyNote,
  User,
  Users,
} from 'lucide-react'

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'

const NAV_ITEMS = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: Home
  },
  {
    title: 'Projects',
    url: '/projects',
    icon: FolderKanban
  },
  {
    title: 'Customers',
    url: '/customers',
    icon: Users
  },
  {
    title: 'Users',
    url: '/users',
    icon: User
  },
  {
    title: 'Orders',
    url: '/orders',
    icon: ShoppingCart
  },
  {
    title: 'Tasks',
    url: '/tasks',
    icon: CheckSquare
  },
  {
    title: 'Order Desk',
    url: '/order-desk',
    icon: ClipboardList
  },
  {
    title: 'Shipping',
    url: '/shipping',
    icon: Ship
  },
  {
    title: 'Notes',
    url: '/notes',
    icon: StickyNote
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings
  },
] as const

export const NavMain = () => {
  return (
    <SidebarGroup>
      {/* <SidebarGroupLabel>Platform</SidebarGroupLabel> */}
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
