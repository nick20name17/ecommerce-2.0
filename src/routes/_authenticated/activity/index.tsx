import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import {
  AlertCircle,
  ChevronRight,
  Clock,
  Search,
} from 'lucide-react'
import { useState, useDeferredValue } from 'react'

import { getPayloadLogsQuery } from '@/api/payload-log/query'
import type { PayloadLog, PayloadLogParams } from '@/api/payload-log/schema'
import { PayloadLogDetailDialog } from '@/routes/_authenticated/profile/-components/payload-log-detail-dialog'
import { Pagination } from '@/components/common/filters/pagination'
import { PageEmpty } from '@/components/common/page-empty'
import { FilterChip, FilterPopover, IActivity, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { useProjectId } from '@/hooks/use-project-id'
import { useLimitParam, useOffsetParam } from '@/hooks/use-query-params'
import { formatDateTimeShort } from '@/helpers/formatters'
import { cn } from '@/lib/utils'

// ── Helpers ──────────────────────────────────────────────────

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800',
  POST: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800',
  PATCH: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-800',
  PUT: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-800',
  DELETE: 'bg-red-500/10 text-red-700 border-red-200 dark:text-red-400 dark:border-red-800',
}

type ErrorFilter = 'all' | 'errors' | 'success'
type MethodFilter = string | null

const ERROR_OPTIONS: { value: ErrorFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'errors', label: 'Errors Only' },
  { value: 'success', label: 'Success Only' },
]

const METHOD_OPTIONS = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'] as const

// ── Page Component ───────────────────────────────────────────

