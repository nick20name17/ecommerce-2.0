import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Plus, X } from 'lucide-react'
import { useState } from 'react'

import { ProposalModal } from './-components/proposal-modal'
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
import { useOrdering } from '@/hooks/use-ordering'
import { useProjectId } from '@/hooks/use-project-id'
import {
  useLimitParam,
  useOffsetParam,
  useProposalAutoidParam,
  useSearchParam,
  useStatusParam
} from '@/hooks/use-query-params'

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
  const [search] = useSearchParam()
  const [offset, setOffset] = useOffsetParam()
  const [limit] = useLimitParam()
  const [projectId] = useProjectId()
  const [autoidFromUrl, setAutoidFromUrl] = useProposalAutoidParam()
  const [status, setStatus] = useStatusParam()
  const { sorting, setSorting, ordering } = useOrdering()
  const [viewProposal, setViewProposal] = useState<Proposal | null>(null)

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
    <div className='flex h-full flex-col gap-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Proposals</h1>
        <Button onClick={() => navigate({ to: '/create' })}>
          <Plus />
          Create Proposal
        </Button>
      </div>

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
        onView={setViewProposal}
      />

      <Pagination totalCount={data?.count ?? 0} />

      <ProposalModal
        proposal={viewProposal}
        open={!!viewProposal}
        onOpenChange={(open) => !open && setViewProposal(null)}
      />
    </div>
  )
}
