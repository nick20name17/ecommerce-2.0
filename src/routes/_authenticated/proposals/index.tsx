import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowDown,
  ArrowUp,
  FileText,
  ListTodo,
  Loader2,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  StickyNote,
  Trash2,
  UserPlus,
  UserRound,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { ProposalAssignDialog } from './-components/proposal-assign-dialog'
import { ProposalDeleteDialog } from './-components/proposal-delete-dialog'
import { getFieldConfigQuery } from '@/api/field-config/query'
import { CommandBarCreate } from '@/components/tasks/command-bar-create'
import { FilterChip, FilterPopover, IProposals, InitialsAvatar, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import { getProposalsQuery } from '@/api/proposal/query'
import type { Proposal, ProposalParams } from '@/api/proposal/schema'
import { PageEmpty } from '@/components/common/page-empty'
import { PresetPicker } from '@/components/common/filters/preset-picker'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { EntityAttachmentsDialog } from '@/components/common/entity-attachments/entity-attachments-dialog'
import { EntityNotesSheet } from '@/components/common/entity-notes/entity-notes-sheet'
import { Pagination } from '@/components/common/filters/pagination'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PROPOSAL_STATUS, PROPOSAL_STATUS_CLASS, PROPOSAL_STATUS_LABELS, getProposalStatusLabel } from '@/constants/proposal'
import type { ProposalStatus } from '@/constants/proposal'
import { isAdmin } from '@/constants/user'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { useProjectId } from '@/hooks/use-project-id'
import { formatCurrency, formatDate, getInitials, getUserDisplayName } from '@/helpers/formatters'
import { cn } from '@/lib/utils'
import {
  useAutoidParam,
  useLimitParam,
  useOffsetParam,
  useSearchParam,
} from '@/hooks/use-query-params'
import { useAuth } from '@/providers/auth'

// ── Helpers ──────────────────────────────────────────────────

// ── Constants ────────────────────────────────────────────────

const STATUS_DOT_COLORS: Record<string, string> = {
  O: 'bg-blue-500',
  A: 'bg-emerald-500',
  L: 'bg-red-500',
  C: 'bg-slate-400',
  E: 'bg-amber-500',
  N: 'bg-violet-500',
  H: 'bg-slate-400',
}

type ProposalSortField = 'quote' | 'b_name' | 'qt_date' | 'total'
type SortDir = 'asc' | 'desc'

const FILTER_STATUSES: { value: ProposalStatus; label: string }[] = [
  { value: PROPOSAL_STATUS.open, label: 'Open' },
  { value: PROPOSAL_STATUS.accepted, label: 'Accepted' },
  { value: PROPOSAL_STATUS.lost, label: 'Lost' },
  { value: PROPOSAL_STATUS.expired, label: 'Expired' },
  { value: PROPOSAL_STATUS.cancelled, label: 'Cancelled' },
  { value: PROPOSAL_STATUS.onHold, label: 'On Hold' },
]

// ── Page Component ───────────────────────────────────────────

const ProposalsPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const isTablet = bp === 'tablet'
  const [search, setSearch] = useSearchParam()
  const [offset, setOffset] = useOffsetParam()
  const [limit] = useLimitParam()
  const [projectId] = useProjectId()
  const [autoidFromUrl, setAutoidFromUrl] = useAutoidParam()

  const canAssign = !!user?.role && isAdmin(user.role)

  const [sortField, setSortField] = useState<ProposalSortField | null>('quote')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const [activeStatus, setActiveStatus] = useState<ProposalStatus | null>(PROPOSAL_STATUS.open)
  const [assignedToMe, setAssignedToMe] = useState(false)
  const [activePresetId, setActivePresetId] = useState<number | null>(null)
  const [proposalToDelete, setProposalToDelete] = useState<Proposal | null>(null)
  const [proposalForAttachments, setProposalForAttachments] = useState<Proposal | null>(null)
  const [proposalForNotes, setProposalForNotes] = useState<Proposal | null>(null)
  const [proposalToAssign, setProposalToAssign] = useState<Proposal | null>(null)
  const [proposalForTask, setProposalForTask] = useState<Proposal | null>(null)

  const ordering = sortField ? (sortDir === 'desc' ? `-${sortField}` : sortField) : undefined

  const handleSort = (field: ProposalSortField) => {
    if (sortField === field) {
      if (sortDir === 'asc') setSortDir('desc')
      else { setSortField(null); setSortDir('asc') }
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const selectStatus = (s: ProposalStatus) => {
    setActiveStatus((prev) => (prev === s ? null : s))
    setActivePresetId(null)
    setOffset(null)
  }

  const toggleAssignedToMe = () => {
    setAssignedToMe((v) => !v)
    setActivePresetId(null)
    setOffset(null)
  }

  const selectPreset = (id: number | null) => {
    setActivePresetId(id)
    if (id != null) {
      setActiveStatus(null)
      setAssignedToMe(false)
    }
    setOffset(null)
  }

  const clearAllFilters = () => {
    setActiveStatus(null)
    setAssignedToMe(false)
    setActivePresetId(null)
    setOffset(null)
  }

  const hasFilters = activeStatus !== null || assignedToMe || activePresetId !== null

  const params: ProposalParams = {
    search: search || undefined,
    autoid: autoidFromUrl ?? undefined,
    offset,
    limit,
    status: activeStatus ?? undefined,
    project_id: projectId ?? undefined,
    ordering,
    notes: true,
    assigned_to: assignedToMe ? 'me' : undefined,
    preset_id: activePresetId ?? undefined,
  }

  const { data, refetch, isLoading } = useQuery(getProposalsQuery(params))

  const { data: _fieldConfig } = useQuery(getFieldConfigQuery(projectId))

  const results = data?.results ?? []
  const proposalInResults =
    autoidFromUrl != null && autoidFromUrl !== '' && results.some((p) => p.autoid === autoidFromUrl)

  const refetchTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  useEffect(() => {
    if (!autoidFromUrl) return
    if (proposalInResults) {
      refetchTimersRef.current.forEach(clearTimeout)
      refetchTimersRef.current = []
      return
    }
    refetchTimersRef.current = [
      setTimeout(() => refetch(), 3000),
      setTimeout(() => refetch(), 6000),
    ]
    return () => {
      refetchTimersRef.current.forEach(clearTimeout)
      refetchTimersRef.current = []
    }
  }, [autoidFromUrl, proposalInResults, refetch])

  const hasPendingAutoid = autoidFromUrl != null && autoidFromUrl !== '' && !proposalInResults

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* Header */}
      <header className={cn('flex h-12 shrink-0 items-center gap-2.5 border-b border-border', isMobile ? 'px-3.5' : 'px-6')}>
        <SidebarTrigger className='-ml-1' />
        <div className='flex items-center gap-1.5'>
          <PageHeaderIcon icon={IProposals} color={PAGE_COLORS.proposals} />
          <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>Proposals</h1>
        </div>

        <PresetPicker
          entityType='proposal'
          value={activePresetId}
          onChange={selectPreset}
        />

        <div className='flex-1' />

        <div className='hidden h-7 w-full max-w-[260px] items-center gap-1.5 rounded-[5px] border border-border bg-background px-2 transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50 sm:flex'>
          <Search className='size-3 shrink-0 text-text-tertiary' />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setOffset(null)
            }}
            placeholder='Search by quote number...'
            className='flex-1 bg-transparent text-[13px] outline-none placeholder:text-text-tertiary'
          />
        </div>

        <div className='flex items-center gap-1.5'>
          <FilterPopover
            label='Status'
            active={activeStatus !== null}
            icon={<div className={cn('size-2.5 rounded-full', activeStatus ? STATUS_DOT_COLORS[activeStatus] : 'bg-current')} />}
          >
            {FILTER_STATUSES.map((s) => {
              const selected = activeStatus === s.value
              return (
                <button
                  key={s.value}
                  type='button'
                  className={cn(
                    'flex w-full items-center gap-2 rounded-[5px] px-2 py-[3px] text-left text-[13px] font-medium',
                    'transition-colors duration-[80ms] hover:bg-bg-hover'
                  )}
                  onClick={() => selectStatus(s.value)}
                >
                  <div className={cn(
                    'flex size-3.5 items-center justify-center rounded-full border transition-colors duration-[80ms]',
                    selected ? 'border-primary bg-primary' : 'border-border'
                  )}>
                    {selected && <div className='size-1.5 rounded-full bg-primary-foreground' />}
                  </div>
                  <div className={cn('size-2.5 shrink-0 rounded-full', STATUS_DOT_COLORS[s.value] ?? 'bg-slate-400')} />
                  <span className='flex-1'>{s.label}</span>
                </button>
              )
            })}
          </FilterPopover>

          <button
            type='button'
            className={cn(
              'inline-flex h-7 items-center gap-1 rounded-[5px] border px-2 text-[13px] font-medium',
              'transition-colors duration-[80ms] hover:bg-bg-hover',
              assignedToMe
                ? 'border-primary/30 bg-primary/5 text-foreground'
                : 'border-border bg-background text-text-secondary'
            )}
            onClick={toggleAssignedToMe}
          >
            <UserRound className='size-3' />
            Assigned to me
          </button>

          <button
            type='button'
            className='inline-flex h-7 items-center gap-1 rounded-[5px] bg-primary px-2 text-[13px] font-semibold text-primary-foreground transition-colors duration-[80ms] hover:opacity-90 sm:px-2.5'
            onClick={() => navigate({ to: '/create' })}
          >
            <Plus className='size-3.5' />
            <span className='hidden sm:inline'>Create Proposal</span>
          </button>
        </div>
      </header>

      {/* Active filter chips */}
      {(hasFilters || autoidFromUrl) && (
        <div className={cn('flex shrink-0 flex-wrap items-center gap-1.5 border-b border-border py-1.5', isMobile ? 'px-3.5' : 'px-6')}>
          {hasFilters && (
            <button
              type='button'
              className='text-[13px] font-medium text-text-tertiary transition-colors duration-[80ms] hover:text-foreground'
              onClick={clearAllFilters}
            >
              Clear
            </button>
          )}
          {activeStatus && (
            <FilterChip onRemove={() => setActiveStatus(null)}>
              <span className='text-text-tertiary'>Status is</span>
              <div className={cn('size-2 rounded-full', STATUS_DOT_COLORS[activeStatus] ?? 'bg-slate-400')} />
              {PROPOSAL_STATUS_LABELS[activeStatus]}
            </FilterChip>
          )}
          {assignedToMe && (
            <FilterChip onRemove={() => setAssignedToMe(false)}>
              <UserRound className='size-3 text-text-tertiary' />
              Assigned to me
            </FilterChip>
          )}
          {autoidFromUrl && (
            <FilterChip onRemove={() => setAutoidFromUrl(null)}>
              <span className='text-text-tertiary'>Proposal:</span>
              {autoidFromUrl}
            </FilterChip>
          )}
        </div>
      )}

      {/* Proposal list */}
      <div className='flex-1 overflow-y-auto'>
        {/* Column labels */}
        {!isMobile && (results.length > 0 || isLoading) && (
          <div
            className={cn(
              'sticky top-0 z-10 flex select-none items-center border-b border-border bg-bg-secondary text-[13px] font-medium text-text-tertiary',
              isTablet ? 'gap-4 px-5 py-1' : 'gap-6 px-6 py-1',
            )}
          >
            <ProposalSortableHeader field='quote' label='Quote / Customer' sortField={sortField} sortDir={sortDir} onSort={handleSort} className='min-w-0 flex-1' />
            <div className='w-[88px] shrink-0'>Status</div>
            {!isTablet && <ProposalSortableHeader field='qt_date' label='Date' sortField={sortField} sortDir={sortDir} onSort={handleSort} className='w-[92px] shrink-0' />}
            <ProposalSortableHeader field='total' label='Total' sortField={sortField} sortDir={sortDir} onSort={handleSort} className='w-[100px] shrink-0 justify-end text-right' />
            <div className='w-[120px] shrink-0'>Responsible</div>
            <div className='w-[46px] shrink-0' />
            <div className='w-[28px] shrink-0' />
          </div>
        )}

        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) =>
            isMobile ? (
              <div key={i} className='border-b border-border-light px-3.5 py-2'>
                <div className='mb-1 flex items-center gap-2'>
                  <Skeleton className='size-1.5 shrink-0 rounded-full' />
                  <Skeleton className='h-3.5 w-24 rounded' />
                  <div className='flex-1' />
                  <Skeleton className='h-3.5 w-16 rounded' />
                </div>
                <div className='flex items-center gap-2 pl-[20px]'>
                  <Skeleton className='h-3.5 w-20 rounded' />
                  <Skeleton className='h-3.5 w-16 rounded' />
                </div>
              </div>
            ) : (
              <div
                key={i}
                className={cn(
                  'flex items-center border-b border-border-light',
                  isTablet ? 'gap-4 px-5 py-1.5' : 'gap-6 px-6 py-1.5'
                )}
              >
                <div className='flex min-w-0 flex-1 items-center gap-2'>
                  <Skeleton className='h-3.5 w-16 rounded' />
                  <Skeleton className='h-3.5 w-24 rounded' />
                </div>
                <div className='w-[88px] shrink-0'><Skeleton className='h-[18px] w-[60px] rounded-[4px]' /></div>
                {!isTablet && <div className='w-[92px] shrink-0'><Skeleton className='h-3.5 w-[70px] rounded' /></div>}
                <div className='w-[100px] shrink-0'><Skeleton className='ml-auto h-3.5 w-[60px] rounded' /></div>
                <div className='w-[120px] shrink-0'><Skeleton className='h-3.5 w-[70px] rounded' /></div>
                <div className='w-[46px] shrink-0' />
                <div className='w-[28px] shrink-0' />
              </div>
            )
          )
        ) : results.length === 0 && !hasPendingAutoid ? (
          <PageEmpty icon={FileText} title='No matching proposals' description='Try adjusting your search or filters.' />
        ) : (
          <>
            {hasPendingAutoid && (
              <PendingProposalRow autoid={autoidFromUrl} isMobile={isMobile} />
            )}
            {results.map((proposal) => (
              <ProposalRow
                key={proposal.autoid}
                proposal={proposal}
                isMobile={isMobile}
                isTablet={isTablet}
                canAssign={canAssign}
                onDelete={setProposalToDelete}
                onAttachments={setProposalForAttachments}
                onNotes={setProposalForNotes}
                onAssign={setProposalToAssign}
                onCreateTask={setProposalForTask}
                onClick={() => navigate({ to: '/proposals/$proposalId', params: { proposalId: proposal.autoid } })}
              />
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div className={cn('shrink-0 border-t border-border py-2', isMobile ? 'px-3.5' : 'px-6')}>
        <Pagination totalCount={data?.count ?? 0} />
      </div>

      {/* Dialogs */}
      <ProposalDeleteDialog
        proposal={proposalToDelete}
        projectId={projectId}
        open={!!proposalToDelete}
        onOpenChange={(open) => !open && setProposalToDelete(null)}
      />
      <EntityAttachmentsDialog
        entityType='proposal'
        entityLabel={
          proposalForAttachments
            ? `Proposal ${proposalForAttachments.quote ?? proposalForAttachments.autoid}`
            : ''
        }
        autoid={proposalForAttachments?.autoid ?? ''}
        projectId={projectId}
        open={!!proposalForAttachments}
        onOpenChange={(open) => !open && setProposalForAttachments(null)}
      />
      <ProposalAssignDialog
        proposal={proposalToAssign}
        open={!!proposalToAssign}
        onOpenChange={(open) => !open && setProposalToAssign(null)}
        projectId={projectId}
      />
      <EntityNotesSheet
        open={!!proposalForNotes}
        onOpenChange={(open) => !open && setProposalForNotes(null)}
        entityType='proposal'
        entityLabel={
          proposalForNotes
            ? `Proposal ${proposalForNotes.quote ?? proposalForNotes.autoid}`
            : ''
        }
        autoid={proposalForNotes?.autoid ?? ''}
        projectId={projectId}
      />
      {proposalForTask && (
        <CommandBarCreate
          onClose={() => setProposalForTask(null)}
          defaultLinkedProposalAutoid={proposalForTask.autoid}
        />
      )}
    </div>
  )
}

// ── Pending Proposal Row ─────────────────────────────────────

function PendingProposalRow({ autoid, isMobile }: { autoid: string; isMobile: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 border-b border-border-light py-2 opacity-60',
        isMobile ? 'px-3.5' : 'px-6',
      )}
    >
      <Loader2 className='size-3.5 animate-spin text-text-tertiary' />
      <span className='text-[13px] text-text-tertiary'>
        Creating proposal {autoid}…
      </span>
    </div>
  )
}

