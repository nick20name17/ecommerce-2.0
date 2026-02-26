'use no memo'

import { DataTableBody } from './body'
import { DataTableHeader } from './header'
import type { DataTableProps } from './types'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Table } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export const DataTable = <TData,>({
  table,
  isLoading,
  className,
  renderSubComponent,
  onRowClick,
  fitWidth = false
}: DataTableProps<TData>) => {
  const tableEl = (
    <Table className={cn(fitWidth && 'w-full table-fixed')}>
      <DataTableHeader
        table={table}
        fitWidth={fitWidth}
      />
      <DataTableBody
        table={table}
        isLoading={isLoading}
        renderSubComponent={renderSubComponent}
        onRowClick={onRowClick}
        fitWidth={fitWidth}
      />
    </Table>
  )

  if (fitWidth) {
    return (
      <div className={cn('h-full min-h-0 min-w-0 overflow-hidden rounded-md', className)}>
        {tableEl}
      </div>
    )
  }

  return (
    <ScrollArea className={cn('h-full min-h-0 rounded-md', className)}>
      {tableEl}
      <ScrollBar orientation='horizontal' />
    </ScrollArea>
  )
}

