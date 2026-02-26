import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { FileText, Plus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { ProposalDeleteDialog } from './-components/proposal-delete-dialog'
import { ProposalsDataTable } from './-components/proposals-data-table'
import { getProposalsQuery } from '@/api/proposal/query'
import type { Proposal, ProposalParams } from '@/api/proposal/schema'
import { EntityAttachmentsDialog } from '@/components/common/entity-attachments/entity-attachments-dialog'
import { Pagination } from '@/components/common/filters/pagination'
import { SearchFilter } from '@/components/common/filters/search'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PROPOSAL_STATUS } from '@/constants/proposal'
import type { ProposalStatus } from '@/constants/proposal'
import { isSuperAdmin } from '@/constants/user'
import { useOrdering } from '@/hooks/use-ordering'
import { useProjectId } from '@/hooks/use-project-id'
import {
  useAutoidParam,
  useLimitParam,
  useOffsetParam,
  useSearchParam,
  useStatusParam
} from '@/hooks/use-query-params'
import { useAuth } from '@/providers/auth'

export const Route = createFileRoute('/_authenticated/proposals/')({
  component: ProposalsPage,
  head: () => ({
    meta: [{ title: 'Proposals' }]
  })
})

const STATUS_TABS = [
  { label: 'Open', value: PROPOSAL_STATUS.open },
  { label: 'Accepted', value: PROPOSAL_STATUS.accepted },
  { label: 'Lost', value: PROPOSAL_STATUS.lost },
  { label: 'Expired', value: PROPOSAL_STATUS.expired },
  { label: 'All Proposals', value: 'all' }
] as const

const VALID_STATUS_VALUES = new Set<string>(Object.values(PROPOSAL_STATUS))

function ProposalsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [search] = useSearchParam()
  const [offset, setOffset] = useOffsetParam()
  const [limit] = useLimitParam()
  const [projectId] = useProjectId()
  const [autoidFromUrl, setAutoidFromUrl] = useAutoidParam()
  const [status, setStatus] = useStatusParam()
  const { sorting, setSorting, ordering } = useOrdering()

  const userIsSuperAdmin = user?.role ? isSuperAdmin(user.role) : false

  const [proposalToDelete, setProposalToDelete] = useState<Proposal | null>(null)
  const [proposalForAttachments, setProposalForAttachments] = useState<Proposal | null>(null)

  const activeStatus = status ?? PROPOSAL_STATUS.open

  const apiStatus: ProposalStatus | undefined =
    activeStatus !== 'all' && VALID_STATUS_VALUES.has(activeStatus)
      ? (activeStatus as ProposalStatus)
      : undefined

  const params: ProposalParams = {
    quote: search || undefined,
    autoid: autoidFromUrl ?? undefined,
    offset,
    limit,
    ordering,
    status: apiStatus,
    project_id: projectId ?? undefined
  }

  const { data, refetch, isLoading, isPlaceholderData } = useQuery({
    ...getProposalsQuery(params),
    placeholderData: keepPreviousData
  })

  const results = data?.results ?? []
  const proposalInResults =
    autoidFromUrl != null &&
    autoidFromUrl !== '' &&
    results.some((p) => p.autoid === autoidFromUrl)

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
      setTimeout(() => refetch(), 6000)
    ]
    return () => {
      refetchTimersRef.current.forEach(clearTimeout)
      refetchTimersRef.current = []
    }
  }, [autoidFromUrl, proposalInResults, refetch])

  const hasPendingAutoid =
    autoidFromUrl != null && autoidFromUrl !== '' && !proposalInResults
  const pendingProposalPlaceholder: Proposal & { _pending?: true } = hasPendingAutoid
    ? {
        autoid: autoidFromUrl,
        b_id: '',
        quote: '',
        b_name: '',
        qt_date: null,
        status: 'N',
        tax: '0',
        subtotal: '0',
        total: '0',
        _pending: true
      }
    : (null as unknown as Proposal & { _pending?: true })
  const tableData: (Proposal & { _pending?: true })[] = hasPendingAutoid
    ? [pendingProposalPlaceholder, ...results]
    : results

  const handleStatusChange = (value: string) => {
    setStatus(value)
    setOffset(null)
  }

  return (
    <div className='flex h-full flex-col gap-5'>
      <header className='flex items-start justify-between'>
        <div className='flex items-center gap-3'>
          <div className='bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg'>
            <FileText className='size-5' />
          </div>
          <div>
            <h1 className='text-2xl font-semibold tracking-tight'>Proposals</h1>
            <p className='text-muted-foreground text-sm'>{data?.count ?? 0} total</p>
          </div>
        </div>
        <Button
          onClick={() => navigate({ to: '/create' })}
          className='gap-2'
        >
          <Plus className='size-4' />
          Create Proposal
        </Button>
      </header>

      <div className='flex flex-wrap items-center justify-between gap-2'>
        <Tabs
          value={activeStatus}
          onValueChange={handleStatusChange}
        >
          <TabsList variant='line'>
            {STATUS_TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <SearchFilter placeholder='Search by quote number...' />
      </div>

      {autoidFromUrl && (
        <Badge
          variant='secondary'
          className='w-fit cursor-pointer gap-1 pr-1 transition-opacity hover:opacity-80'
          onClick={() => setAutoidFromUrl(null)}
        >
          Proposal: {autoidFromUrl}
          <button
            type='button'
            className='hover:bg-muted rounded-sm p-0.5'
            onClick={(e) => {
              e.stopPropagation()
              setAutoidFromUrl(null)
            }}
            aria-label='Clear proposal filter'
          >
            <X className='size-3' />
          </button>
        </Badge>
      )}

      <ProposalsDataTable
        data={tableData}
        isLoading={isLoading || isPlaceholderData}
        sorting={sorting}
        setSorting={setSorting}
        isSuperAdmin={userIsSuperAdmin}
        projectId={projectId}
        onDelete={setProposalToDelete}
        onAttachments={setProposalForAttachments}
      />

      <Pagination totalCount={data?.count ?? 0} />

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
    </div>
  )
}
