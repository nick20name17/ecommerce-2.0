'use no memo'

import { type Cell, type Row, flexRender } from '@tanstack/react-table'
import { Fragment } from 'react/jsx-runtime'

import { DataTableEmpty } from './empty'
import { DataTableSkeleton } from './skeleton'
import type { DataTableProps } from './types'
import { TableBody, TableCell, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

const TableBodyCell = <TData,>({
  cell,
  fitWidth,
  widthPercent,
}: {
  cell: Cell<TData, unknown>
  fitWidth?: boolean
  widthPercent?: string
}) => {
  const size = cell.column.getSize()
  const style = fitWidth && widthPercent
    ? { width: widthPercent, minWidth: 0 }
    : { width: size, minWidth: size, maxWidth: size }

  return (
    <TableCell
      key={cell.id}
      style={style}
      className={cn('border-b border-border/40')}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </TableCell>
  )
}

const TableBodyRow = <TData,>({
  row,
  onRowClick,
  fitWidth,
  widthPercent,
}: {
  row: Row<TData>
  onRowClick?: (row: Row<TData>) => void
  fitWidth?: boolean
  widthPercent?: string
}) => {
  return (
    <TableRow
      key={row.id}
      id={`row-${row.id}`}
      className={cn(
        'last:[&>td]:border-b-0 transition-colors duration-150',
        onRowClick ? 'hover:bg-muted/50 cursor-pointer' : 'hover:bg-muted/30'
      )}
      data-state={row.getIsSelected() && 'selected'}
      onClick={() => onRowClick?.(row)}
    >
      {row.getVisibleCells().map((cell) => (
        <TableBodyCell
          key={cell.id}
          cell={cell}
          fitWidth={fitWidth}
          widthPercent={widthPercent}
        />
      ))}
    </TableRow>
  )
}

const TableBodyExpandedRow = <TData,>({
  row,
  renderSubComponent
}: {
  row: Row<TData>
  renderSubComponent: (row: Row<TData>) => React.ReactElement
}) => (
  <tr className='expanded-row'>
    <TableCell
      colSpan={row.getVisibleCells().length}
      className='border-b p-0'
    >
      <div
        className='relative overflow-hidden py-2.5 pr-2.5 pl-10.5'
        data-slot='expanded-row-content'
      >
        {renderSubComponent(row)}
      </div>
    </TableCell>
  </tr>
)

export const DataTableBody = <TData,>({
  table,
  isLoading = false,
  renderSubComponent,
  onRowClick,
  fitWidth = false,
}: DataTableProps<TData>) => {
  const colCount = table.getAllColumns().length
  const widthPercent = fitWidth ? `${100 / colCount}%` : undefined

  if (isLoading) {
    return <DataTableSkeleton headers={table.getHeaderGroups()[0].headers} />
  }

  const columntsLength = table.getAllColumns().length

  if (!table.getRowModel().rows?.length) {
    return <DataTableEmpty columnsCount={columntsLength} />
  }

  return (
    <TableBody>
      {table.getRowModel().rows.map((row) => {
        return (
          <Fragment key={row.id}>
            <TableBodyRow
              row={row}
              onRowClick={onRowClick}
              fitWidth={fitWidth}
              widthPercent={widthPercent}
            />
            {row.getIsExpanded() && renderSubComponent ? (
              <TableBodyExpandedRow
                row={row}
                renderSubComponent={renderSubComponent}
              />
            ) : null}
          </Fragment>
        )
      })}
    </TableBody>
  )
}
