import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { getTasksQuery, getTaskStatusesQuery } from '@/api/task/query'
import {
  ICustomers,
  IDashboard,
  IDev,
  IOrderDesk,
  IOrders,
  IPickLists,
  IProjects,
  IProposals,
  ISettings,
  IShipping,
  ITodos,
} from '@/components/ds'
import { isAdmin, isSuperAdmin } from '@/constants/user'
import { useProjectId } from '@/hooks/use-project-id'
import { cn } from '@/lib/utils'
import { useAuth } from '@/providers/auth'
import { GlobalSearch } from './global-search'

// ── Types ───────────────────────────────────────────────────

interface NavItem {
  title: string
  url: string
  icon: React.FC<{ className?: string }>
  iconBg?: string
  iconColor?: string
  superAdminOnly?: boolean
  adminOnly?: boolean
}

// ── Nav config ──────────────────────────────────────────────

const TOP_ITEMS: NavItem[] = [
  {
    title: 'Home',
    url: '/',
    icon: IDashboard,
    iconBg: 'bg-emerald-500',
    iconColor: 'text-white',
  },
  {
    title: 'Order Desk',
    url: '/order-desk',
    icon: IOrderDesk,
    iconBg: 'bg-orange-500',
    iconColor: 'text-white',
  },
  {
    title: 'Pick Lists',
    url: '/pick-lists',
    icon: IPickLists,
    iconBg: 'bg-teal-500',
    iconColor: 'text-white',
  },
  {
    title: 'Shipping',
    url: '/shipping',
    icon: IShipping,
    iconBg: 'bg-cyan-500',
    iconColor: 'text-white',
  },
]

const WORKSPACE_ITEMS: NavItem[] = [
  {
    title: 'Customers',
    url: '/customers',
    icon: ICustomers,
    iconBg: 'bg-blue-500',
    iconColor: 'text-white',
  },
  {
    title: 'Orders',
    url: '/orders',
    icon: IOrders,
    iconBg: 'bg-amber-500',
    iconColor: 'text-white',
  },
  {
    title: 'Proposals',
    url: '/proposals',
    icon: IProposals,
    iconBg: 'bg-rose-500',
    iconColor: 'text-white',
  },
  {
    title: "To-Do's",
    url: '/tasks',
    icon: ITodos,
    iconBg: 'bg-violet-500',
    iconColor: 'text-white',
  },
  {
    title: 'Development',
    url: '/dev',
    icon: IDev,
    iconBg: 'bg-sky-500',
    iconColor: 'text-white',
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: ISettings,
    iconBg: 'bg-zinc-500',
    iconColor: 'text-white',
    adminOnly: true,
  },
]

const BOTTOM_ITEMS: NavItem[] = [
  { title: 'Projects', url: '/projects', icon: IProjects, superAdminOnly: true },
]

// ── Hook ────────────────────────────────────────────────────

function useTaskCounts() {
  const [projectId] = useProjectId()
  const { data: statusesData } = useQuery(getTaskStatusesQuery(projectId ?? null))
  const { data: tasksData } = useQuery(getTasksQuery({ project_id: projectId ?? undefined, limit: 200 }))

  const statuses = statusesData?.results ?? []
  const tasks = tasksData?.results ?? []

  const doneStatusIds = new Set(
    statuses.filter((s) => /done|completed|finished/i.test(s.name)).map((s) => s.id),
  )

  const pendingCount = tasks.filter((t) => !doneStatusIds.has(t.status)).length

  return { pendingCount }
}

// ── Colored icon link (top + workspace items) ───────────────

const ColoredNavLink = ({
  item,
  badge,
}: {
  item: NavItem
  badge?: number
}) => (
  <Link
    to={item.url}
    className={cn(
      'group/nav flex h-[30px] items-center gap-2.5 rounded-md px-2.5 text-[13px]',
      'transition-[background-color,color,transform] duration-100',
      '[&.active]:bg-black/[0.06] [&.active]:font-medium [&.active]:text-foreground',
      'dark:[&.active]:bg-white/[0.08]',
      '[&:not(.active)]:text-foreground/90 [&:not(.active)]:hover:bg-black/[0.04]',
      'dark:[&:not(.active)]:hover:bg-white/[0.04]',
      'active:scale-[0.98]',
    )}
  >
    <div
      className={cn(
        'flex size-[20px] shrink-0 items-center justify-center rounded-[5px]',
        item.iconBg,
        item.iconColor,
      )}
    >
      <item.icon className='size-[13px]' />
    </div>
    <span className='flex-1 truncate'>{item.title}</span>
    {badge != null && badge > 0 && (
      <span className='min-w-[20px] rounded-full bg-violet-500/15 px-1.5 text-center text-[13px] font-semibold tabular-nums text-violet-600 dark:bg-violet-500/20 dark:text-violet-400'>
        {badge}
      </span>
    )}
  </Link>
)

// ── Plain icon link (bottom utility items) ──────────────────

const PlainNavLink = ({ item }: { item: NavItem }) => (
  <Link
    to={item.url}
    className={cn(
      'group/nav flex h-[30px] items-center gap-2.5 rounded-md px-2.5 text-[13px]',
      'transition-[background-color,color,transform] duration-100',
      '[&.active]:bg-black/[0.06] [&.active]:font-medium [&.active]:text-foreground',
      'dark:[&.active]:bg-white/[0.08]',
      '[&:not(.active)]:text-foreground/90 [&:not(.active)]:hover:bg-black/[0.04]',
      'dark:[&:not(.active)]:hover:bg-white/[0.04]',
      'active:scale-[0.98]',
    )}
  >
    <div className='flex size-[20px] shrink-0 items-center justify-center'>
      <item.icon className='size-[15px] text-text-tertiary group-[.active]/nav:text-foreground/70' />
    </div>
    <span className='flex-1 truncate'>{item.title}</span>
  </Link>
)

// ── Component ───────────────────────────────────────────────

export const NavMain = () => {
  const { user } = useAuth()
  const userIsSuperAdmin = !!user?.role && isSuperAdmin(user.role)
  const userIsAdmin = !!user?.role && isAdmin(user.role)
  const { pendingCount } = useTaskCounts()

  const filterItems = (items: NavItem[]) =>
    items.filter((item) => {
      if (item.superAdminOnly && !userIsSuperAdmin) return false
      if (item.adminOnly && !userIsAdmin) return false
      return true
    })

  const filteredTop = filterItems(TOP_ITEMS)
  const filteredWorkspace = filterItems(WORKSPACE_ITEMS)
  const filteredBottom = filterItems(BOTTOM_ITEMS)

  return (
    <div className='flex flex-1 flex-col px-3'>
      {/* Global search */}
      <div className='pt-2 pb-2'>
        <GlobalSearch />
      </div>

      {/* Top items — colored icons */}
      <div className='flex flex-col gap-px'>
        {filteredTop.map((item) => (
          <ColoredNavLink key={item.title} item={item} />
        ))}
      </div>

      {/* Workspace section — colored square icons */}
      <div className='my-2 border-t border-black/[0.06] dark:border-white/[0.06]' />
      <div className='flex flex-col gap-px'>
        {filteredWorkspace.map((item) => (
          <ColoredNavLink
            key={item.title}
            item={item}
            badge={item.url === '/tasks' ? pendingCount : undefined}
          />
        ))}
      </div>

      {/* Spacer */}
      <div className='flex-1' />

      {/* Bottom utility items — plain gray icons */}
      <div className='flex flex-col gap-px pb-3'>
        {filteredBottom.map((item) => (
          <PlainNavLink key={item.title} item={item} />
        ))}
      </div>
    </div>
  )
}
