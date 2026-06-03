import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { AlertCircle, Inbox, Search, Send } from 'lucide-react'
import { useDeferredValue, useState } from 'react'

import { getPushStatusQuery } from '@/api/push-status/query'
import type { PushStatusItem, PushStatusParams } from '@/api/push-status/schema'
import { Pagination } from '@/components/common/filters/pagination'
import { PageEmpty } from '@/components/common/page-empty'
import { IStorefront, PageHeaderIcon } from '@/components/ds'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTimeShort } from '@/helpers/formatters'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { useProjectId } from '@/hooks/use-project-id'
import { useLimitParam, useOffsetParam } from '@/hooks/use-query-params'
import { cn } from '@/lib/utils'

// ── Helpers ──────────────────────────────────────────────────

function money(n: number | null | undefined) {
  if (n == null) return '—'
  return `$${n.toFixed(2)}`
}

const dt = (s: string | null | undefined) => (s ? formatDateTimeShort(s) : '—')

// arinv_status drives the badge. `status` (the ARQT side) is always
// "finished" — a no-op stub on every storefront — so the real lifecycle
// lives on arinv_status. Anything not "finished" lands here.
const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  error: {
    label: 'Error',
    cls: 'bg-red-500/10 text-red-700 border-red-200 dark:text-red-400 dark:border-red-800',
  },
  'in process': {
    label: 'In process',
    cls: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-800',
  },
  // approved + before process = the worker never picked it up = silently stuck
  'before process': {
    label: 'Stuck (queued)',
    cls: 'bg-violet-500/10 text-violet-700 border-violet-200 dark:text-violet-400 dark:border-violet-800',
  },
}

function statusStyle(s: string) {
  return (
    STATUS_STYLE[s] ?? {
      label: s,
      cls: 'bg-bg-secondary text-text-secondary border-border',
    }
  )
}

const ROW_GRID =
  'grid grid-cols-[80px_minmax(0,1.2fr)_130px_84px_96px_132px_124px_minmax(0,1.4fr)] items-center gap-4 min-w-[1040px]'

// ── Page Component ───────────────────────────────────────────

const PushStatusPage = () => {
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const [projectId] = useProjectId()
  const [offset, setOffset] = useOffsetParam()
  const [limit] = useLimitParam()

  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)

  const params: PushStatusParams = {
    offset,
    limit,
    ordering: '-updated_at',
    search: deferredSearch || undefined,
    project_id: projectId ?? undefined,
  }

  const { data, isLoading } = useQuery({
    ...getPushStatusQuery(params),
    placeholderData: keepPreviousData,
  })

  const supported = data?.supported ?? true
  const results = data?.results ?? []
  const totalCount = data?.count ?? 0

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* Header */}
      <header className='flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-3.5 sm:px-6'>
        <SidebarTrigger className='-ml-1' />
        <PageHeaderIcon icon={IStorefront} color='bg-red-500' />
        <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>
          Push Status
        </h1>
        {!isLoading && supported && (
          <span className='text-[13px] tabular-nums text-text-tertiary'>
            {totalCount}
          </span>
        )}

        <div className='flex-1' />

        {supported && (
          <div className='flex items-center gap-1.5 rounded-[6px] border border-border bg-background px-2.5 py-1.5'>
            <Search className='size-3.5 shrink-0 text-text-tertiary' />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setOffset(null)
              }}
              placeholder='Proposal id or autoid...'
              className='w-[140px] bg-transparent text-[13px] outline-none placeholder:text-text-tertiary sm:w-[200px]'
            />
          </div>
        )}
      </header>

      {/* Body */}
      <div className='flex-1 overflow-auto'>
        {!supported ? (
          <PageEmpty
            icon={Inbox}
            title='No live push queue'
            description='This storefront pushes orders to EBMS synchronously — there is no async queue, retry, or stuck state to show. Push attempts are visible in Activity (filter Source = Storefront).'
          />
        ) : (
          <>
            {/* Column headers */}
            {!isMobile && (results.length > 0 || isLoading) && (
              <div
                className={cn(
                  ROW_GRID,
                  'sticky top-0 z-10 border-b border-border bg-bg-secondary px-5 py-1.5 xl:px-6',
                )}
              >
                <div className='text-[12px] font-medium text-text-tertiary'>
                  Proposal
                </div>
                <div className='min-w-0 text-[12px] font-medium text-text-tertiary'>
                  Customer
                </div>
                <div className='text-[12px] font-medium text-text-tertiary'>
                  Status
                </div>
                <div className='text-[12px] font-medium text-text-tertiary'>
                  Items
                </div>
                <div className='text-right text-[12px] font-medium text-text-tertiary'>
                  Total
                </div>
                <div className='text-[12px] font-medium text-text-tertiary'>
                  Last attempt
                </div>
                <div className='text-[12px] font-medium text-text-tertiary'>
                  Next retry
                </div>
                <div className='min-w-0 text-[12px] font-medium text-text-tertiary'>
                  Last error
                </div>
              </div>
            )}
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className='flex min-w-fit items-center gap-4 border-b border-border-light px-5 py-2.5 xl:px-6'
                >
                  <Skeleton className='h-4 w-10' />
                  <Skeleton className='h-4 w-40 flex-1' />
                  <Skeleton className='h-5 w-20' />
                  <Skeleton className='h-4 w-12' />
                  <Skeleton className='h-4 w-16' />
                  <Skeleton className='h-4 w-24' />
                </div>
              ))
            ) : results.length === 0 ? (
              <PageEmpty
                icon={Send}
                title='Nothing in flight'
                description='No approved orders are pending, stuck, or failed — everything has pushed to EBMS.'
              />
            ) : (
              results.map((row) => (
                <PushRow
                  key={row.proposal_id}
                  row={row}
                  isMobile={isMobile}
                />
              ))
            )}
          </>
        )}
      </div>

      {/* Pagination footer */}
      {supported && (
        <div className='shrink-0 border-t border-border py-1.5 px-3.5 sm:px-6'>
          <Pagination totalCount={totalCount} />
        </div>
      )}
    </div>
  )
}

