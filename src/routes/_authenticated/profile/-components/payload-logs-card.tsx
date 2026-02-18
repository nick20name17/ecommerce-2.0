import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Filter, FilterX, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { getPayloadLogColumns } from './payload-log-columns'
import { PayloadLogDetailDialog } from './payload-log-detail-dialog'
import { getPayloadLogsQuery } from '@/api/payload-log/query'
import type { PayloadLog, PayloadLogParams } from '@/api/payload-log/schema'
import { DataTable } from '@/components/common/data-table'
import { Pagination } from '@/components/common/filters/pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useOrdering } from '@/hooks/use-ordering'
import { useLimitParam, useOffsetParam } from '@/hooks/use-query-params'

const METHOD_OPTIONS = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'] as const
const ERROR_OPTIONS = [
  { label: 'Errors Only', value: 'true' },
  { label: 'No Errors', value: 'false' }
] as const

const ALL_VALUE = '__all__'

interface Filters {
  created_after: string
  created_before: string
  entity: string
  method: string
  status_code: string
  is_error: string
}

const EMPTY_FILTERS: Filters = {
  created_after: '',
  created_before: '',
  entity: '',
  method: '',
  status_code: '',
  is_error: ''
}

export const PayloadLogsCard = () => {
  const [offset, setOffset] = useOffsetParam()
  const [limit] = useLimitParam()
  const { sorting, setSorting, ordering } = useOrdering()

  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [selectedLog, setSelectedLog] = useState<PayloadLog | null>(null)

  const hasFilters = Object.values(filters).some(Boolean)

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS)
    setOffset(null)
  }

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setOffset(null)
  }

  const params: PayloadLogParams = {
    offset,
    limit,
    ordering,
    created_after: filters.created_after || undefined,
    created_before: filters.created_before || undefined,
    entity: filters.entity || undefined,
    method: filters.method || undefined,
    status_code: filters.status_code ? Number(filters.status_code) : undefined,
    is_error: filters.is_error ? filters.is_error === 'true' : undefined
  }

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getPayloadLogsQuery(params),
    placeholderData: keepPreviousData
  })

  const columns = useMemo(() => getPayloadLogColumns({ onView: setSelectedLog }), [])

  const table = useReactTable({
    columns,
    data: data?.results ?? [],
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    manualSorting: true
  })

  return (
    <>
      <div className='flex flex-col gap-3'>
        <div className='flex items-center justify-between'>
          <h3 className='text-lg font-semibold'>API Payload Logs</h3>
        </div>

        <div>
          <Button
            variant='outline'
            onClick={() => setShowFilters((prev) => !prev)}
          >
            {showFilters ? <FilterX /> : <Filter />}
            {showFilters ? 'Hide Filters' : 'Filters'}
          </Button>
        </div>

        {showFilters ? (
          <div className='ring-foreground/10 bg-card rounded-xl p-4 ring-1'>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              <FilterField label='Created After'>
                <Input
                  type='datetime-local'
                  value={filters.created_after}
                  onChange={(e) => updateFilter('created_after', e.target.value)}
                />
              </FilterField>

              <FilterField label='Created Before'>
                <Input
                  type='datetime-local'
                  value={filters.created_before}
                  onChange={(e) => updateFilter('created_before', e.target.value)}
                />
              </FilterField>

              <FilterField label='Entity'>
                <Input
                  placeholder='e.g. Order, Customer'
                  value={filters.entity}
                  onChange={(e) => updateFilter('entity', e.target.value)}
                />
              </FilterField>

              <FilterField label='Method'>
                <Select
                  value={filters.method || ALL_VALUE}
                  onValueChange={(v) => updateFilter('method', v === ALL_VALUE ? '' : v)}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='All Methods' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>All Methods</SelectItem>
                    {METHOD_OPTIONS.map((m) => (
                      <SelectItem
                        key={m}
                        value={m}
                      >
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterField>

              <FilterField label='Status Code'>
                <Input
                  type='number'
                  placeholder='e.g. 200, 404'
                  value={filters.status_code}
                  onChange={(e) => updateFilter('status_code', e.target.value)}
                />
              </FilterField>

              <FilterField label='Is Error'>
                <Select
                  value={filters.is_error || ALL_VALUE}
                  onValueChange={(v) => updateFilter('is_error', v === ALL_VALUE ? '' : v)}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='All' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>All</SelectItem>
                    {ERROR_OPTIONS.map((o) => (
                      <SelectItem
                        key={o.value}
                        value={o.value}
                      >
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterField>
            </div>

            {hasFilters ? (
              <div className='mt-3 flex justify-end'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={clearFilters}
                >
                  <X />
                  Clear Filters
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className='ring-foreground/10 flex flex-col overflow-hidden rounded-xl ring-1'>
          <DataTable
            table={table}
            isLoading={isLoading || isPlaceholderData}
            className='flex-1'
          />

          <div className='border-t p-3'>
            <Pagination totalCount={data?.count ?? 0} />
          </div>
        </div>
      </div>

      <PayloadLogDetailDialog
        log={selectedLog}
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      />
    </>
  )
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-1.5'>
      <label className='text-muted-foreground text-xs font-medium'>{label}</label>
      {children}
    </div>
  )
}
