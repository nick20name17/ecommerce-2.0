import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Rocket,
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Users,
  Package,
  Truck,
  CheckSquare,
  Settings,
} from 'lucide-react'

interface SidebarLink {
  label: string
  href: string
}

interface SidebarSection {
  title: string
  icon: LucideIcon
  links: SidebarLink[]
}

const sections: SidebarSection[] = [
  {
    title: 'Getting Started',
    icon: Rocket,
    links: [
      { label: 'Introduction', href: '/getting-started' },
      { label: 'Quick Start', href: '/getting-started/quick-start' },
      { label: 'Key Concepts', href: '/getting-started/key-concepts' },
      { label: 'Navigation & Layout', href: '/getting-started/navigation' },
    ],
  },
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    links: [
      { label: 'Overview', href: '/dashboard' },
      { label: 'Widgets & Metrics', href: '/dashboard/widgets' },
      { label: 'Activity Feed', href: '/dashboard/activity' },
    ],
  },
  {
    title: 'Orders',
    icon: ShoppingCart,
    links: [
      { label: 'Overview', href: '/orders' },
      { label: 'Creating Orders', href: '/orders/creating' },
      { label: 'Order Lifecycle', href: '/orders/lifecycle' },
      { label: 'Line Items', href: '/orders/line-items' },
      { label: 'Payments', href: '/orders/payments' },
      { label: 'Assign & Collaborate', href: '/orders/assign' },
    ],
  },
  {
    title: 'Proposals',
    icon: FileText,
    links: [
      { label: 'Overview', href: '/proposals' },
      { label: 'Creating Proposals', href: '/proposals/creating' },
      { label: 'Proposal Workflow', href: '/proposals/workflow' },
      { label: 'Converting to Orders', href: '/proposals/converting' },
      { label: 'Assign & Collaborate', href: '/proposals/assign' },
    ],
  },
  {
    title: 'Customers',
    icon: Users,
    links: [
      { label: 'Overview', href: '/customers' },
      { label: 'Managing Customers', href: '/customers/managing' },
      { label: 'Customer Details', href: '/customers/details' },
      { label: 'Addresses & Contacts', href: '/customers/addresses' },
    ],
  },
  {
    title: 'Products & Catalog',
    icon: Package,
    links: [
      { label: 'Overview', href: '/products' },
      { label: 'Product Catalog', href: '/products/catalog' },
      { label: 'Categories', href: '/products/categories' },
      { label: 'Pricing', href: '/products/pricing' },
    ],
  },
  {
    title: 'Picking & Shipping',
    icon: Truck,
    links: [
      { label: 'Pick Lists', href: '/picking' },
      { label: 'Creating Pick Lists', href: '/picking/creating' },
      { label: 'Shipping Overview', href: '/shipping' },
      { label: 'Shipments & Tracking', href: '/shipping/tracking' },
    ],
  },
  {
    title: 'Web Tasks',
    icon: CheckSquare,
    links: [
      { label: 'Overview', href: '/tasks' },
      { label: 'Creating Tasks', href: '/tasks/creating' },
      { label: 'Task Board', href: '/tasks/board' },
    ],
  },
  {
    title: 'Settings',
    icon: Settings,
    links: [
      { label: 'Overview', href: '/settings' },
      { label: 'Users & Permissions', href: '/settings/users' },
      { label: 'Company Settings', href: '/settings/company' },
      { label: 'Integrations', href: '/settings/integrations' },
    ],
  },
]

interface SidebarProps {
  onNavigate?: () => void
}

function SidebarSectionGroup({ section, onNavigate }: { section: SidebarSection; onNavigate?: () => void }) {
  const [open, setOpen] = useState(true)
  const Icon = section.icon

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <Icon size={14} className="shrink-0 text-text-tertiary transition-colors group-hover:text-muted-foreground" />
        <span className="flex-1">{section.title}</span>
        <ChevronRight
          size={12}
          className={`shrink-0 text-text-tertiary transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
        />
      </button>

      {open && (
        <ul className="ml-[22px] border-l border-border-light pl-0">
          {section.links.map((link) => (
            <li key={link.href}>
              <NavLink
                to={link.href}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `block border-l-[1.5px] py-1 pl-3 text-[13px] transition-colors ${
                    isActive
                      ? 'border-accent font-medium text-accent'
                      : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                  }`
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {sections.map((section) => (
        <SidebarSectionGroup key={section.title} section={section} onNavigate={onNavigate} />
      ))}
    </nav>
  )
}
