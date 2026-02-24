'use no memo'

import type { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal } from 'lucide-react'

import type { TableField } from '@/api/data-schema/schema'
import { ColumnHeader } from '@/components/common/data-table/column-header'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export const getFieldColumns = (): ColumnDef<TableField>[] => [
  {
    id: 'ebms_field_name',
    accessorFn: (row) => `${row.dbTable}.${row.name.toUpperCase()}`,
    header: ({ column }) => <ColumnHeader column={column} title='EBMS Field Name' />,
    cell: ({ row }) => {
      const fieldName = `${row.original.dbTable}.${row.original.name.toUpperCase()}`

      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className='block truncate text-sm'>{fieldName}</span>
          </TooltipTrigger>
          <TooltipContent>{fieldName}</TooltipContent>
        </Tooltip>
      )
    },
    size: 280,
    minSize: 200
  },
  {
    id: 'state',
    accessorKey: 'isEnabled',
    header: ({ column }) => <ColumnHeader column={column} title='State' />,
    cell: ({ row }) => (
      <Switch
        checked={row.original.isEnabled}
        aria-label={row.original.isEnabled ? 'Disable field' : 'Enable field'}
      />
    ),
    size: 100,
    enableSorting: false
  },
  {
    id: 'actions',
    cell: () => (
      <div className='flex justify-end'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size='icon-sm' className='text-muted-foreground'>
              <MoreHorizontal className='size-4' />
              <span className='sr-only'>Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem disabled>No actions available</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
    size: 48,
    enableSorting: false
  }
]
