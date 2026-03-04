'use no memo'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Loader2, MoreHorizontal, Paperclip, ShoppingCart, Trash2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

import type { FieldConfigResponse } from '@/api/field-config/schema'
import { PROPOSAL_QUERY_KEYS } from '@/api/proposal/query'
import type { Proposal } from '@/api/proposal/schema'
import { proposalService } from '@/api/proposal/service'
import { createExpanderColumn } from '@/components/common/data-table/columns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getProposalStatusBadgeVariant, getProposalStatusLabel } from '@/constants/proposal'
import type { ProposalStatus } from '@/constants/proposal'
import {
  buildDynamicDataColumns,
  getColumnLabel,
  getOrderedDataKeys
} from '@/helpers/dynamic-columns'
import type { DynamicCellFormatter } from '@/helpers/dynamic-columns'
import { formatCurrency, formatDate } from '@/helpers/formatters'

export type ProposalRow = Proposal & { _pending?: true }

interface ProposalColumnsOptions {
  fieldConfig: FieldConfigResponse | null | undefined
  data: ProposalRow[]
  isSuperAdmin: boolean
  projectId: number | null
  onDelete: (proposal: Proposal) => void
  onAttachments: (proposal: Proposal) => void
  onAssign?: (proposal: Proposal) => void
  canAssign?: boolean
}

const ToOrderAction = ({
  proposal,
  projectId
}: {
  proposal: Proposal
  projectId: number | null
}) => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const mutation = useMutation({
    mutationFn: () => proposalService.toOrder(proposal.autoid, projectId!)
  })

  const handleToOrder = async () => {
    await toast.promise(mutation.mutateAsync(), {
      loading: 'Converting proposal to order...',
      success: (result) => {
        queryClient.invalidateQueries({ queryKey: PROPOSAL_QUERY_KEYS.lists() })
        navigate({ to: '/orders', search: { autoid: result.AUTOID, status: 'all' } })
        return 'Proposal converted to order successfully'
      },
      error: 'Failed to convert proposal to order'
    })
  }

  return (
    <DropdownMenuItem
      disabled={!projectId || mutation.isPending}
      onClick={handleToOrder}
    >
      <ShoppingCart className='size-4' />
      To Order
    </DropdownMenuItem>
  )
}

const PROPOSAL_FORMATTERS: Partial<Record<string, DynamicCellFormatter<ProposalRow>>> = {
  quote: (v, row) => {
    if (row._pending)
      return (
        <span className='text-muted-foreground flex items-center gap-2'>
          <Loader2 className='size-4 animate-spin' />
          Pending…
        </span>
      )
    const val = v ?? row.quote ?? '—'
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className='block max-w-[120px] truncate'>{String(val)}</span>
        </TooltipTrigger>
        <TooltipContent>{String(val)}</TooltipContent>
      </Tooltip>
    )
  },
  status: (v, row) => {
    if (row._pending)
      return (
        <Badge
          variant='outline'
          className='text-muted-foreground font-medium'
        >
          Creating…
        </Badge>
      )
    return (
      <Badge variant={getProposalStatusBadgeVariant((v ?? row.status) as ProposalStatus)}>
        {getProposalStatusLabel((v ?? row.status) as ProposalStatus)}
      </Badge>
    )
  },
  qt_date: (v, row) => (row._pending ? '—' : formatDate((v ?? row.qt_date) as string | null)),
  total: (v, row) => (row._pending ? '—' : formatCurrency((v ?? row.total) as string, '—'))
}

export const getProposalColumns = ({
  fieldConfig,
  data,
  isSuperAdmin,
  projectId,
  onDelete,
  onAttachments,
  onAssign,
  canAssign
}: ProposalColumnsOptions): ColumnDef<ProposalRow>[] => {
  const entity = 'proposal'
  const orderedKeys = getOrderedDataKeys(data, entity, fieldConfig)
  const getLabel = (key: string) => getColumnLabel(key, entity, fieldConfig)
  const dataColumns = buildDynamicDataColumns<ProposalRow>(orderedKeys, getLabel, {
    formatters: PROPOSAL_FORMATTERS
  })

  const actionsColumn: ColumnDef<ProposalRow> = {
    id: 'actions',
    cell: ({ row }) => {
      if (row.original._pending) return null
      return (
        <div className='flex justify-center'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='icon-sm'
              >
                <MoreHorizontal />
                <span className='sr-only'>Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              {canAssign && onAssign && (
                <DropdownMenuItem onClick={() => onAssign(row.original)}>
                  <UserPlus className='size-4' />
                  Assign
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onAttachments(row.original)}>
                <Paperclip className='size-4' />
                Attachments
              </DropdownMenuItem>
              {isSuperAdmin && (
                <ToOrderAction
                  proposal={row.original}
                  projectId={projectId}
                />
              )}
              <DropdownMenuItem
                variant='destructive'
                onClick={() => onDelete(row.original)}
              >
                <Trash2 className='size-4' />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
    size: 50,
    enableSorting: false
  }

  return [createExpanderColumn<ProposalRow>(), ...dataColumns, actionsColumn]
}
