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
  fitWidth = false
}: DataTableHeaderProps<TData>) => {
  const colCount = table.getHeaderGroups()[0]?.headers.length ?? 1
  const widthPercent = fitWidth ? `${100 / colCount}%` : undefined

  return (
    <TableHeader className={cn('bg-bg-secondary/60 border-border sticky top-0 z-10 border-b')}>
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
              : { width: size, minWidth: size }

            return (
              <TableHead
                style={style}
                className='border-border text-text-tertiary border-b text-[13px] font-medium first:pl-6 last:pr-6'
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
