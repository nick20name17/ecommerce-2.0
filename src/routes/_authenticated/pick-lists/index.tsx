import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ChevronRight,
  ClipboardList,
  Package,

  Search,
  ShoppingCart,
} from 'lucide-react'
import { useState } from 'react'

import { getPickListsQuery } from '@/api/pick-list/query'
import type { PickList, PickListParams } from '@/api/pick-list/schema'
import { PageEmpty } from '@/components/common/page-empty'
import { Pagination } from '@/components/common/filters/pagination'
import { FilterChip, FilterPopover, IPickLists, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  PICK_LIST_STATUS,
  PICK_LIST_STATUS_CLASS,
  PICK_LIST_STATUS_LABELS,
  type PickListStatus,
  getPickListStatusLabel,
} from '@/constants/pick-list'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { useProjectId } from '@/hooks/use-project-id'
import { useLimitParam, useOffsetParam, useSearchParam } from '@/hooks/use-query-params'
import { formatDateMedium } from '@/helpers/formatters'
import { cn } from '@/lib/utils'


// ── Helpers ──────────────────────────────────────────────────

const STATUS_DOT_COLORS: Record<PickListStatus, string> = {
  [PICK_LIST_STATUS.draft]: 'bg-slate-400',
  [PICK_LIST_STATUS.pushed]: 'bg-blue-500',
  [PICK_LIST_STATUS.ratesFetched]: 'bg-amber-500',
  [PICK_LIST_STATUS.labelPurchased]: 'bg-emerald-500',
}

const STATUS_OPTIONS = Object.entries(PICK_LIST_STATUS_LABELS) as [PickListStatus, string][]

// ── Page ─────────────────────────────────────────────────────

