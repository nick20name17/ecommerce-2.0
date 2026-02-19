'use client'

import { Link } from '@tanstack/react-router'
import {
  ClipboardList,
  FolderKanban,
  Home,
  Plus,
  Settings,
  Ship,
  StickyNote,
  User,
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
    title: 'Create',
    url: '/create',
    icon: Plus
  },
  {
    title: 'Projects',
    url: '/projects',
    icon: FolderKanban
  },
  {
    title: 'Users',
    url: '/users',
    icon: User
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
