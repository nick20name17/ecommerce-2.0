import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ChevronRight,
  ClipboardList,
  Plus,
  Search,
} from 'lucide-react'
import { useState } from 'react'

import { getPickListsQuery } from '@/api/pick-list/query'
import type { PickList, PickListParams } from '@/api/pick-list/schema'
import { PageEmpty } from '@/components/common/page-empty'
import { Pagination } from '@/components/common/filters/pagination'
import { FilterChip, FilterPopover, IPickLists, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import { Button } from '@/components/ui/button'
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
import { useLimitParam, useOffsetParam, useSearchParam } from '@/hooks/use-query-params'
import { cn } from '@/lib/utils'

import { CreatePickListModal } from './-components/create-pick-list-modal'

// ── Helpers ──────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const STATUS_DOT_COLORS: Record<PickListStatus, string> = {
  [PICK_LIST_STATUS.draft]: 'bg-slate-400',
  [PICK_LIST_STATUS.partiallyFailed]: 'bg-red-500',
  [PICK_LIST_STATUS.pushed]: 'bg-blue-500',
  [PICK_LIST_STATUS.ratesFetched]: 'bg-amber-500',
  [PICK_LIST_STATUS.labelPurchased]: 'bg-emerald-500',
}

const STATUS_OPTIONS = Object.entries(PICK_LIST_STATUS_LABELS) as [PickListStatus, string][]

// ── Page ─────────────────────────────────────────────────────

const PickListsPage = () => {
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const isTablet = bp === 'tablet'
  const navigate = useNavigate()

  const [search, setSearch] = useSearchParam()
  const [offset, setOffset] = useOffsetParam()
  const [limit] = useLimitParam()

  const [activeStatus, setActiveStatus] = useState<PickListStatus | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const params: PickListParams = {
    search: search || undefined,
    offset,
    limit,
    status: activeStatus ?? undefined,
  }

  const { data, isLoading } = useQuery(getPickListsQuery(params))
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
      <header
        className={cn(
          'flex h-12 shrink-0 items-center gap-2.5 border-b border-border',
          isMobile ? 'px-3.5' : 'px-6',
        )}
      >
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

        {/* Create button */}
        <Button size='sm' onClick={() => setCreateOpen(true)}>
          <Plus className='size-3.5' />
          {!isMobile && 'New'}
        </Button>
      </header>

      {/* Active filters */}
      {hasFilters && (
        <div
          className={cn(
            'flex shrink-0 flex-wrap items-center gap-1.5 border-b border-border py-1.5',
            isMobile ? 'px-3.5' : 'px-6',
          )}
        >
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

      {/* Column headers */}
      {!isMobile && (results.length > 0 || isLoading) && (
        <div
          className={cn(
            'flex shrink-0 items-center gap-4 border-b border-border bg-bg-secondary/60 py-1.5 text-[13px] font-medium text-text-tertiary',
            isTablet ? 'px-5' : 'px-6',
          )}
        >
          <div className='w-[60px] shrink-0'>ID</div>
          <div className='min-w-0 flex-1'>Name / Ship To</div>
          <div className='w-[130px] shrink-0'>Status</div>
          {!isTablet && <div className='w-[70px] shrink-0 text-right'>Items</div>}
          <div className='w-[70px] shrink-0 text-right'>Orders</div>
          {!isTablet && <div className='w-[100px] shrink-0'>Created</div>}
          <div className='w-[20px] shrink-0' />
        </div>
      )}

      {/* Body */}
      <div className='flex-1 overflow-y-auto'>
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-4 border-b border-border-light py-2.5',
                isMobile ? 'px-3.5' : 'px-6',
              )}
            >
              <Skeleton className='h-4 w-10' />
              <Skeleton className='h-4 w-40 flex-1' />
              <Skeleton className='h-5 w-20 rounded-full' />
              {!isMobile && !isTablet && <Skeleton className='h-4 w-10' />}
              <Skeleton className='h-4 w-10' />
              {!isMobile && !isTablet && <Skeleton className='h-4 w-16' />}
            </div>
          ))
        ) : results.length === 0 ? (
          <PageEmpty
            icon={ClipboardList}
            title='No pick lists found'
            description={hasFilters ? 'Try adjusting your filters.' : 'Create a pick list to get started.'}
            action={
              !hasFilters ? (
                <Button size='sm' onClick={() => setCreateOpen(true)}>
                  <Plus className='size-3.5' />
                  New Pick List
                </Button>
              ) : undefined
            }
          />
        ) : (
          results.map((pickList) => (
            <PickListRow
              key={pickList.id}
              pickList={pickList}
              isMobile={isMobile}
              isTablet={isTablet}
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
      <div className={cn('shrink-0 border-t border-border py-2', isMobile ? 'px-3.5' : 'px-6')}>
        <Pagination totalCount={data?.count ?? 0} />
      </div>

      {/* Create modal */}
      <CreatePickListModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}

// ── Row ──────────────────────────────────────────────────────

function PickListRow({
  pickList,
  isMobile,
  isTablet,
  onClick,
}: {
  pickList: PickList
  isMobile: boolean
  isTablet: boolean
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
          <span className='shrink-0 text-[13px] tabular-nums text-text-tertiary'>
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
            {formatDate(pickList.created_at)}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group/row flex cursor-pointer items-center gap-4 border-b border-border-light py-2 transition-colors duration-100 hover:bg-bg-hover',
        isTablet ? 'px-5' : 'px-6',
      )}
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
      {!isTablet && (
        <div className='w-[70px] shrink-0 text-right text-[13px] tabular-nums text-text-tertiary'>
          {pickList.item_count}
        </div>
      )}
      <div className='w-[70px] shrink-0 text-right text-[13px] tabular-nums text-text-tertiary'>
        {pickList.order_count}
      </div>
      {!isTablet && (
        <div className='w-[100px] shrink-0 text-[13px] tabular-nums text-text-tertiary'>
          {formatDate(pickList.created_at)}
        </div>
      )}
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
