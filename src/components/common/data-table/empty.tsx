import { SearchX } from 'lucide-react'

import { TableCell, TableRow } from '@/components/ui/table'

interface DataTableEmptyProps {
  columnsCount: number
}

export const DataTableEmpty = ({ columnsCount }: DataTableEmptyProps) => {
  return (
    <TableRow>
      <TableCell colSpan={columnsCount} className='h-48'>
        <div className='flex flex-col items-center justify-center gap-2 text-center'>
          <div className='flex size-9 items-center justify-center rounded-[10px] bg-primary/[0.08] text-primary dark:bg-primary/15'>
            <SearchX className='size-[18px]' strokeWidth={1.75} />
          </div>
          <div>
            <p className='text-[13px] font-semibold text-foreground'>Nothing found</p>
            <p className='mt-0.5 text-[13px] text-text-tertiary'>Try adjusting your search or filters.</p>
          </div>
        </div>
      </TableCell>
    </TableRow>
  )
}
