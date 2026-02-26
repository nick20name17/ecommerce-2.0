import type { Row, Table } from '@tanstack/react-table'
import type { ReactElement } from 'react'

export interface DataTableProps<TData> {
  table: Table<TData>
  isLoading?: boolean
  className?: string
  renderSubComponent?: (row: Row<TData>) => ReactElement
  onRowClick?: (row: Row<TData>) => void
  fitWidth?: boolean
}
