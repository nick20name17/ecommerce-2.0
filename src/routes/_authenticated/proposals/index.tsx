import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
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
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { ProposalAssignDialog } from './-components/proposal-assign-dialog'
import { ProposalDeleteDialog } from './-components/proposal-delete-dialog'
import { getFieldConfigQuery } from '@/api/field-config/query'
import { CommandBarCreate } from '@/components/tasks/command-bar-create'
import { IProposals, PAGE_COLORS, PageHeaderIcon, ViewToggle, type ViewOption } from '@/components/ds'
import { getProposalsQuery } from '@/api/proposal/query'
import { getEntityNotesQuery } from '@/api/note/query'
import type { Proposal, ProposalParams } from '@/api/proposal/schema'
import { PageEmpty } from '@/components/common/page-empty'
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
import { PROPOSAL_STATUS, PROPOSAL_STATUS_CLASS, getProposalStatusLabel } from '@/constants/proposal'
import type { ProposalStatus } from '@/constants/proposal'
import { isAdmin } from '@/constants/user'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { useProjectId } from '@/hooks/use-project-id'
import { formatCurrency, formatDate } from '@/helpers/formatters'
import { cn } from '@/lib/utils'
import {
  useAutoidParam,
  useLimitParam,
  useOffsetParam,
  useSearchParam,
  useStatusParam,
} from '@/hooks/use-query-params'
import { useAuth } from '@/providers/auth'

// ── Constants ────────────────────────────────────────────────

const STATUS_TABS: ViewOption<string>[] = [
  { label: 'Open', value: PROPOSAL_STATUS.open },
  { label: 'Accepted', value: PROPOSAL_STATUS.accepted },
  { label: 'Lost', value: PROPOSAL_STATUS.lost },
  { label: 'Expired', value: PROPOSAL_STATUS.expired },
  { label: 'All Proposals', value: 'all' },
]

const VALID_STATUS_VALUES = new Set<string>(Object.values(PROPOSAL_STATUS))

