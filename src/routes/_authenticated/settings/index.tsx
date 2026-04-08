import { createFileRoute, redirect } from '@tanstack/react-router'
import { parseAsString, useQueryState } from 'nuqs'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { CatalogSection } from './-components/catalog-section'
import { DataControlSection } from './-components/data-control-section'
import { FilterGroupsSection } from './-components/filter-groups-section'
import { GeneralSection } from './-components/general-section'
import { ShippingSection } from './-components/shipping-section'
import { TasksSection } from './-components/tasks-section'
import { UsersSection } from './-components/users-section'
import { ISettings, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import { isAdmin } from '@/constants/user'
import type { UserRole } from '@/constants/user'
import { getSession } from '@/helpers/auth'
import { useProjectId } from '@/hooks/use-project-id'
import { cn } from '@/lib/utils'
import { useAuth } from '@/providers/auth'

// ── Section definitions ─────────────────────────────────────

type SettingsSection = 'general' | 'data-control' | 'filters' | 'tasks' | 'shipping' | 'users' | 'catalog'

const SECTIONS: { value: SettingsSection; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'data-control', label: 'Data Control' },
  { value: 'filters', label: 'Filters' },
  { value: 'tasks', label: 'Statuses' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'catalog', label: 'Catalog Setup' },
  { value: 'users', label: 'Users' },
]

// ── Main component ──────────────────────────────────────────

const SettingsPage = () => {
  const [projectId] = useProjectId()
  const { user } = useAuth()
  const shippingEnabled = user?.shipping_enabled === true
  const [section, setSection] = useQueryState('section', parseAsString)

  const visibleSections = shippingEnabled ? SECTIONS : SECTIONS.filter(s => s.value !== 'shipping')
  const currentSection = (section ?? 'general') as SettingsSection

  if (!projectId) {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-5'>
        <div className='flex size-12 items-center justify-center rounded-[12px] bg-primary/[0.08] text-primary dark:bg-primary/15'>
          <ISettings className='size-6' />
        </div>
        <div className='flex flex-col items-center gap-1.5 text-center'>
          <h1 className='text-[16px] font-semibold tracking-[-0.02em] text-foreground'>Settings</h1>
          <p className='max-w-[280px] text-[13px] leading-snug text-text-tertiary'>Select a project in the sidebar to manage settings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* ── Header bar ── */}
      <header className='flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-6'>
        <SidebarTrigger className='-ml-1' />
        <PageHeaderIcon icon={ISettings} color={PAGE_COLORS.settings} />
        <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>Settings</h1>
      </header>

      {/* Sidebar + Content */}
      <div className='flex min-h-0 flex-1 overflow-hidden'>
        {/* Vertical sidebar tabs */}
        <nav className='flex w-[180px] shrink-0 flex-col gap-px border-r border-border bg-bg-secondary/40 px-3 py-3'>
          {visibleSections.map((s) => {
            const isActive = currentSection === s.value
            return (
              <button
                key={s.value}
                type='button'
                className={cn(
                  'flex h-[30px] items-center rounded-[6px] px-2.5 text-[13px] font-medium transition-colors duration-[80ms]',
                  isActive
                    ? 'bg-bg-active text-foreground'
                    : 'text-text-tertiary hover:bg-bg-hover hover:text-foreground'
                )}
                onClick={() => setSection(s.value === 'general' ? null : s.value)}
              >
                {s.label}
              </button>
            )
          })}
        </nav>

        {/* Content */}
        <div className='flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'>
          {currentSection === 'general' && <GeneralSection projectId={projectId} />}
          {currentSection === 'data-control' && <DataControlSection projectId={projectId} />}
          {currentSection === 'filters' && <FilterGroupsSection />}
          {currentSection === 'tasks' && <TasksSection projectId={projectId} />}
          {currentSection === 'shipping' && <ShippingSection projectId={projectId} />}
          {currentSection === 'catalog' && <CatalogSection projectId={projectId} />}
          {currentSection === 'users' && <UsersSection />}
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/settings/')({
  beforeLoad: () => {
    const session = getSession()
    const role = session?.user?.role as UserRole | undefined
    if (!role || !isAdmin(role)) {
      throw redirect({ to: '/', replace: true })
    }
  },
  component: SettingsPage,
  head: () => ({
    meta: [{ title: 'Settings' }]
  })
})
