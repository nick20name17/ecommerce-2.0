import { TableCell, TableRow } from '@/components/ui/table'

interface DataTableEmptyProps {
  columnsCount: number
}

export const DataTableEmpty = ({ columnsCount }: DataTableEmptyProps) => {
  return (
    <TableRow>
      <TableCell
        colSpan={columnsCount}
        className='h-24 text-center'
      >
        Nothing found
      </TableCell>
    </TableRow>
  )
}
