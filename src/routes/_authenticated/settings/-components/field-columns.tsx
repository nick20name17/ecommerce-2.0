'use no memo'

import type { ColumnDef } from '@tanstack/react-table'

import type { FieldConfigRow } from '@/api/field-config/schema'
import { ColumnHeader } from '@/components/common/data-table/column-header'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export const getFieldColumns = (
  entity: string,
  onFieldToggle: (entity: string, fieldName: string, enabled: boolean) => void,
  isPending: boolean
): ColumnDef<FieldConfigRow>[] => [
  {
    id: 'field_name',
    accessorKey: 'field',
    header: ({ column }) => (
      <ColumnHeader
        column={column}
        title='Field'
      />
    ),
    cell: ({ row }) => <span className='block truncate text-sm'>{row.original.field}</span>,
    size: 280,
    minSize: 200
  },
  {
    id: 'state',
    accessorKey: 'enabled',
    header: ({ column }) => (
      <ColumnHeader
        column={column}
        title='State'
      />
    ),
    cell: ({ row }) => {
      const { field, default: isDefault, enabled } = row.original

      if (isDefault) {
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className='inline-flex'>
                <Switch
                  checked
                  disabled
                  aria-label='Default field, always enabled'
                />
              </span>
            </TooltipTrigger>
            <TooltipContent>Default field, always enabled</TooltipContent>
          </Tooltip>
        )
      }

      return (
        <Switch
          checked={enabled}
          disabled={isPending}
          aria-label={enabled ? 'Disable field' : 'Enable field'}
          onCheckedChange={(checked) => onFieldToggle(entity, field, checked)}
        />
      )
    },
    size: 100,
    enableSorting: false
  }
]
