'use no memo'

import { useMutation } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, ShoppingCart, Trash2 } from 'lucide-react'

import { PROPOSAL_QUERY_KEYS } from '@/api/proposal/query'
import type { Proposal } from '@/api/proposal/schema'
import { proposalService } from '@/api/proposal/service'
import { ColumnHeader } from '@/components/common/data-table/column-header'
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
import {
  getProposalStatusBadgeVariant,
  getProposalStatusLabel,
} from '@/constants/proposal'
import { formatCurrency, formatDate } from '@/helpers/formatters'

interface ProposalColumnsOptions {
  isSuperAdmin: boolean
  projectId: number | null
  onDelete: (proposal: Proposal) => void
}

const ToOrderAction = ({
  proposal,
  projectId
}: {
  proposal: Proposal
  projectId: number | null
}) => {
  const mutation = useMutation({
    mutationFn: () => proposalService.toOrder(proposal.autoid, projectId!),
    meta: {
      successMessage: 'Proposal converted to order successfully',
      invalidatesQuery: PROPOSAL_QUERY_KEYS.lists()
    }
  })

  return (
    <DropdownMenuItem
      disabled={!projectId || mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      <ShoppingCart className='size-4' />
      To Order
    </DropdownMenuItem>
  )
}

export const getProposalColumns = ({
  isSuperAdmin,
  projectId,
  onDelete
}: ProposalColumnsOptions): ColumnDef<Proposal>[] => [
  createExpanderColumn<Proposal>(),
  {
    accessorKey: 'quote',
    header: ({ column }) => <ColumnHeader column={column} title="Quote" />,
    cell: ({ row }) => {
      const v = row.original.quote
      return <span className="block max-w-[120px] truncate">{v ?? '—'}</span>
    },
    size: 130,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <ColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <Badge variant={getProposalStatusBadgeVariant(row.original.status)}>
        {getProposalStatusLabel(row.original.status)}
      </Badge>
    ),
    size: 110,
  },
  {
    accessorKey: 'b_name',
    header: ({ column }) => <ColumnHeader column={column} title="Customer" />,
    cell: ({ row }) => {
      const v = row.original.b_name
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="block max-w-[160px] truncate">{v ?? '—'}</span>
          </TooltipTrigger>
          <TooltipContent>{v ?? '—'}</TooltipContent>
        </Tooltip>
      )
    },
    size: 160,
  },
  {
    accessorKey: 'qt_date',
    header: ({ column }) => <ColumnHeader column={column} title="Quote Date" />,
    cell: ({ row }) => formatDate(row.original.qt_date),
    size: 120,
  },
  {
    accessorKey: 'total',
    header: ({ column }) => <ColumnHeader column={column} title="Total" />,
    cell: ({ row }) => formatCurrency(row.original.total),
    size: 110,
  },
  {
    id: 'actions',
    cell: ({ row }: { row: { original: Proposal } }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' size='icon-sm'>
            <MoreHorizontal />
            <span className='sr-only'>Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          {isSuperAdmin && (
            <ToOrderAction proposal={row.original} projectId={projectId} />
          )}
          <DropdownMenuItem variant='destructive' onClick={() => onDelete(row.original)}>
            <Trash2 className='size-4' />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    size: 50,
    enableSorting: false
  }
]
