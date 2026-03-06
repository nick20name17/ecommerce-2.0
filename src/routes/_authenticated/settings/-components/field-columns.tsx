'use no memo'

import type { ColumnDef } from '@tanstack/react-table'
import { Check } from 'lucide-react'
import { useState } from 'react'

import type { FieldConfigRow } from '@/api/field-config/schema'
import { ColumnHeader } from '@/components/common/data-table/column-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const AliasCell = ({
  entity,
  field,
  alias,
  onSubmit,
  isPending
}: {
  entity: string
  field: string
  alias: string | null
  onSubmit: (entity: string, field: string, alias: string) => void
  isPending: boolean
}) => {
  const [value, setValue] = useState(alias ?? '')
  const isDirty = value !== (alias ?? '')
  const trimmed = value.trim()

  return (
    <div className='flex min-w-0 items-center gap-1.5'>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder='Display name'
        className='h-8 min-w-0 flex-1 text-sm'
        disabled={isPending}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            if (isDirty) onSubmit(entity, field, trimmed)
          }
        }}
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type='button'
            variant='secondary'
            size='icon-sm'
            className='shrink-0'
            disabled={!isDirty || isPending}
            aria-label='Save alias'
            onClick={() => onSubmit(entity, field, trimmed)}
          >
            <Check className='size-3.5' />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Save alias</TooltipContent>
      </Tooltip>
    </div>
  )
}

export const getFieldColumns = (
  entity: string,
  onFieldToggle: (entity: string, fieldName: string, enabled: boolean) => void,
  onAliasSubmit: (entity: string, fieldName: string, alias: string) => void,
  isPending: boolean,
  isAliasPending: boolean
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
    cell: ({ row }) => (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className='block truncate text-sm'>{row.original.field}</span>
        </TooltipTrigger>
        <TooltipContent>{row.original.field}</TooltipContent>
      </Tooltip>
    ),
    size: 280,
    minSize: 200
  },
  {
    id: 'alias',
    accessorKey: 'alias',
    header: ({ column }) => (
      <ColumnHeader
        column={column}
        title='Alias'
      />
    ),
    cell: ({ row }) => (
      <AliasCell
        key={`${row.original.field}-${row.original.alias ?? ''}`}
        entity={entity}
        field={row.original.field}
        alias={row.original.alias}
        onSubmit={onAliasSubmit}
        isPending={isAliasPending}
      />
    ),
    size: 260,
    minSize: 180
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
