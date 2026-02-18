'use no memo'

import { createFileRoute } from '@tanstack/react-router'
import { getCoreRowModel, getExpandedRowModel, useReactTable } from '@tanstack/react-table'

import { DataTable } from '@/components/common/data-table'
import { createExpanderColumn } from '@/components/common/data-table/columns'

export const Route = createFileRoute('/_authenticated/projects/')({
  component: RouteComponent
})

const columns = [
  createExpanderColumn(),
  {
    id: 'name',
    header: 'Name',
    cell: ({ row }) => row.original.name
  },
  {
    id: 'description',
    header: 'Description',
    cell: ({ row }) => row.original.description
  },
  {
    id: 'createdAt',
    header: 'Created At',
    cell: ({ row }) => row.original.createdAt
  }
]

const data = [
  {
    id: 1,
    name: 'Project 1',
    description: 'Description 1',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Project 2',
    description: 'Description 2',
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    name: 'Project 3',
    description: 'Description 3',
    createdAt: new Date().toISOString()
  }
]

function RouteComponent() {
  const table = useReactTable({
    columns,
    data,
    getRowCanExpand: () => true,
    getExpandedRowModel: getExpandedRowModel(),
    getCoreRowModel: getCoreRowModel()
  })

  return (
    <DataTable
      table={table}
      renderSubComponent={() => {
        return <DataTable table={table} />
      }}
    />
  )
}
