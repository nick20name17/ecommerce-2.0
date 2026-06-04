import { useQuery } from '@tanstack/react-query'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { AlertCircle, ChevronRight, Send } from 'lucide-react'

import { getPushStatusOverviewQuery } from '@/api/push-status/query'
import type { PushStatusLiveState, PushStatusOverviewRow } from '@/api/push-status/schema'
import { PageEmpty } from '@/components/common/page-empty'
import { IStorefront, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { isSuperAdmin } from '@/constants/user'
import type { UserRole } from '@/constants/user'
import { getSession } from '@/helpers/auth'
import { formatDateTimeShort } from '@/helpers/formatters'
import { useProjectId } from '@/hooks/use-project-id'
import { cn } from '@/lib/utils'

const dt = (s: string | null) => (s ? formatDateTimeShort(s) : '—')

// Non-ok live states render a badge in the In-flight column; ok renders the count.
const LIVE_STATE_BADGE: Record<PushStatusLiveState, { label: string; cls: string } | null> = {
  ok: null,
  unreachable: {
    label: 'Unreachable',
    cls: 'bg-red-500/10 text-red-700 border-red-200 dark:text-red-400 dark:border-red-800'
  },
  error: {
    label: 'Error',
    cls: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-800'
  },
  unsupported: {
    label: 'Sync (no queue)',
    cls: 'bg-bg-secondary text-text-tertiary border-border'
  },
  not_configured: {
    label: 'Not configured',
    cls: 'bg-bg-secondary text-text-tertiary border-border'
  }
}

function PushStatusOverviewPage() {
  const navigate = useNavigate()
  const [, setProjectId] = useProjectId()

  const { data, isLoading, isPlaceholderData, error } = useQuery({
    ...getPushStatusOverviewQuery(),
    retry: false
  })

  const rows = data?.results ?? []

  // Click-through: switch the active project, then open its live push-status.
  const openProject = (row: PushStatusOverviewRow) => {
    setProjectId(row.project_id)
    navigate({ to: '/website', search: { section: 'push-status' } })
  }

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      <header className='flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-3.5 sm:px-6'>
        <SidebarTrigger className='-ml-1' />
        <PageHeaderIcon icon={IStorefront} color={PAGE_COLORS.storefront} />
        <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>Push Status</h1>
        {isPlaceholderData && <Spinner className='size-3 text-text-tertiary' />}
        <span className='ml-auto text-[12px] text-text-tertiary'>
          {rows.length > 0 && `${rows.length} project${rows.length === 1 ? '' : 's'}`}
        </span>
      </header>

      <div className='flex-1 overflow-y-auto'>
        {error ? (
          <PageEmpty
            icon={Send}
            title='Failed to load'
            description='Could not load the cross-project push-status overview.'
          />
        ) : (
          <>
            <div className='sticky top-0 z-10 flex items-center gap-6 border-b border-border bg-bg-secondary px-6 py-1 text-[13px] font-medium text-text-tertiary select-none'>
              <div className='min-w-0 flex-1'>Project</div>
              <div className='w-32 shrink-0 text-right'>In-flight</div>
              <div className='w-24 shrink-0 text-right'>Errors 7d</div>
              <div className='w-40 shrink-0'>Last attempt</div>
              <div className='w-5 shrink-0' />
            </div>

            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className='flex items-center gap-6 border-b border-border-light px-6 py-2.5'
                >
                  <Skeleton className='h-3.5 w-40 flex-1 rounded' />
                  <Skeleton className='h-3.5 w-12 rounded' />
                  <Skeleton className='h-3.5 w-10 rounded' />
                  <Skeleton className='h-3.5 w-28 rounded' />
                </div>
              ))
            ) : rows.length === 0 ? (
              <PageEmpty icon={Send} title='No projects' description='Nothing to show.' />
            ) : (
              rows.map(row => (
                <OverviewRow key={row.project_id} row={row} onClick={() => openProject(row)} />
              ))
            )}
          </>
        )}
      </div>
    </div>
  )
}

function OverviewRow({ row, onClick }: { row: PushStatusOverviewRow; onClick: () => void }) {
  const badge = LIVE_STATE_BADGE[row.live_state]
  const hasInFlight = row.live_state === 'ok' && (row.in_flight ?? 0) > 0
  const hasErrors = row.errors_recent > 0
  const isProblem = row.live_state === 'unreachable' || row.live_state === 'error'

  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'group/row flex w-full items-center gap-6 border-b border-border-light px-6 py-2.5 text-left transition-colors duration-100 hover:bg-bg-hover',
        isProblem && 'bg-red-500/[0.02]'
      )}
    >
      <div className='flex min-w-0 flex-1 items-center gap-1.5'>
        {isProblem && <AlertCircle className='size-3 shrink-0 text-red-500' />}
        <span className='truncate text-[13px] font-medium text-foreground'>
          {row.project_name}
        </span>
      </div>
      <div className='w-32 shrink-0 text-right'>
        {row.live_state === 'ok' ? (
          <span
            className={cn(
              'text-[13px] tabular-nums',
              hasInFlight ? 'font-medium text-amber-700 dark:text-amber-400' : 'text-text-tertiary'
            )}
          >
            {row.in_flight}
          </span>
        ) : badge ? (
          <span
            className={cn(
              'inline-block rounded border px-1.5 py-0.5 text-[11px] font-medium',
              badge.cls
            )}
          >
            {badge.label}
          </span>
        ) : (
          <span className='text-text-tertiary'>—</span>
        )}
      </div>
      <div
        className={cn(
          'w-24 shrink-0 text-right text-[13px] tabular-nums',
          hasErrors ? 'font-medium text-red-700 dark:text-red-400' : 'text-text-tertiary'
        )}
      >
        {row.errors_recent}
      </div>
      <div className='w-40 shrink-0 truncate text-[12px] tabular-nums text-text-tertiary'>
        {dt(row.last_attempt_at)}
      </div>
      <div className='w-5 shrink-0 text-text-tertiary opacity-0 transition-opacity group-hover/row:opacity-100'>
        <ChevronRight className='size-3.5' />
      </div>
    </button>
  )
}

export const Route = createFileRoute('/_authenticated/push-status/')({
  beforeLoad: () => {
    const session = getSession()
    const role = session?.user?.role as UserRole | undefined
    if (!role || !isSuperAdmin(role)) {
      throw redirect({ to: '/', replace: true })
    }
  },
  component: PushStatusOverviewPage,
  head: () => ({
    meta: [{ title: 'Push Status' }]
  })
})
