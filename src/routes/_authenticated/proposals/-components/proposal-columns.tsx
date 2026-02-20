'use no memo'

import type { ColumnDef } from '@tanstack/react-table'
import { Eye, MoreHorizontal } from 'lucide-react'

import type { Proposal } from '@/api/proposal/schema'
import { ColumnHeader } from '@/components/common/data-table/column-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  getProposalStatusBadgeVariant,
  getProposalStatusLabel,
} from '@/constants/proposal'
import { formatCurrency, formatDate } from '@/helpers/formatters'

interface ProposalColumnsOptions {
  onView: (proposal: Proposal) => void
}

export const getProposalColumns = ({
  onView,
}: ProposalColumnsOptions): ColumnDef<Proposal>[] => [
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
    cell: ({ row }) => {
      const proposal = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(proposal)}>
              <Eye />
              View
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    size: 50,
    enableSorting: false,
  },
]