const STATUS_DOT_COLORS: Record<string, string> = {
  O: 'bg-blue-500',
  A: 'bg-emerald-500',
  L: 'bg-red-500',
  C: 'bg-slate-400',
  E: 'bg-amber-500',
  N: 'bg-violet-500',
  H: 'bg-slate-400',
}

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
  const [status, setStatus] = useStatusParam()

  const canAssign = !!user?.role && isAdmin(user.role)

  const [proposalToDelete, setProposalToDelete] = useState<Proposal | null>(null)
  const [proposalForAttachments, setProposalForAttachments] = useState<Proposal | null>(null)
  const [proposalForNotes, setProposalForNotes] = useState<Proposal | null>(null)
  const [proposalToAssign, setProposalToAssign] = useState<Proposal | null>(null)
  const [proposalForTask, setProposalForTask] = useState<Proposal | null>(null)

  const activeStatus = status ?? PROPOSAL_STATUS.open

  const apiStatus: ProposalStatus | undefined =
    activeStatus !== 'all' && VALID_STATUS_VALUES.has(activeStatus)
      ? (activeStatus as ProposalStatus)
      : undefined

  const params: ProposalParams = {
    search: search || undefined,
    autoid: autoidFromUrl ?? undefined,
    offset,
    limit,
    status: apiStatus,
    project_id: projectId ?? undefined,
  }

  const { data, refetch, isLoading, isPlaceholderData } = useQuery({
    ...getProposalsQuery(params),
    placeholderData: keepPreviousData,
  })

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

  const handleStatusChange = (value: string) => {
    setStatus(value)
    setOffset(null)
  }

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* Header */}
      <header className='flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-6'>
        <div className='flex items-center gap-1.5'>
          <PageHeaderIcon icon={IProposals} color={PAGE_COLORS.proposals} />
          <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>Proposals</h1>
        </div>

        <ViewToggle options={STATUS_TABS} value={activeStatus} onChange={handleStatusChange} />

        <div className='flex-1' />

        <div className='hidden h-7 w-[260px] items-center gap-1.5 rounded-[5px] border border-border bg-background px-2 transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50 sm:flex'>
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

        <button
          type='button'
          className='inline-flex h-7 items-center gap-1 rounded-[5px] bg-primary px-2 text-[13px] font-semibold text-primary-foreground transition-colors duration-[80ms] hover:opacity-90 sm:px-2.5'
          onClick={() => navigate({ to: '/create' })}
        >
          <Plus className='size-3.5' />
          <span className='hidden sm:inline'>Create Proposal</span>
        </button>
      </header>

      {/* Autoid filter chip */}
      {autoidFromUrl && (
        <div className='flex shrink-0 items-center gap-1.5 border-b border-border px-6 py-1.5'>
          <span className='inline-flex items-center gap-1 rounded-[5px] border border-border bg-bg-secondary px-2 py-0.5 text-[13px] font-medium text-foreground'>
            Proposal: {autoidFromUrl}
            <button
              type='button'
              className='ml-0.5 rounded-[3px] p-0.5 text-text-tertiary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground'
              onClick={() => setAutoidFromUrl(null)}
              aria-label='Clear proposal filter'
            >
              <X className='size-3' />
            </button>
          </span>
        </div>
      )}

      {/* Proposal list */}
      <div className='flex-1 overflow-y-auto'>
        {/* Column labels */}
        {!isMobile && (results.length > 0 || isLoading || isPlaceholderData) && (
          <div
            className={cn(
              'sticky top-0 z-10 flex select-none items-center border-b border-border bg-bg-secondary/60 text-[13px] font-medium text-text-tertiary backdrop-blur-sm',
              isTablet ? 'gap-4 px-5 py-1' : 'gap-6 px-6 py-1',
            )}
          >
            <div className='min-w-0 flex-1'>Quote / Customer</div>
            <div className='w-[88px] shrink-0'>Status</div>
            {!isTablet && <div className='w-[92px] shrink-0'>Date</div>}
            <div className='w-[100px] shrink-0 text-right'>Total</div>
            <div className='w-[62px] shrink-0' />
            <div className='w-[28px] shrink-0' />
          </div>
        )}

        {isLoading || isPlaceholderData ? (
          Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center border-b border-border-light',
                isMobile ? 'gap-2 px-3.5 py-2.5' : isTablet ? 'gap-4 px-5 py-1.5' : 'gap-6 px-6 py-1.5',
              )}
            >
              <div className='flex min-w-0 flex-1 items-center gap-2'>
                <Skeleton className='h-3.5 w-16 rounded' />
                <Skeleton className='h-3.5 w-24 rounded' />
              </div>
              {!isMobile && (
                <>
                  <div className='w-[88px] shrink-0'><Skeleton className='h-[18px] w-[60px] rounded-[4px]' /></div>
                  {!isTablet && <div className='w-[92px] shrink-0'><Skeleton className='h-3.5 w-[70px] rounded' /></div>}
                  <div className='w-[100px] shrink-0'><Skeleton className='ml-auto h-3.5 w-[60px] rounded' /></div>
                  <div className='w-[62px] shrink-0' />
                  <div className='w-[28px] shrink-0' />
                </>
              )}
            </div>
          ))
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
                projectId={projectId}
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
      <div className='shrink-0 border-t border-border px-6 py-2'>
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
  projectId,
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
  projectId: number | null
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

  const { data: notes } = useQuery({
    ...getEntityNotesQuery('proposal', proposal.autoid, projectId),
    staleTime: 5 * 60 * 1000,
  })
  const noteCount = notes?.length ?? 0

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

      {/* Notes */}
      <div className='flex w-[62px] shrink-0 justify-center'>
        <button
          type='button'
          className={cn(
            'inline-flex items-center gap-1.5 rounded-[6px] border px-2 py-1 text-[13px] font-medium transition-colors duration-[80ms]',
            noteCount > 0
              ? 'border-border bg-bg-secondary text-text-secondary hover:bg-bg-active'
              : 'border-transparent text-text-tertiary hover:bg-bg-hover hover:text-text-secondary',
          )}
          aria-label='Open notes'
          onClick={(e) => {
            e.stopPropagation()
            onNotes(proposal)
          }}
        >
          <StickyNote className='size-3.5' />
          <span className='tabular-nums'>{noteCount}</span>
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

export const Route = createFileRoute('/_authenticated/proposals/')({
  component: ProposalsPage,
  head: () => ({
    meta: [{ title: 'Proposals' }],
  }),
})
