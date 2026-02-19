import type { ColumnDef } from '@tanstack/react-table'
import { Eye } from 'lucide-react'

import type { PayloadLog } from '@/api/payload-log/schema'
import { ColumnHeader } from '@/components/common/data-table/column-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, formatResponseTime } from '@/helpers/formatters'

const METHOD_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  GET: 'secondary',
  POST: 'default',
  PATCH: 'outline',
  PUT: 'outline',
  DELETE: 'destructive'
}

function getStatusVariant(code: number): 'success' | 'destructive' | 'secondary' {
  if (code >= 200 && code < 300) return 'success'
  if (code >= 400) return 'destructive'
  return 'secondary'
}

interface PayloadLogColumnsOptions {
  onView: (log: PayloadLog) => void
}

export const getPayloadLogColumns = ({
  onView
}: PayloadLogColumnsOptions): ColumnDef<PayloadLog>[] => [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => <span className='font-mono text-xs'>{row.original.id}</span>,
    size: 70
  },
  {
    accessorKey: 'method',
    header: 'Method',
    cell: ({ row }) => {
      const method = row.original.method
      return (
        <Badge
          variant={METHOD_VARIANT[method] ?? 'secondary'}
          className='font-mono text-[11px]'
        >
          {method}
        </Badge>
      )
    },
    size: 80
  },
  {
    accessorKey: 'entity',
    header: 'Entity',
    cell: ({ row }) => (
      <span className='text-muted-foreground text-sm'>{row.original.entity || '—'}</span>
    ),
    size: 100
  },
  {
    accessorKey: 'status_code',
    header: 'Status',
    cell: ({ row }) => {
      const code = row.original.status_code
      return (
        <Badge
          variant={getStatusVariant(code)}
          className='font-mono text-[11px]'
        >
          {code}
        </Badge>
      )
    },
    size: 70
  },
  {
    accessorKey: 'duration_ms',
    header: ({ column }) => (
      <ColumnHeader
        column={column}
        title='Duration'
      />
    ),
    cell: ({ row }) => (
      <span className='text-muted-foreground text-xs'>
        {formatResponseTime(row.original.duration_ms)}
      </span>
    ),
    size: 80
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <ColumnHeader
        column={column}
        title='Created At'
      />
    ),
    cell: ({ row }) => (
      <span className='text-muted-foreground text-xs'>
        {formatDate(row.original.created_at, 'dateTime')}
      </span>
    ),
    size: 130
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <Button
        variant='ghost'
        size='icon-sm'
        onClick={() => onView(row.original)}
      >
        <Eye />
        <span className='sr-only'>View details</span>
      </Button>
    ),
    size: 50,
    enableSorting: false
  }
]