const PickListsPage = () => {
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const navigate = useNavigate()
  const [projectId] = useProjectId()

  const [search, setSearch] = useSearchParam()
  const [offset, setOffset] = useOffsetParam()
  const [limit] = useLimitParam()

  const [activeStatus, setActiveStatus] = useState<PickListStatus | null>(null)


  const params: PickListParams = {
    search: search || undefined,
    offset,
    limit,
    status: activeStatus ?? undefined,
    project_id: projectId ?? undefined,
  }

  const { data, isLoading } = useQuery({
    ...getPickListsQuery(params),
    placeholderData: keepPreviousData,
  })
  const results = data?.results ?? []

  const hasFilters = activeStatus !== null

  const selectStatus = (s: PickListStatus) => {
    setActiveStatus((prev) => (prev === s ? null : s))
    setOffset(null)
  }

  const clearAllFilters = () => {
    setActiveStatus(null)
    setOffset(null)
  }

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* Header */}
      <header className='flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-3.5 sm:px-6'>
        <SidebarTrigger className='-ml-1' />
        <PageHeaderIcon icon={IPickLists} color={PAGE_COLORS.pickLists} />
        <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>Pick Lists</h1>
        {!isLoading && (
          <span className='text-[13px] tabular-nums text-text-tertiary'>
            {data?.count ?? 0}
          </span>
        )}

        <div className='flex-1' />

        {/* Search */}
        <div className='flex items-center gap-1.5 rounded-[6px] border border-border bg-background px-2.5 py-1.5'>
          <Search className='size-3.5 shrink-0 text-text-tertiary' />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setOffset(null)
            }}
            placeholder='Search pick lists...'
            className='w-[140px] bg-transparent text-[13px] outline-none placeholder:text-text-tertiary sm:w-[200px]'
          />
        </div>

        {/* Status filter */}
        <FilterPopover
          label='Status'
          active={hasFilters}
          icon={
            <div
              className={cn(
                'size-2.5 rounded-full',
                hasFilters && activeStatus ? STATUS_DOT_COLORS[activeStatus] : 'bg-current',
              )}
            />
          }
        >
          {STATUS_OPTIONS.map(([value, label]) => {
            const selected_ = activeStatus === value
            return (
              <button
                key={value}
                type='button'
                className={cn(
                  'flex w-full items-center gap-2 rounded-[5px] px-2 py-[3px] text-left text-[13px] font-medium',
                  'transition-colors duration-[80ms] hover:bg-bg-hover',
                )}
                onClick={() => selectStatus(value)}
              >
                <div
                  className={cn(
                    'flex size-3.5 items-center justify-center rounded-full border transition-colors duration-[80ms]',
                    selected_ ? 'border-primary bg-primary' : 'border-border',
                  )}
                >
                  {selected_ && <div className='size-1.5 rounded-full bg-primary-foreground' />}
                </div>
                <div className={cn('size-2.5 shrink-0 rounded-full', STATUS_DOT_COLORS[value])} />
                <span className='flex-1'>{label}</span>
              </button>
            )
          })}
        </FilterPopover>


      </header>

      {/* Active filters */}
      {hasFilters && (
        <div className='flex shrink-0 flex-wrap items-center gap-1.5 border-b border-border px-3.5 py-1.5 sm:px-6'>
          <button
            type='button'
            className='text-[13px] font-medium text-text-tertiary transition-colors duration-[80ms] hover:text-foreground'
            onClick={clearAllFilters}
          >
            Clear
          </button>
          {activeStatus && (
            <FilterChip onRemove={() => setActiveStatus(null)}>
              <span className='text-text-tertiary'>Status is</span>
              <div className={cn('size-2 rounded-full', STATUS_DOT_COLORS[activeStatus])} />
              {getPickListStatusLabel(activeStatus)}
            </FilterChip>
          )}
        </div>
      )}

      {/* List */}
      <div className='flex-1 overflow-auto'>
        {/* Column headers */}
        {!isMobile && (results.length > 0 || isLoading) && (
          <div className='sticky top-0 z-10 flex min-w-fit shrink-0 items-center gap-4 border-b border-border bg-bg-secondary/60 px-5 py-1.5 text-[13px] font-medium text-text-tertiary xl:px-6'>
            <div className='w-[60px] shrink-0'>ID</div>
            <div className='min-w-0 flex-1'>Name / Ship To</div>
            <div className='w-[130px] shrink-0'>Status</div>
            <div className='w-[160px] shrink-0'>Contents</div>
            <div className='w-[100px] shrink-0'>Created</div>
            <div className='w-[20px] shrink-0' />
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
              <Skeleton className='h-5 w-20 rounded-full' />
              <Skeleton className='h-4 w-10' />
              <Skeleton className='h-4 w-10' />
              <Skeleton className='h-4 w-16' />
            </div>
          ))
        ) : results.length === 0 ? (
          <PageEmpty
            icon={ClipboardList}
            title='No pick lists found'
            description={hasFilters ? 'Try adjusting your filters.' : 'No pick lists yet.'}
          />
        ) : (
          results.map((pickList) => (
            <PickListRow
              key={pickList.id}
              pickList={pickList}
              isMobile={isMobile}
              onClick={() =>
                navigate({
                  to: '/pick-lists/$pickListId',
                  params: { pickListId: String(pickList.id) },
                })
              }
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className='shrink-0 border-t border-border px-3.5 py-2 sm:px-6'>
        <Pagination totalCount={data?.count ?? 0} />
      </div>

    </div>
  )
}

// ── Row ──────────────────────────────────────────────────────

function PickListRow({
  pickList,
  isMobile,
  onClick,
}: {
  pickList: PickList
  isMobile: boolean
  onClick: () => void
}) {
  const displayName = pickList.name || pickList.ship_to.name
  const statusLabel = getPickListStatusLabel(pickList.status)
  const statusClass = PICK_LIST_STATUS_CLASS[pickList.status] ?? ''
  const dotColor = STATUS_DOT_COLORS[pickList.status] ?? 'bg-slate-400'

  if (isMobile) {
    return (
      <div
        className='cursor-pointer border-b border-border-light px-3.5 py-2 transition-colors duration-100 hover:bg-bg-hover'
        onClick={onClick}
      >
        <div className='mb-1 flex items-center gap-2'>
          <div className={cn('size-1.5 shrink-0 rounded-full', dotColor)} />
          <span className='min-w-0 flex-1 truncate text-[13px] font-medium text-foreground'>
            {displayName}
          </span>
          <span className='inline-flex shrink-0 items-center gap-1 rounded-md bg-bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-text-secondary'>
            <Package className='size-3 text-text-quaternary' />
            {pickList.item_count} item{pickList.item_count !== 1 ? 's' : ''}
          </span>
        </div>
        <div className='flex items-center gap-2 pl-3.5'>
          <span
            className={cn(
              'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none',
              statusClass,
            )}
          >
            {statusLabel}
          </span>
          <span className='text-[13px] tabular-nums text-text-tertiary'>
            {formatDateMedium(pickList.created_at)}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className='group/row flex min-w-fit cursor-pointer items-center gap-4 border-b border-border-light px-5 py-2 transition-colors duration-100 hover:bg-bg-hover xl:px-6'
      onClick={onClick}
    >
      <div className='w-[60px] shrink-0 text-[13px] font-semibold tabular-nums text-foreground'>
        #{pickList.id}
      </div>
      <div className='min-w-0 flex-1'>
        <span className='truncate text-[13px] font-medium text-foreground'>{displayName}</span>
        {pickList.name && (
          <span className='ml-2 truncate text-[13px] text-text-tertiary'>
            {pickList.ship_to.name}
          </span>
        )}
      </div>
      <div className='w-[130px] shrink-0'>
        <span
          className={cn(
            'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none',
            statusClass,
          )}
        >
          {statusLabel}
        </span>
      </div>
      <div className='flex w-[160px] shrink-0 items-center gap-1.5'>
        <span className='inline-flex items-center gap-1 rounded-md bg-bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-text-secondary'>
          <Package className='size-3 text-text-quaternary' />
          {pickList.item_count} item{pickList.item_count !== 1 ? 's' : ''}
        </span>
        <span className='inline-flex items-center gap-1 rounded-md bg-bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-text-secondary'>
          <ShoppingCart className='size-3 text-text-quaternary' />
          {pickList.order_count}
        </span>
      </div>
      <div className='w-[100px] shrink-0 text-[13px] tabular-nums text-text-tertiary'>
        {formatDateMedium(pickList.created_at)}
      </div>
      <div className='w-[20px] shrink-0 text-text-tertiary opacity-0 transition-opacity group-hover/row:opacity-100'>
        <ChevronRight className='size-3.5' />
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/pick-lists/')({
  component: PickListsPage,
  head: () => ({
    meta: [{ title: 'Pick Lists' }],
  }),
})