const ActivityPage = () => {
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const isTablet = bp === 'tablet'
  const [projectId] = useProjectId()
  const [offset, setOffset] = useOffsetParam()
  const [limit] = useLimitParam()

  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [errorFilter, setErrorFilter] = useState<ErrorFilter>('all')
  const [methodFilter, setMethodFilter] = useState<MethodFilter>(null)
  const [selectedLog, setSelectedLog] = useState<PayloadLog | null>(null)

  const searchUpper = deferredSearch.toUpperCase()
  const isMethodSearch = (['GET', 'POST', 'PATCH', 'PUT', 'DELETE'] as const).includes(searchUpper as typeof METHOD_OPTIONS[number])

  const params: PayloadLogParams = {
    offset,
    limit,
    ordering: '-created_at',
    search: isMethodSearch ? undefined : (deferredSearch || undefined),
    is_error: errorFilter === 'errors' ? true : errorFilter === 'success' ? false : undefined,
    method: isMethodSearch ? searchUpper : (methodFilter ?? undefined),
    project_id: projectId ?? undefined,
  }

  const { data, isLoading } = useQuery({
    ...getPayloadLogsQuery(params),
    placeholderData: keepPreviousData,
  })

  const results = data?.results ?? []
  const totalCount = data?.count ?? 0

  const hasFilters = errorFilter !== 'all' || methodFilter !== null

  const clearAllFilters = () => {
    setErrorFilter('all')
    setMethodFilter(null)
    setOffset(null)
  }

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* Header */}
      <header className={cn('flex h-12 shrink-0 items-center gap-2.5 border-b border-border', isMobile ? 'px-3.5' : 'px-6')}>
        <SidebarTrigger className='-ml-1' />
        <PageHeaderIcon icon={IActivity} color={PAGE_COLORS.activity} />
        <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>Activity</h1>
        {!isLoading && (
          <span className='text-[13px] tabular-nums text-text-tertiary'>
            {totalCount}
          </span>
        )}

        <div className='flex-1' />

        <div className='flex items-center gap-1.5 rounded-[6px] border border-border bg-background px-2.5 py-1.5'>
          <Search className='size-3.5 shrink-0 text-text-tertiary' />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOffset(null) }}
            placeholder='Search URL or method...'
            className='w-[140px] bg-transparent text-[13px] outline-none placeholder:text-text-tertiary sm:w-[200px]'
          />
        </div>

        {/* Error filter */}
        <FilterPopover
          label='Status'
          active={errorFilter !== 'all'}
          icon={<div className={cn('size-2.5 rounded-full', errorFilter === 'errors' ? 'bg-red-500' : errorFilter === 'success' ? 'bg-emerald-500' : 'bg-current')} />}
        >
          {ERROR_OPTIONS.map((opt) => {
            const selected_ = errorFilter === opt.value
            return (
              <button
                key={opt.value}
                type='button'
                className={cn(
                  'flex w-full items-center gap-2 rounded-[5px] px-2 py-[3px] text-left text-[13px] font-medium',
                  'transition-colors duration-[80ms] hover:bg-bg-hover'
                )}
                onClick={() => { setErrorFilter(opt.value === errorFilter ? 'all' : opt.value); setOffset(null) }}
              >
                <div className={cn(
                  'flex size-3.5 items-center justify-center rounded-full border transition-colors duration-[80ms]',
                  selected_ ? 'border-primary bg-primary' : 'border-border'
                )}>
                  {selected_ && <div className='size-1.5 rounded-full bg-primary-foreground' />}
                </div>
                <span className='flex-1'>{opt.label}</span>
              </button>
            )
          })}
        </FilterPopover>

        {/* Method filter */}
        <FilterPopover
          label='Method'
          active={methodFilter !== null}
        >
          {METHOD_OPTIONS.map((m) => {
            const selected_ = methodFilter === m
            return (
              <button
                key={m}
                type='button'
                className={cn(
                  'flex w-full items-center gap-2 rounded-[5px] px-2 py-[3px] text-left text-[13px] font-medium',
                  'transition-colors duration-[80ms] hover:bg-bg-hover'
                )}
                onClick={() => { setMethodFilter(selected_ ? null : m); setOffset(null) }}
              >
                <div className={cn(
                  'flex size-3.5 items-center justify-center rounded-full border transition-colors duration-[80ms]',
                  selected_ ? 'border-primary bg-primary' : 'border-border'
                )}>
                  {selected_ && <div className='size-1.5 rounded-full bg-primary-foreground' />}
                </div>
                <span className={cn('rounded border px-1.5 py-0.5 font-mono text-[11px] font-semibold', METHOD_COLORS[m] ?? '')}>
                  {m}
                </span>
              </button>
            )
          })}
        </FilterPopover>
      </header>

      {/* Active filter chips */}
      {hasFilters && (
        <div className={cn('flex shrink-0 flex-wrap items-center gap-1.5 border-b border-border py-1.5', isMobile ? 'px-3.5' : 'px-6')}>
          <button
            type='button'
            className='text-[13px] font-medium text-text-tertiary transition-colors duration-[80ms] hover:text-foreground'
            onClick={clearAllFilters}
          >
            Clear
          </button>
          {errorFilter !== 'all' && (
            <FilterChip onRemove={() => { setErrorFilter('all'); setOffset(null) }}>
              <span className='text-text-tertiary'>Status is</span>
              {errorFilter === 'errors' ? 'Errors' : 'Success'}
            </FilterChip>
          )}
          {methodFilter && (
            <FilterChip onRemove={() => { setMethodFilter(null); setOffset(null) }}>
              <span className='text-text-tertiary'>Method is</span>
              {methodFilter}
            </FilterChip>
          )}
        </div>
      )}

      {/* Column headers */}
      {!isMobile && (results.length > 0 || isLoading) && (
        <div className={cn('flex shrink-0 items-center gap-4 border-b border-border bg-bg-secondary/60 py-1.5', isTablet ? 'px-5' : 'px-6')}>
          <div className='w-[70px] shrink-0 text-[12px] font-medium text-text-tertiary'>Method</div>
          <div className='min-w-0 flex-1 text-[12px] font-medium text-text-tertiary'>URL</div>
          {!isTablet && <div className='w-[100px] shrink-0 text-[12px] font-medium text-text-tertiary'>Entity</div>}
          <div className='w-[50px] shrink-0 text-[12px] font-medium text-text-tertiary'>Status</div>
          {!isTablet && <div className='w-[70px] shrink-0 text-right text-[12px] font-medium text-text-tertiary'>Duration</div>}
          {!isTablet && <div className='w-[140px] shrink-0 text-[12px] font-medium text-text-tertiary'>Time</div>}
          <div className='w-[20px] shrink-0' />
        </div>
      )}

      {/* Body */}
      <div className='flex-1 overflow-y-auto'>
        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className={cn('flex items-center gap-4 border-b border-border-light py-2.5', isMobile ? 'px-3.5' : 'px-6')}>
              <Skeleton className='h-5 w-12' />
              <Skeleton className='h-4 w-48 flex-1' />
              {!isTablet && <Skeleton className='h-4 w-16' />}
              <Skeleton className='h-5 w-10' />
              {!isTablet && <Skeleton className='h-4 w-14' />}
              {!isTablet && <Skeleton className='h-4 w-24' />}
            </div>
          ))
        ) : results.length === 0 ? (
          <PageEmpty icon={Clock} title='No logs found' description='Try adjusting your search or filters.' />
        ) : (
          results.map((log) => (
            <LogRow
              key={log.id}
              log={log}
              isMobile={isMobile}
              isTablet={isTablet}
              onClick={() => setSelectedLog(log)}
            />
          ))
        )}
      </div>

      {/* Pagination footer */}
      <div className={cn('shrink-0 border-t border-border py-1.5', isMobile ? 'px-3.5' : 'px-6')}>
        <Pagination totalCount={totalCount} />
      </div>

      {/* Detail dialog */}
      <PayloadLogDetailDialog
        log={selectedLog}
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      />
    </div>
  )
}

