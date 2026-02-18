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
  renderSubComponent
}: DataTableProps<TData>) => {
  return (
    <ScrollArea className={cn('h-full min-h-0 rounded-md', className)}>
      <Table>
        <DataTableHeader table={table} />
        <DataTableBody
          table={table}
          isLoading={isLoading}
          renderSubComponent={renderSubComponent}
        />
      </Table>
      <ScrollBar orientation='horizontal' />
    </ScrollArea>
  )
}
