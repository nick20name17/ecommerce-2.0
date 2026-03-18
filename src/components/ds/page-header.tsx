import { cn } from '@/lib/utils'

interface PageHeaderIconProps {
  icon: React.FC<{ className?: string }>
  color: string
}

/**
 * Colored icon badge for page headers.
 * Renders an icon inside a tinted background circle matching the page's accent color.
 */
export function PageHeaderIcon({ icon: Icon, color }: PageHeaderIconProps) {
  return (
    <div className={cn('flex size-[22px] shrink-0 items-center justify-center rounded-[6px]', color)}>
      <Icon className='size-[13px] text-white' />
    </div>
  )
}

/** Standard page header colors — keep in sync with sidebar nav colors */
export const PAGE_COLORS = {
  dashboard: 'bg-emerald-500',
  orderDesk: 'bg-orange-500',
  shipping: 'bg-cyan-500',
  customers: 'bg-blue-500',
  orders: 'bg-amber-500',
  proposals: 'bg-rose-500',
  todos: 'bg-violet-500',
  projects: 'bg-slate-500',
  settings: 'bg-zinc-500',
  users: 'bg-indigo-500',
  profile: 'bg-zinc-500',
  testing: 'bg-gray-500',
  dev: 'bg-sky-500',
} as const