// ── Log Row ─────────────────────────────────────────────────

function LogRow({
  log,
  isMobile,
  isTablet,
  onClick,
}: {
  log: PayloadLog
  isMobile: boolean
  isTablet: boolean
  onClick: () => void
}) {
  const methodColor = METHOD_COLORS[log.method] ?? 'bg-bg-secondary text-text-secondary border-border'
  const statusColor = log.is_error
    ? 'text-red-700 dark:text-red-400'
    : log.status_code >= 200 && log.status_code < 300
      ? 'text-emerald-700 dark:text-emerald-400'
      : 'text-text-secondary'

  if (isMobile) {
    return (
      <div
        className='cursor-pointer border-b border-border-light px-3.5 py-2.5 transition-colors duration-100 hover:bg-bg-hover'
        onClick={onClick}
      >
        <div className='mb-1.5 flex items-center gap-2'>
          <span className={cn('shrink-0 rounded border px-1.5 py-0.5 font-mono text-[11px] font-semibold', methodColor)}>
            {log.method}
          </span>
          <span className={cn('shrink-0 font-mono text-[12px] font-semibold tabular-nums', statusColor)}>
            {log.status_code}
          </span>
          {log.is_error && <AlertCircle className='size-3 shrink-0 text-red-500' />}
          <span className='ml-auto shrink-0 text-[11px] text-text-tertiary'>{log.entity}</span>
        </div>
        <div className='mb-1 truncate font-mono text-[12px] text-foreground'>
          {log.url}
        </div>
        <div className='flex items-center gap-2 text-[11px] tabular-nums text-text-tertiary'>
          <span>{formatDuration(log.duration_ms)}</span>
          <span className='text-text-quaternary'>·</span>
          <span>{formatDateTimeShort(log.created_at)}</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group/row flex cursor-pointer items-center gap-4 border-b border-border-light py-2 transition-colors duration-100 hover:bg-bg-hover',
        isTablet ? 'px-5' : 'px-6',
        log.is_error && 'bg-red-500/[0.02]',
      )}
      onClick={onClick}
    >
      <div className='w-[70px] shrink-0'>
        <span className={cn('rounded border px-1.5 py-0.5 font-mono text-[11px] font-semibold', methodColor)}>
          {log.method}
        </span>
      </div>
      <div className='min-w-0 flex-1 flex items-center gap-1.5'>
        {log.is_error && <AlertCircle className='size-3 shrink-0 text-red-500' />}
        <span className='truncate font-mono text-[12px] text-foreground'>{log.url}</span>
      </div>
      {!isTablet && (
        <div className='w-[100px] shrink-0 truncate text-[13px] text-text-tertiary'>
          {log.entity || '—'}
        </div>
      )}
      <div className='w-[50px] shrink-0'>
        <span className={cn('font-mono text-[12px] font-semibold tabular-nums', statusColor)}>
          {log.status_code}
        </span>
      </div>
      {!isTablet && (
        <div className='w-[70px] shrink-0 text-right text-[12px] tabular-nums text-text-tertiary'>
          {formatDuration(log.duration_ms)}
        </div>
      )}
      {!isTablet && (
        <div className='w-[140px] shrink-0 text-[12px] tabular-nums text-text-tertiary'>
          {formatDateTimeShort(log.created_at)}
        </div>
      )}
      <div className='w-[20px] shrink-0 text-text-tertiary opacity-0 transition-opacity group-hover/row:opacity-100'>
        <ChevronRight className='size-3.5' />
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/activity/')({
  component: ActivityPage,
  head: () => ({
    meta: [{ title: 'Activity' }],
  }),
})
