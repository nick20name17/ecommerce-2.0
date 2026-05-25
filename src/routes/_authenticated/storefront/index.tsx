import { createFileRoute, redirect } from '@tanstack/react-router'
import { parseAsString, useQueryState } from 'nuqs'

import { BannerSection } from './-components/banner-section'
import { IStorefront, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { isAdmin } from '@/constants/user'
import type { UserRole } from '@/constants/user'
import { getSession } from '@/helpers/auth'
import { useProjectId } from '@/hooks/use-project-id'
import { cn } from '@/lib/utils'

// ── Section definitions ─────────────────────────────────────

type StorefrontSection = 'banner'

const SECTIONS: { value: StorefrontSection; label: string }[] = [
  { value: 'banner', label: 'Banner' }
]

// ── Main component ──────────────────────────────────────────

const StorefrontPage = () => {
  const [projectId] = useProjectId()
  const [section, setSection] = useQueryState('section', parseAsString)

  const currentSection = (section ?? 'banner') as StorefrontSection

  if (!projectId) {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-5'>
        <div className='flex size-12 items-center justify-center rounded-[12px] bg-primary/[0.08] text-primary dark:bg-primary/15'>
          <IStorefront className='size-6' />
        </div>
        <div className='flex flex-col items-center gap-1.5 text-center'>
          <h1 className='text-[16px] font-semibold tracking-[-0.02em] text-foreground'>
            Storefront
          </h1>
          <p className='max-w-[280px] text-[13px] leading-snug text-text-tertiary'>
            Select a project in the sidebar to manage storefront content.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* ── Header bar ── */}
      <header className='flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-3.5 sm:px-6'>
        <SidebarTrigger className='-ml-1' />
        <PageHeaderIcon
          icon={IStorefront}
          color={PAGE_COLORS.storefront}
        />
        <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>Storefront</h1>
      </header>

      {/* Sidebar + Content */}
      <div className='flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row'>
        <nav className='flex shrink-0 gap-px overflow-x-auto border-b border-border bg-bg-secondary/40 px-3 py-1.5 md:w-[180px] md:flex-col md:overflow-x-visible md:border-b-0 md:border-r md:py-3'>
          {SECTIONS.map((s) => {
            const isActive = currentSection === s.value
            return (
              <button
                key={s.value}
                type='button'
                className={cn(
                  'flex h-[30px] shrink-0 items-center whitespace-nowrap rounded-[6px] px-2.5 text-[13px] font-medium transition-colors duration-[80ms]',
                  isActive
                    ? 'bg-bg-active text-foreground'
                    : 'text-text-tertiary hover:bg-bg-hover hover:text-foreground'
                )}
                onClick={() => setSection(s.value === 'banner' ? null : s.value)}
              >
                {s.label}
              </button>
            )
          })}
        </nav>

        <div className='flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'>
          {currentSection === 'banner' && <BannerSection projectId={projectId} />}
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/storefront/')({
  beforeLoad: () => {
    const session = getSession()
    const role = session?.user?.role as UserRole | undefined
    if (!role || !isAdmin(role)) {
      throw redirect({ to: '/', replace: true })
    }
  },
  component: StorefrontPage,
  head: () => ({
    meta: [{ title: 'Storefront' }]
  })
})
