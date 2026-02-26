'use no memo'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { useNavigate } from '@tanstack/react-router'
import { Loader2, MoreHorizontal, Paperclip, ShoppingCart, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

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

export type ProposalRow = Proposal & { _pending?: true }

interface ProposalColumnsOptions {
  isSuperAdmin: boolean
  projectId: number | null
  onDelete: (proposal: Proposal) => void
  onAttachments: (proposal: Proposal) => void
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

export const getProposalColumns = ({
  isSuperAdmin,
  projectId,
  onDelete,
  onAttachments
}: ProposalColumnsOptions): ColumnDef<ProposalRow>[] => [
  createExpanderColumn<ProposalRow>(),
  {
    accessorKey: 'quote',
    header: ({ column }) => <ColumnHeader column={column} title="Quote" />,
    cell: ({ row }) => {
      if (row.original._pending)
        return (
          <span className='text-muted-foreground flex items-center gap-2'>
            <Loader2 className='size-4 animate-spin' />
            Pending…
          </span>
        )
      const v = row.original.quote
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="block max-w-[120px] truncate">{v ?? '—'}</span>
          </TooltipTrigger>
          <TooltipContent>{v ?? '—'}</TooltipContent>
        </Tooltip>
      )
    },
    size: 130,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <ColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      if (row.original._pending)
        return (
          <Badge variant='outline' className='text-muted-foreground font-medium'>
            Creating…
          </Badge>
        )
      return (
        <Badge variant={getProposalStatusBadgeVariant(row.original.status)}>
          {getProposalStatusLabel(row.original.status)}
        </Badge>
      )
    },
    size: 110,
  },
  {
    accessorKey: 'b_name',
    header: ({ column }) => <ColumnHeader column={column} title="Customer" />,
    cell: ({ row }) => {
      if (row.original._pending) return <span className='text-muted-foreground'>—</span>
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
    cell: ({ row }) => (row.original._pending ? '—' : formatDate(row.original.qt_date)),
    size: 120,
  },
  {
    accessorKey: 'total',
    header: ({ column }) => <ColumnHeader column={column} title="Total" />,
    cell: ({ row }) =>
      row.original._pending ? '—' : formatCurrency(row.original.total),
    size: 110,
  },
  {
    id: 'actions',
    cell: ({ row }: { row: { original: ProposalRow } }) => {
      if (row.original._pending) return null
      return (
        <div className='flex justify-center'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon-sm'>
                <MoreHorizontal />
                <span className='sr-only'>Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => onAttachments(row.original)}>
                <Paperclip className='size-4' />
                Attachments
              </DropdownMenuItem>
              {isSuperAdmin && (
                <ToOrderAction proposal={row.original} projectId={projectId} />
              )}
              <DropdownMenuItem variant='destructive' onClick={() => onDelete(row.original)}>
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
]
