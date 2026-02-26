import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { FileText, Plus, X } from 'lucide-react'
import { useState } from 'react'

import { EntityAttachmentsDialog } from '@/components/common/entity-attachments/entity-attachments-dialog'
import { ProposalDeleteDialog } from './-components/proposal-delete-dialog'
import { ProposalsDataTable } from './-components/proposals-data-table'
import { getProposalsQuery } from '@/api/proposal/query'
import type { Proposal, ProposalParams } from '@/api/proposal/schema'
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

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getProposalsQuery(params),
    placeholderData: keepPreviousData
  })

  const handleStatusChange = (value: string) => {
    setStatus(value)
    setOffset(null)
  }

  return (
    <div className='flex h-full flex-col gap-5'>
      <header className='flex items-start justify-between'>
        <div className='flex items-center gap-3'>
          <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
            <FileText className='size-5' />
          </div>
          <div>
            <h1 className='text-2xl font-semibold tracking-tight'>Proposals</h1>
            <p className='text-sm text-muted-foreground'>{data?.count ?? 0} total</p>
          </div>
        </div>
        <Button onClick={() => navigate({ to: '/create' })} className='gap-2'>
          <Plus className='size-4' />
          Create Proposal
        </Button>
      </header>

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

      <div className='flex flex-wrap items-center gap-2'>
        <SearchFilter placeholder='Search by quote number...' />
        {autoidFromUrl && (
          <Badge
            variant='secondary'
            className='cursor-pointer gap-1 pr-1 transition-opacity hover:opacity-80'
            onClick={() => setAutoidFromUrl(null)}
          >
            Proposal: {autoidFromUrl}
            <button
              type='button'
              className='rounded-sm p-0.5 hover:bg-muted'
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
      </div>

      <ProposalsDataTable
        data={data?.results ?? []}
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
