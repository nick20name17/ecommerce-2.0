import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { FileText, Search } from 'lucide-react'
import { useState } from 'react'

import { getProposalsQuery } from '@/api/proposal/query'
import type { ProposalParams } from '@/api/proposal/schema'
import { PageEmpty } from '@/components/common/page-empty'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  PROPOSAL_STATUS_CLASS,
  getProposalStatusLabel,
} from '@/constants/proposal'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { useProjectId } from '@/hooks/use-project-id'
import { formatCurrency, formatDate } from '@/helpers/formatters'
import { cn } from '@/lib/utils'
import type { Proposal } from '@/api/proposal/schema'

const STATUS_DOT_COLORS: Record<string, string> = {
  O: 'bg-blue-500',
  A: 'bg-emerald-500',
  L: 'bg-red-500',
  C: 'bg-slate-400',
  E: 'bg-amber-500',
  N: 'bg-violet-500',
  H: 'bg-slate-400',
}

interface CustomerProposalsTabProps {
  customerId: string
}

export const CustomerProposalsTab = ({ customerId }: CustomerProposalsTabProps) => {
  const navigate = useNavigate()
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const isTablet = bp === 'tablet'
  const [projectId] = useProjectId()
  const [search, setSearch] = useState('')

  const params: ProposalParams = {
    b_id: customerId,
    search: search || undefined,
    project_id: projectId ?? undefined,
    limit: 200,
  }

  const { data, isLoading } = useQuery({
    ...getProposalsQuery(params),
    placeholderData: keepPreviousData,
  })

  const proposals = data?.results ?? []

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* Search bar */}
      <div
        className={cn(
          'flex shrink-0 items-center gap-2 border-b border-border py-2',
          isMobile ? 'px-5' : 'px-6'
        )}
      >
        <div className='flex flex-1 items-center gap-1.5 rounded-[6px] border border-border bg-background px-2.5 py-1.5'>
          <Search className='size-3.5 shrink-0 text-text-tertiary' />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search proposals...'
            className='flex-1 bg-transparent text-[13px] outline-none placeholder:text-text-tertiary'
          />
        </div>
      </div>

      {/* Table header */}
      {!isMobile && (
        <div
          className={cn(
            'grid shrink-0 items-center border-b border-border bg-bg-secondary/60',
            isTablet
              ? 'grid-cols-[1fr_80px] gap-3 px-5 py-1.5'
              : 'grid-cols-[1fr_100px_80px] gap-4 px-6 py-1.5'
          )}
        >
          <div className='min-w-0 text-[12px] font-medium uppercase tracking-[0.04em] text-text-tertiary'>
            Quote
          </div>
          {!isTablet && (
            <div className='min-w-0 text-[12px] font-medium uppercase tracking-[0.04em] text-text-tertiary'>
              Date
            </div>
          )}
          <div className='text-right text-[12px] font-medium uppercase tracking-[0.04em] text-text-tertiary'>
            Total
          </div>
        </div>
      )}

      {/* Proposal list */}
      <div className='flex-1 overflow-y-auto'>
        {isLoading ? (
          <div className='space-y-0'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-3 border-b border-border-light py-2',
                  isMobile ? 'px-5' : 'px-6'
                )}
              >
                <div className='h-3 w-16 animate-pulse rounded bg-border' />
                <div className='h-3 flex-1 animate-pulse rounded bg-border' />
                <div className='h-3 w-14 animate-pulse rounded bg-border' />
              </div>
            ))}
          </div>
        ) : proposals.length === 0 ? (
          <PageEmpty icon={FileText} title='No proposals found' description='This customer has no proposals yet.' compact />
        ) : (
          proposals.map((proposal) => (
            <ProposalRow
              key={proposal.autoid}
              proposal={proposal}
              isMobile={isMobile}
              isTablet={isTablet}
              onClick={() =>
                navigate({
                  to: '/proposals/$proposalId',
                  params: { proposalId: proposal.autoid },
                })
              }
            />
          ))
        )}
      </div>

      {/* Footer */}
      {proposals.length > 0 && (
        <div
          className={cn(
            'shrink-0 border-t border-border py-1.5',
            isMobile ? 'px-5' : 'px-6'
          )}
        >
          <p className='text-[13px] tabular-nums text-text-tertiary'>
            {proposals.length} proposal{proposals.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  )
}

// ── Proposal Row ───────────────────────────────────────────────

function ProposalRow({
  proposal,
  isMobile,
  isTablet,
  onClick,
}: {
  proposal: Proposal
  isMobile: boolean
  isTablet: boolean
  onClick: () => void
}) {
  const quote = proposal.quote?.trim() || `#${proposal.b_id}`
  const statusLabel = getProposalStatusLabel(proposal.status)
  const statusClass = PROPOSAL_STATUS_CLASS[proposal.status] ?? ''
  const dotColor = STATUS_DOT_COLORS[proposal.status] ?? 'bg-slate-400'

  if (isMobile) {
    return (
      <div
        className='cursor-pointer border-b border-border-light px-5 py-2 transition-colors duration-100 hover:bg-bg-hover'
        onClick={onClick}
      >
        <div className='flex items-center justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <span className='text-[13px] font-medium text-foreground'>
              {quote}
            </span>
            <StatusBadge label={statusLabel} statusClass={statusClass} dotColor={dotColor} />
          </div>
          <span className='text-[13px] font-medium tabular-nums text-foreground'>
            {formatCurrency(proposal.total, '—')}
          </span>
        </div>
        {proposal.qt_date && (
          <div className='mt-0.5 text-[13px] tabular-nums text-text-tertiary'>
            {formatDate(proposal.qt_date)}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group/row grid cursor-pointer items-center border-b border-border-light transition-colors duration-100 hover:bg-bg-hover',
        isTablet
          ? 'grid-cols-[1fr_80px] gap-3 px-5 py-1.5'
          : 'grid-cols-[1fr_100px_80px] gap-4 px-6 py-1.5'
      )}
      onClick={onClick}
    >
      {/* Quote + Status */}
      <div className='flex min-w-0 items-center gap-2'>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className='truncate text-[13px] font-medium text-foreground'>
              {quote}
            </span>
          </TooltipTrigger>
          <TooltipContent side='top'>{quote}</TooltipContent>
        </Tooltip>
        <StatusBadge label={statusLabel} statusClass={statusClass} dotColor={dotColor} />
      </div>

      {/* Date */}
      {!isTablet && (
        <div className='min-w-0 text-[13px] tabular-nums text-text-tertiary'>
          {proposal.qt_date ? formatDate(proposal.qt_date) : '—'}
        </div>
      )}

      {/* Total */}
      <div className='text-right text-[13px] font-medium tabular-nums text-foreground'>
        {formatCurrency(proposal.total, '—')}
      </div>
    </div>
  )
}

// ── Status Badge ────────────────────────────────────────────

function StatusBadge({
  label,
  statusClass,
  dotColor,
}: {
  label: string
  statusClass: string
  dotColor: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none',
        statusClass,
      )}
    >
      <span className={cn('size-1.5 rounded-full', dotColor)} />
      {label}
    </span>
  )
}
