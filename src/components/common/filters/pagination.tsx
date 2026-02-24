import {
  Pagination as PaginationRoot,
  PaginationButton,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useLimitParam, useOffsetParam } from '@/hooks/use-query-params'

const LIMIT_OPTIONS = [10, 20, 50, 100]
const PAGE_SIBLINGS = 1

function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: (number | 'ellipsis')[] = [1]

  const rangeStart = Math.max(2, currentPage - PAGE_SIBLINGS)
  const rangeEnd = Math.min(totalPages - 1, currentPage + PAGE_SIBLINGS)

  if (rangeStart > 2) pages.push('ellipsis')

  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(i)
  }

  if (rangeEnd < totalPages - 1) pages.push('ellipsis')

  pages.push(totalPages)

  return pages
}

interface PaginationProps {
  totalCount: number
}

export const Pagination = ({ totalCount }: PaginationProps) => {
  const [offset, setOffset] = useOffsetParam()
  const [limit, setLimit] = useLimitParam()

  const totalPages = Math.max(1, Math.ceil(totalCount / limit))
  const currentPage = Math.min(totalPages, Math.floor(offset / limit) + 1)

  const rangeStart = totalCount === 0 ? 0 : offset + 1
  const rangeEnd = Math.min(offset + limit, totalCount)

  const goToPage = (page: number) => {
    const newOffset = (page - 1) * limit
    setOffset(newOffset === 0 ? null : newOffset)
  }

  const handleLimitChange = (value: string) => {
    setLimit(Number(value))
    setOffset(null)
  }

  const isFirst = currentPage === 1
  const isLast = currentPage === totalPages

  const pages = getPageNumbers(currentPage, totalPages)

  return (
    <div className='flex items-center justify-between'>
      <p className='text-muted-foreground text-sm'>
        {rangeStart}–{rangeEnd} of {totalCount}
      </p>

      <div className='flex items-center gap-3'>
        <div className='flex items-center gap-1.5'>
          <span className='text-muted-foreground text-sm'>Rows</span>
          <Select value={String(limit)} onValueChange={handleLimitChange}>
            <SelectTrigger size='sm'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align='end'>
              {LIMIT_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <PaginationRoot>
          <PaginationContent>
            <PaginationItem>
              <PaginationFirst onClick={() => goToPage(1)} disabled={isFirst} />
            </PaginationItem>

            <PaginationItem>
              <PaginationPrevious
                onClick={() => goToPage(currentPage - 1)}
                disabled={isFirst}
              />
            </PaginationItem>

            {pages.map((page, pageIndex) =>
              page === 'ellipsis' ? (
                <PaginationItem key={`ellipsis-${pageIndex === 1 ? 'start' : 'end'}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={`page-${page}`}>
                  <PaginationButton
                    isActive={page === currentPage}
                    onClick={() => goToPage(page)}
                  >
                    {page}
                  </PaginationButton>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() => goToPage(currentPage + 1)}
                disabled={isLast}
              />
            </PaginationItem>

            <PaginationItem>
              <PaginationLast
                onClick={() => goToPage(totalPages)}
                disabled={isLast}
              />
            </PaginationItem>
          </PaginationContent>
        </PaginationRoot>
      </div>
    </div>
  )
}
