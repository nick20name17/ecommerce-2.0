'use no memo'

import { type Table, flexRender } from '@tanstack/react-table'

import { TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface DataTableHeaderProps<TData> {
  table: Table<TData>
  fitWidth?: boolean
}

export const DataTableHeader = <TData,>({
  table,
  fitWidth = false,
}: DataTableHeaderProps<TData>) => {
  const colCount = table.getHeaderGroups()[0]?.headers.length ?? 1
  const widthPercent = fitWidth ? `${100 / colCount}%` : undefined

  return (
    <TableHeader className={cn('bg-muted sticky top-0 z-10')}>
      {table?.getHeaderGroups()?.map((headerGroup) => (
        <TableRow
          className='border-none'
          key={headerGroup?.id}
        >
          {headerGroup.headers.map((header) => {
            const size = fitWidth
              ? widthPercent
              : header.getSize()
                ? `${header.getSize()}px`
                : 'auto'
            const style = fitWidth
              ? { width: size, minWidth: 0 }
              : { width: size, minWidth: size, maxWidth: size }

            return (
              <TableHead
                style={style}
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
