import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowDown, ArrowUp, Search, ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

import { LegacyCartRow } from './-components/legacy-cart-row'
import { getLegacyCartsQuery } from '@/api/legacy-cart/query'
import { Pagination } from '@/components/common/filters/pagination'
import { PageEmpty } from '@/components/common/page-empty'
import { ILegacyCarts, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import { Skeleton } from '@/components/ui/skeleton'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Spinner } from '@/components/ui/spinner'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { useProjectId } from '@/hooks/use-project-id'
import { useLimitParam, useOffsetParam, useSearchParam } from '@/hooks/use-query-params'
import { cn } from '@/lib/utils'

// ── Sort state ───────────────────────────────────────────────

type SortField = 'email' | 'ebms_id' | 'in_level' | 'created_at' | 'updated_at'
type SortDir = 'asc' | 'desc'

// ── Page ─────────────────────────────────────────────────────

function LegacyCartsPage() {
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const [projectId] = useProjectId()

  const [search, setSearch] = useSearchParam()
  const handleSearch = useDebouncedCallback(
    (value: string) => setSearch(value || null),
    300,
  )
  const [offset] = useOffsetParam()
  const [limit] = useLimitParam()

  const [sortField, setSortField] = useState<SortField | null>('updated_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const ordering = sortField
    ? sortDir === 'desc'
      ? `-${sortField}`
      : sortField
    : undefined

  const params = {
    search: search || undefined,
    project_id: projectId ?? undefined,
    ordering,
    offset,
    limit,
  }

  const { data, isLoading, isPlaceholderData, error } = useQuery({
    ...getLegacyCartsQuery(params),
    placeholderData: keepPreviousData,
    retry: false,
  })

  const carts = data?.results ?? []
  const totalCount = data?.count ?? 0

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDir === 'asc') setSortDir('desc')
      else {
        setSortField(null)
        setSortDir('asc')
      }
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  // 400 with "not configured" message gets a friendlier hint.
  const errMsg =
    (error as { response?: { data?: { error?: string } } } | null)
      ?.response?.data?.error ?? ''
  const isNotConfigured = errMsg.toLowerCase().includes('not configured')

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* ── Header ── */}
      <header
        className={cn(
          'flex h-12 shrink-0 items-center gap-2.5 border-b border-border',
          isMobile ? 'px-3.5' : 'px-6',
        )}
      >
        <SidebarTrigger className='-ml-1' />
        <div className='flex items-center gap-1.5'>
          <PageHeaderIcon icon={ILegacyCarts} color={PAGE_COLORS.legacyCarts} />
          <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>
            Abandoned Carts
          </h1>
          {isPlaceholderData && (
            <Spinner className='size-3.5 text-text-tertiary' />
          )}
        </div>

        <div className='flex-1' />

        <div className='hidden h-7 w-full max-w-[260px] items-center gap-1.5 rounded-[5px] border border-border bg-background px-2 transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50 sm:flex'>
          <Search className='size-3 shrink-0 text-text-tertiary' />
          <input
            defaultValue={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder='Search by email or EBMS ID...'
            className='flex-1 bg-transparent text-[13px] outline-none placeholder:text-text-tertiary'
          />
        </div>
      </header>

      {/* ── Body ── */}
      <div className='flex-1 overflow-y-auto'>
        {/* Column header */}
        {!isMobile && (carts.length > 0 || isLoading || isPlaceholderData) && (
          <div
            className={cn(
              'sticky top-0 z-10 flex select-none items-center border-b border-border bg-bg-secondary text-[13px] font-medium text-text-tertiary',
              bp === 'tablet' ? 'gap-4 px-5 py-1' : 'gap-6 px-6 py-1',
            )}
          >
            <SortableHeader
              field='ebms_id'
              label='User'
              sortField={sortField}
              sortDir={sortDir}
              onSort={handleSort}
              className='w-[100px] shrink-0'
            />
            <SortableHeader
              field='in_level'
              label='Role'
              sortField={sortField}
              sortDir={sortDir}
              onSort={handleSort}
              className='w-[80px] shrink-0'
            />
            <SortableHeader
              field='email'
              label='Email'
              sortField={sortField}
              sortDir={sortDir}
              onSort={handleSort}
              className='min-w-0 flex-1'
            />
            <SortableHeader
              field='updated_at'
              label='Last update'
              sortField={sortField}
              sortDir={sortDir}
              onSort={handleSort}
              className='w-[180px] shrink-0'
            />
            <div className='w-[110px] shrink-0 text-right'>Total</div>
            <div className='w-[28px] shrink-0' />
          </div>
        )}

        {/* Content */}
        {error ? (
          <PageEmpty
            icon={ShoppingCart}
            title={isNotConfigured ? 'Legacy carts not configured' : 'Failed to load carts'}
            description={
              isNotConfigured
                ? 'Set Storefront URL and X-CRM-KEY Secret in Project settings.'
                : errMsg || 'Storefront returned an error or is unreachable.'
            }
          />
        ) : isLoading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center border-b border-border-light',
                bp === 'tablet' ? 'gap-4 px-5 py-2.5' : 'gap-6 px-6 py-2.5',
              )}
            >
              <Skeleton className='h-3.5 w-[80px] rounded' />
              <Skeleton className='h-[18px] w-[60px] rounded-[4px]' />
              <Skeleton className='h-3.5 w-[200px] rounded' />
              <Skeleton className='h-3.5 w-[140px] rounded' />
              <Skeleton className='ml-auto h-3.5 w-[80px] rounded' />
              <div className='w-[28px] shrink-0' />
            </div>
          ))
        ) : carts.length === 0 ? (
          <PageEmpty
            icon={ShoppingCart}
            title='No abandoned carts'
            description={
              search
                ? 'No carts match your search.'
                : 'No customer has items in their cart right now.'
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
            {carts.map((cart) => (
              <LegacyCartRow key={cart.user_id} cart={cart} isMobile={isMobile} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {!error && (
        <div
          className={cn(
            'shrink-0 border-t border-border py-2',
            isMobile ? 'px-3.5' : 'px-6',
          )}
        >
          <Pagination totalCount={totalCount} />
        </div>
      )}
    </div>
  )
}

// ── Sortable header ─────────────────────────────────────────

function SortableHeader({
  field,
  label,
  sortField,
  sortDir,
  onSort,
  className,
}: {
  field: SortField
  label: string
  sortField: SortField | null
  sortDir: SortDir
  onSort: (field: SortField) => void
  className?: string
}) {
  const active = sortField === field
  return (
    <button
      type='button'
      className={cn(
        'group inline-flex items-center gap-1 text-left transition-colors duration-[80ms] hover:text-foreground',
        active && 'text-foreground',
        className,
      )}
      onClick={() => onSort(field)}
    >
      {label}
      {active ? (
        sortDir === 'asc' ? (
          <ArrowUp className='size-3' />
        ) : (
          <ArrowDown className='size-3' />
        )
      ) : (
        <ArrowUp className='size-3 opacity-30 transition-opacity group-hover:opacity-60' />
      )}
    </button>
  )
}

// ── Route ───────────────────────────────────────────────────

export const Route = createFileRoute('/_authenticated/legacy-carts/')({
  component: LegacyCartsPage,
  head: () => ({
    meta: [{ title: 'Abandoned Carts' }],
  }),
})