// ── Row ─────────────────────────────────────────────────────

function PushRow({ row, isMobile }: { row: PushStatusItem; isMobile: boolean }) {
  const st = statusStyle(row.arinv_status)
  const isError = row.arinv_status === 'error'
  const partial =
    row.items_total != null &&
    row.items_pushed != null &&
    row.items_pushed < row.items_total

  const itemsCell = (
    <span
      className={cn(
        'tabular-nums',
        partial ? 'text-amber-700 dark:text-amber-400' : 'text-text-tertiary',
      )}
    >
      {row.items_pushed ?? 0}/{row.items_total ?? 0}
    </span>
  )

  if (isMobile) {
    return (
      <div className='border-b border-border-light px-3.5 py-2.5'>
        <div className='mb-1.5 flex items-center gap-2'>
          <span
            className={cn(
              'shrink-0 rounded border px-1.5 py-0.5 text-[11px] font-medium',
              st.cls,
            )}
          >
            {st.label}
          </span>
          <span className='font-mono text-[12px] tabular-nums text-text-secondary'>
            #{row.proposal_id}
          </span>
          <span className='ml-auto text-[12px] tabular-nums text-text-tertiary'>
            {money(row.total)}
          </span>
        </div>
        <div className='mb-1 truncate text-[12px] text-foreground'>
          {row.email || '—'}
        </div>
        <div className='flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] tabular-nums text-text-tertiary'>
          <span>items {row.items_pushed ?? 0}/{row.items_total ?? 0}</span>
          <span className='text-text-quaternary'>·</span>
          <span>last {dt(row.last_attempt_at)}</span>
          {row.next_retry_at && (
            <>
              <span className='text-text-quaternary'>·</span>
              <span>retry ~{dt(row.next_retry_at)}</span>
            </>
          )}
        </div>
        {isError && row.last_error_message && (
          <div className='mt-1 truncate text-[11px] text-red-600 dark:text-red-400'>
            {row.last_error_message}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        ROW_GRID,
        'group/row border-b border-border-light px-5 py-2 xl:px-6',
        isError && 'bg-red-500/[0.02]',
      )}
    >
      <div className='font-mono text-[12px] tabular-nums text-text-secondary'>
        #{row.proposal_id}
      </div>
      <div className='flex min-w-0 items-center gap-1.5'>
        {isError && <AlertCircle className='size-3 shrink-0 text-red-500' />}
        <span className='truncate text-[13px] text-foreground'>
          {row.email || '—'}
        </span>
      </div>
      <div className='min-w-0'>
        <span
          className={cn(
            'inline-block max-w-full truncate rounded border px-1.5 py-0.5 align-middle text-[11px] font-medium',
            st.cls,
          )}
        >
          {st.label}
        </span>
      </div>
      <div className='text-[13px]'>{itemsCell}</div>
      <div className='text-right text-[13px] tabular-nums text-text-tertiary'>
        {money(row.total)}
      </div>
      <div className='min-w-0 truncate text-[12px] tabular-nums text-text-tertiary'>
        {dt(row.last_attempt_at)}
      </div>
      <div className='min-w-0 truncate text-[12px] tabular-nums text-text-tertiary'>
        {row.next_retry_at ? `~${dt(row.next_retry_at)}` : '—'}
      </div>
      <div
        className='min-w-0 truncate text-[12px] text-text-tertiary'
        title={row.last_error_message ?? row.arinv_autoid ?? ''}
      >
        {row.last_error_message || (
          <span className='font-mono'>{row.arinv_autoid || '—'}</span>
        )}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/push-status/')({
  component: PushStatusPage,
  head: () => ({
    meta: [{ title: 'Push Status' }],
  }),
})