// ── Proposal Row ─────────────────────────────────────────────

function ProposalRow({
  proposal,
  isMobile,
  isTablet,
  canAssign,
  onDelete,
  onAttachments,
  onNotes,
  onAssign,
  onCreateTask,
  onClick,
}: {
  proposal: Proposal
  isMobile: boolean
  isTablet: boolean
  canAssign: boolean
  onDelete: (proposal: Proposal) => void
  onAttachments: (proposal: Proposal) => void
  onNotes: (proposal: Proposal) => void
  onAssign: (proposal: Proposal) => void
  onCreateTask: (proposal: Proposal) => void
  onClick: () => void
}) {
  const quote = proposal.quote?.trim() || `#${proposal.b_id}`
  const statusLabel = getProposalStatusLabel(proposal.status)
  const statusClass = PROPOSAL_STATUS_CLASS[proposal.status] ?? ''
  const dotColor = STATUS_DOT_COLORS[proposal.status] ?? 'bg-slate-400'

  const noteCount = typeof proposal.notes_count === 'number' ? proposal.notes_count : Array.isArray(proposal.notes) ? proposal.notes.length : 0

  if (isMobile) {
    return (
      <div
        className='cursor-pointer border-b border-border-light px-3.5 py-2 transition-colors duration-100 hover:bg-bg-hover'
        onClick={onClick}
      >
        <div className='mb-1 flex items-center gap-2'>
          <div className={cn('size-1.5 shrink-0 rounded-full', dotColor)} />
          <span className='min-w-0 flex-1 truncate text-[13px] font-medium text-foreground'>
            {quote}
          </span>
          <span className='shrink-0 text-[13px] font-medium tabular-nums text-foreground'>
            {formatCurrency(proposal.total, '—')}
          </span>
        </div>
        <div className='flex flex-wrap items-center gap-2 pl-[20px]'>
          <span className='text-[13px] text-text-tertiary'>{proposal.b_name || '—'}</span>
          <span className='text-[13px] text-text-tertiary'>{statusLabel}</span>
          {proposal.qt_date && (
            <span className='text-[13px] tabular-nums text-text-tertiary'>
              {formatDate(proposal.qt_date)}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group/row flex cursor-pointer items-center border-b border-border-light text-foreground transition-colors duration-100 hover:bg-bg-hover',
        isTablet ? 'gap-4 px-5 py-1.5' : 'gap-6 px-6 py-1.5',
      )}
      onClick={onClick}
    >
      {/* Quote + customer */}
      <div className='flex min-w-0 flex-1 items-center gap-2'>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className='shrink-0 truncate text-[13px] font-medium' style={{ maxWidth: '40%' }}>{quote}</span>
          </TooltipTrigger>
          <TooltipContent side='top'>{quote}</TooltipContent>
        </Tooltip>
        <span className='min-w-0 truncate text-[13px] text-text-tertiary'>
          {proposal.b_name || '—'}
        </span>
      </div>

      {/* Status */}
      <div className='w-[88px] shrink-0'>
        <span className={cn('inline-flex items-center rounded-[4px] border px-1.5 py-0.5 text-[11px] font-semibold leading-none', statusClass)}>
          {statusLabel}
        </span>
      </div>

      {/* Date */}
      {!isTablet && (
        <div className='w-[92px] shrink-0 text-[13px] tabular-nums text-text-secondary'>
          {proposal.qt_date ? formatDate(proposal.qt_date) : <span className='text-text-tertiary'>&mdash;</span>}
        </div>
      )}

      {/* Total */}
      <div className='w-[100px] shrink-0 text-right text-[13px] font-medium tabular-nums text-foreground'>
        {formatCurrency(proposal.total, '—')}
      </div>

      {/* Responsible */}
      <div className='w-[120px] shrink-0'>
        {(() => {
          const assigned = proposal.assigned_users?.length ? proposal.assigned_users : proposal.assigned_user ? [proposal.assigned_user] : []
          const first = assigned[0]
          if (canAssign) {
            return (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type='button'
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-[5px] px-1 py-0.5 text-[13px] transition-colors duration-75 hover:bg-bg-active',
                      first ? 'text-text-secondary' : 'text-text-tertiary'
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      onAssign(proposal)
                    }}
                  >
                    {first ? (
                      <>
                        <InitialsAvatar initials={getInitials(getUserDisplayName(first))} size={16} />
                        <span className='truncate'>{getUserDisplayName(first)}</span>
                        {assigned.length > 1 && <span className='text-[11px] text-text-tertiary'>+{assigned.length - 1}</span>}
                      </>
                    ) : (
                      <>
                        <UserPlus className='size-3.5' />
                        <span>Assign</span>
                      </>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {first ? `Assigned to ${assigned.map((u) => getUserDisplayName(u)).join(', ')} — click to change` : 'Assign a sales user'}
                </TooltipContent>
              </Tooltip>
            )
          }
          if (first) {
            return (
              <span className='inline-flex items-center gap-1.5 px-1 py-0.5 text-[13px] text-text-secondary'>
                <InitialsAvatar initials={getInitials(getUserDisplayName(first))} size={16} />
                <span className='truncate'>{getUserDisplayName(first)}</span>
                {assigned.length > 1 && <span className='text-[11px] text-text-tertiary'>+{assigned.length - 1}</span>}
              </span>
            )
          }
          return <span className='px-1 text-[13px] text-text-tertiary'>&mdash;</span>
        })()}
      </div>

      {/* Notes */}
      <div className='flex w-[46px] shrink-0 justify-center'>
        <button
          type='button'
          className={cn(
            'inline-flex h-[26px] w-[46px] items-center justify-center gap-1 rounded-[6px] border text-[12px] font-medium tabular-nums transition-colors duration-[80ms]',
            noteCount > 0
              ? 'border-border bg-bg-secondary text-text-secondary hover:bg-bg-active'
              : 'border-transparent text-text-quaternary hover:bg-bg-hover hover:text-text-tertiary',
          )}
          aria-label='Open notes'
          onClick={(e) => {
            e.stopPropagation()
            onNotes(proposal)
          }}
        >
          <StickyNote className='size-3.5' />
          {noteCount > 0 && <span>{noteCount}</span>}
        </button>
      </div>

      {/* Actions */}
      <div
        className='flex w-[28px] shrink-0 items-center justify-center'
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role='group'
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type='button'
              className='inline-flex size-6 items-center justify-center rounded-[6px] text-text-tertiary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground'
              aria-label='Proposal actions'
            >
              <MoreHorizontal className='size-4' />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align='end'
            className='w-[200px] rounded-[8px] p-1'
            style={{ boxShadow: 'var(--dropdown-shadow)' }}
          >
            {canAssign && (
              <DropdownMenuItem
                className='cursor-pointer gap-2 rounded-[6px] px-2 py-1 text-[13px]'
                onClick={() => onAssign(proposal)}
              >
                <UserPlus className='size-3.5' />
                Assign
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className='cursor-pointer gap-2 rounded-[6px] px-2 py-1 text-[13px]'
              onClick={() => onCreateTask(proposal)}
            >
              <ListTodo className='size-3.5' />
              Create Task
            </DropdownMenuItem>
            <DropdownMenuItem
              className='cursor-pointer gap-2 rounded-[6px] px-2 py-1 text-[13px]'
              onClick={() => onAttachments(proposal)}
            >
              <Paperclip className='size-3.5' />
              Attachments
            </DropdownMenuItem>
            <DropdownMenuItem
              variant='destructive'
              className='cursor-pointer gap-2 rounded-[6px] px-2 py-1 text-[13px]'
              onClick={() => onDelete(proposal)}
            >
              <Trash2 className='size-3.5' />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// ── Sortable Header ─────────────────────────────────────────

function ProposalSortableHeader({
  field,
  label,
  sortField,
  sortDir,
  onSort,
  className,
}: {
  field: ProposalSortField
  label: string
  sortField: ProposalSortField | null
  sortDir: SortDir
  onSort: (field: ProposalSortField) => void
  className?: string
}) {
  const active = sortField === field
  return (
    <button
      type='button'
      className={cn(
        'group inline-flex items-center gap-1 text-left transition-colors duration-[80ms] hover:text-foreground',
        active && 'text-foreground',
        className
      )}
      onClick={() => onSort(field)}
    >
      {label}
      {active ? (
        sortDir === 'asc'
          ? <ArrowUp className='size-3' />
          : <ArrowDown className='size-3' />
      ) : (
        <ArrowUp className='size-3 opacity-30 group-hover:opacity-60 transition-opacity' />
      )}
    </button>
  )
}

export const Route = createFileRoute('/_authenticated/proposals/')({
  component: ProposalsPage,
  head: () => ({
    meta: [{ title: 'Proposals' }],
  }),
})
