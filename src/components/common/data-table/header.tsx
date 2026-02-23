'use no memo'

import { type Table, flexRender } from '@tanstack/react-table'

import { TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface DataTableHeaderProps<TData> {
  table: Table<TData>
}

export const DataTableHeader = <TData,>({ table }: DataTableHeaderProps<TData>) => {
  return (
    <TableHeader className={cn('bg-muted sticky top-0 z-10')}>
      {table?.getHeaderGroups()?.map((headerGroup) => (
        <TableRow
          className='border-none'
          key={headerGroup?.id}
        >
          {headerGroup.headers.map((header) => {
            const size = header.getSize() ? `${header.getSize()}px` : 'auto'

            return (
              <TableHead
                style={{
                  width: size,
                  minWidth: size,
                  maxWidth: size
                }}
                className='border-b border-border text-xs font-medium uppercase tracking-wider text-muted-foreground'
                key={header.id}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            )
          })}
        </TableRow>
      ))}
    </TableHeader>
  )
}
