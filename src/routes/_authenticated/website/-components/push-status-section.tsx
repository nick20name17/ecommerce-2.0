import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { AlertCircle, ChevronRight, Inbox, Search, Send } from 'lucide-react'
import { useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

import { getPayloadLogsQuery } from '@/api/payload-log/query'
import type { PayloadLog } from '@/api/payload-log/schema'
import { getPushStatusQuery } from '@/api/push-status/query'
import type { PushStatusItem } from '@/api/push-status/schema'
import { Pagination } from '@/components/common/filters/pagination'
import { PageEmpty } from '@/components/common/page-empty'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { formatDateTimeShort } from '@/helpers/formatters'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import {
  useLimitParam,
  useOffsetParam,
  useSearchParam,
} from '@/hooks/use-query-params'
import { cn } from '@/lib/utils'
import { PayloadLogDetailDialog } from '@/routes/_authenticated/profile/-components/payload-log-detail-dialog'

const PUSH_STATUS_DEFAULT_LIMIT = 20

function money(n: number | null | undefined) {
  if (n == null) return '—'
  return `$${n.toFixed(2)}`
}

const dt = (s: string | null | undefined) => (s ? formatDateTimeShort(s) : '—')

// arinv_status drives the badge. `status` (the ARQT side) is always "finished"
// — a no-op stub on every storefront — so the real lifecycle is arinv_status.
const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  error: {
    label: 'Error',
    cls: 'bg-red-500/10 text-red-700 border-red-200 dark:text-red-400 dark:border-red-800',
  },
  'in process': {
    label: 'In process',
    cls: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-800',
  },
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

export function PushStatusSection({ projectId }: { projectId: number }) {
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'

  const [search, setSearch] = useSearchParam()
  const handleSearch = useDebouncedCallback(
    (value: string) => setSearch(value || null),
    300,
  )
  const [offset] = useOffsetParam()
  const [limit] = useLimitParam(PUSH_STATUS_DEFAULT_LIMIT)

  // Drill-down: click a row -> log trail for that proposal; click a trail row -> detail.
  const [drillId, setDrillId] = useState<number | null>(null)
  const [selectedLog, setSelectedLog] = useState<PayloadLog | null>(null)

  const { data, isLoading, isPlaceholderData, error } = useQuery({
    ...getPushStatusQuery({
      search: search || undefined,
      project_id: projectId,
      ordering: '-updated_at',
      offset,
      limit,
    }),
    placeholderData: keepPreviousData,
    retry: false,
  })

  const supported = data?.supported ?? true
  const results = data?.results ?? []
  const totalCount = data?.count ?? 0

  const errMsg =
    (error as { response?: { data?: { error?: string } } } | null)?.response
      ?.data?.error ?? ''
  const isNotConfigured = errMsg.toLowerCase().includes('not configured')

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      <div
        className={cn(
          'flex h-11 shrink-0 items-center gap-2.5 border-b border-border',
          isMobile ? 'px-3.5' : 'px-6',
        )}
      >
        <div className='text-[13px] font-medium text-text-tertiary'>
          {supported &&
            totalCount > 0 &&
            `${totalCount} order${totalCount === 1 ? '' : 's'} in flight`}
          {isPlaceholderData && (
            <Spinner className='ml-2 inline size-3 text-text-tertiary' />
          )}
        </div>
        <div className='flex-1' />
        {supported && (
          <div className='hidden h-7 w-full max-w-[260px] items-center gap-1.5 rounded-[5px] border border-border bg-background px-2 transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50 sm:flex'>
            <Search className='size-3 shrink-0 text-text-tertiary' />
            <input
              defaultValue={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder='Proposal id or autoid...'
              className='flex-1 bg-transparent text-[13px] outline-none placeholder:text-text-tertiary'
            />
          </div>
        )}
      </div>

      <div className='flex-1 overflow-y-auto'>
        {error ? (
          <PageEmpty
            icon={Send}
            title={
              isNotConfigured
                ? 'Push status not configured'
                : 'Failed to load push status'
            }
            description={
              isNotConfigured
                ? 'Set Storefront URL and X-CRM-KEY Secret in Project settings.'
                : errMsg || 'Storefront returned an error or is unreachable.'
            }
          />
        ) : !supported ? (
          <PageEmpty
            icon={Inbox}
            title='No live push queue'
            description='This storefront pushes orders to EBMS synchronously — there is no async queue, retry, or stuck state. Push attempts are visible in Activity (Source = Storefront).'
          />
        ) : (
          <>
            {!isMobile && (results.length > 0 || isLoading || isPlaceholderData) && (
              <div
                className={cn(
                  'sticky top-0 z-10 flex select-none items-center border-b border-border bg-bg-secondary text-[13px] font-medium text-text-tertiary',
                  bp === 'tablet' ? 'gap-4 px-5 py-1' : 'gap-6 px-6 py-1',
                )}
              >
                <div className='w-[64px] shrink-0'>Proposal</div>
                <div className='w-[120px] shrink-0'>Status</div>
                <div className='w-[180px] shrink-0'>Customer</div>
                <div className='w-[64px] shrink-0'>Items</div>
                <div className='w-[90px] shrink-0 text-right'>Total</div>
                <div className='w-[140px] shrink-0'>Last attempt</div>
                <div className='w-[120px] shrink-0'>Next retry</div>
                <div className='min-w-0 flex-1'>Last error</div>
                <div className='w-[20px] shrink-0' />
              </div>
            )}

            {isLoading ? (
              Array.from({ length: PUSH_STATUS_DEFAULT_LIMIT }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-center border-b border-border-light',
                    bp === 'tablet' ? 'gap-4 px-5 py-2.5' : 'gap-6 px-6 py-2.5',
                  )}
                >
                  <Skeleton className='h-3.5 w-[40px] rounded' />
                  <Skeleton className='h-[18px] w-[80px] rounded-[4px]' />
                  <Skeleton className='h-3.5 w-[150px] rounded' />
                  <Skeleton className='h-3.5 w-[40px] rounded' />
                  <Skeleton className='ml-auto h-3.5 w-[70px] rounded' />
                  <Skeleton className='h-3.5 w-[120px] rounded' />
                  <Skeleton className='h-3.5 w-[100px] rounded' />
                  <Skeleton className='h-3.5 w-[160px] flex-1 rounded' />
                </div>
              ))
            ) : results.length === 0 ? (
              <PageEmpty
                icon={Send}
                title='Nothing in flight'
                description={
                  search
                    ? 'No orders match your search.'
                    : 'No approved orders are pending, stuck, or failed — everything has pushed to EBMS.'
                }
              />
            ) : (
              <div
                className={cn(
                  'transition-opacity duration-150',
                  isPlaceholderData && 'pointer-events-none opacity-50',
                )}
                aria-busy={isPlaceholderData}
              >
                {results.map((row) => (
                  <PushRow
                    key={row.proposal_id}
                    row={row}
                    bp={bp}
                    isMobile={isMobile}
                    onClick={() => setDrillId(row.proposal_id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {!error && supported && (
        <div
          className={cn(
            'shrink-0 border-t border-border py-2',
            isMobile ? 'px-3.5' : 'px-6',
          )}
        >
          <Pagination totalCount={totalCount} defaultLimit={PUSH_STATUS_DEFAULT_LIMIT} />
        </div>
      )}

      {/* Per-order push-log trail (PayloadLog enrich for this entity) */}
      <OrderLogTrailSheet
        projectId={projectId}
        proposalId={drillId}
        onClose={() => setDrillId(null)}
        onSelectLog={setSelectedLog}
      />
      <PayloadLogDetailDialog
        log={selectedLog}
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      />
    </div>
  )
}

// ── Drill-down: full push-log trail for one proposal ────────────

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800',
  POST: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800',
  PATCH: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-800',
  DELETE: 'bg-red-500/10 text-red-700 border-red-200 dark:text-red-400 dark:border-red-800',
}

function OrderLogTrailSheet({
  projectId,
  proposalId,
  onClose,
  onSelectLog,
}: {
  projectId: number
  proposalId: number | null
  onClose: () => void
  onSelectLog: (log: PayloadLog) => void
}) {
  const open = proposalId != null

  const { data, isLoading } = useQuery({
    ...getPayloadLogsQuery({
      source: 'storefront',
      external_ref_exact: proposalId != null ? String(proposalId) : undefined,
      project_id: projectId,
      ordering: '-created_at',
      limit: 500,
    }),
    enabled: open,
  })

  const logs = data?.results ?? []

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-xl'>
        <SheetHeader className='border-b border-border px-5 py-4'>
          <SheetTitle>Order #{proposalId} — push log</SheetTitle>
          <SheetDescription>
            Every EBMS push attempt for this order, newest first. Click a row for
            payload / response.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className='min-h-0 flex-1'>
          {isLoading ? (
            <div className='flex flex-col gap-2 p-4'>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className='h-12 w-full rounded' />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <PageEmpty
              icon={Send}
              title='No push attempts logged'
              description='This order produced no storefront push log yet — it may be queued but not picked up by the worker.'
            />
          ) : (
            <div className='divide-y divide-border-light'>
              {logs.map((log) => (
                <TrailRow key={log.id} log={log} onClick={() => onSelectLog(log)} />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

function TrailRow({ log, onClick }: { log: PayloadLog; onClick: () => void }) {
  const methodColor =
    METHOD_COLORS[log.method] ?? 'bg-bg-secondary text-text-secondary border-border'
  const statusColor = log.is_error
    ? 'text-red-700 dark:text-red-400'
    : log.status_code >= 200 && log.status_code < 300
      ? 'text-emerald-700 dark:text-emerald-400'
      : 'text-text-secondary'

  return (
    <button
      type='button'
      onClick={onClick}
      className='group/trail flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors duration-100 hover:bg-bg-hover'
    >
      <span className={cn('shrink-0 rounded border px-1.5 py-0.5 font-mono text-[11px] font-semibold', methodColor)}>
        {log.method}
      </span>
      <div className='flex min-w-0 flex-1 flex-col'>
        <span className='flex items-center gap-1.5 truncate text-[12px] font-medium text-foreground'>
          {log.is_error && <AlertCircle className='size-3 shrink-0 text-red-500' />}
          {log.action_name || log.entity || log.url}
        </span>
        {log.is_error && log.error_message && (
          <span className='truncate text-[11px] text-red-600 dark:text-red-400'>
            {log.error_message}
          </span>
        )}
      </div>
      <span className={cn('shrink-0 font-mono text-[12px] font-semibold tabular-nums', statusColor)}>
        {log.status_code}
      </span>
      <span className='shrink-0 text-[11px] tabular-nums text-text-tertiary'>
        {dt(log.created_at)}
      </span>
      <ChevronRight className='size-3.5 shrink-0 text-text-tertiary opacity-0 transition-opacity group-hover/trail:opacity-100' />
    </button>
  )
}

// ── Order row ───────────────────────────────────────────────

function PushRow({
  row,
  bp,
  isMobile,
  onClick,
}: {
  row: PushStatusItem
  bp: string
  isMobile: boolean
  onClick: () => void
}) {
  const st = statusStyle(row.arinv_status)
  const isError = row.arinv_status === 'error'
  const partial =
    row.items_total != null &&
    row.items_pushed != null &&
    row.items_pushed < row.items_total

  if (isMobile) {
    return (
      <div
        className='cursor-pointer border-b border-border-light px-3.5 py-2.5 transition-colors duration-100 hover:bg-bg-hover'
        onClick={onClick}
      >
        <div className='mb-1.5 flex items-center gap-2'>
          <span className={cn('shrink-0 rounded border px-1.5 py-0.5 text-[11px] font-medium', st.cls)}>
            {st.label}
          </span>
          <span className='font-mono text-[12px] tabular-nums text-text-secondary'>
            #{row.proposal_id}
          </span>
          <span className='ml-auto text-[12px] tabular-nums text-text-tertiary'>
            {money(row.total)}
          </span>
        </div>
        <div className='mb-1 truncate text-[12px] text-foreground'>{row.email || '—'}</div>
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
        'group/row flex cursor-pointer items-center border-b border-border-light transition-colors duration-100 hover:bg-bg-hover',
        bp === 'tablet' ? 'gap-4 px-5 py-2.5' : 'gap-6 px-6 py-2.5',
        isError && 'bg-red-500/[0.02]',
      )}
      onClick={onClick}
    >
      <div className='w-[64px] shrink-0 font-mono text-[12px] tabular-nums text-text-secondary'>
        #{row.proposal_id}
      </div>
      <div className='w-[120px] shrink-0'>
        <span className={cn('inline-block max-w-full truncate rounded border px-1.5 py-0.5 text-[11px] font-medium', st.cls)}>
          {st.label}
        </span>
      </div>
      <div className='flex w-[180px] shrink-0 items-center gap-1.5'>
        {isError && <AlertCircle className='size-3 shrink-0 text-red-500' />}
        <span className='truncate text-[13px] text-foreground'>{row.email || '—'}</span>
      </div>
      <div
        className={cn(
          'w-[64px] shrink-0 text-[13px] tabular-nums',
          partial ? 'text-amber-700 dark:text-amber-400' : 'text-text-tertiary',
        )}
      >
        {row.items_pushed ?? 0}/{row.items_total ?? 0}
      </div>
      <div className='w-[90px] shrink-0 text-right text-[13px] tabular-nums text-text-tertiary'>
        {money(row.total)}
      </div>
      <div className='w-[140px] shrink-0 truncate text-[12px] tabular-nums text-text-tertiary'>
        {dt(row.last_attempt_at)}
      </div>
      <div className='w-[120px] shrink-0 truncate text-[12px] tabular-nums text-text-tertiary'>
        {row.next_retry_at ? `~${dt(row.next_retry_at)}` : '—'}
      </div>
      <div
        className='min-w-0 flex-1 truncate text-[12px] text-text-tertiary'
        title={row.last_error_message ?? row.arinv_autoid ?? ''}
      >
        {row.last_error_message || (
          <span className='font-mono'>{row.arinv_autoid || '—'}</span>
        )}
      </div>
      <div className='w-[20px] shrink-0 text-text-tertiary opacity-0 transition-opacity group-hover/row:opacity-100'>
        <ChevronRight className='size-3.5' />
      </div>
    </div>
  )
}
