import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { endOfDay, startOfDay } from 'date-fns'
import { Filter, FilterX, X } from 'lucide-react'
import { useState } from 'react'

import { PayloadLogDetailDialog } from './payload-log-detail-dialog'
import { PayloadLogsDataTable } from './payload-logs-data-table'
import { getPayloadLogsQuery } from '@/api/payload-log/query'
import type { PayloadLog, PayloadLogParams } from '@/api/payload-log/schema'
import { Pagination } from '@/components/common/filters/pagination'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useOrdering } from '@/hooks/use-ordering'
import {
  useLimitParam,
  useOffsetParam,
  usePayloadLogCreatedAfter,
  usePayloadLogCreatedBefore,
  usePayloadLogEntity,
  usePayloadLogIsError,
  usePayloadLogMethod,
  usePayloadLogStatusCode
} from '@/hooks/use-query-params'

const METHOD_OPTIONS = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'] as const
const ERROR_OPTIONS = [
  { label: 'Errors Only', value: 'true' },
  { label: 'No Errors', value: 'false' }
] as const

const ALL_VALUE = '__all__'

export const PayloadLogsCard = () => {
  const [offset, setOffset] = useOffsetParam()
  const [limit] = useLimitParam()
  const { sorting, setSorting, ordering } = useOrdering()

  const [created_after, setCreated_after] = usePayloadLogCreatedAfter()
  const [created_before, setCreated_before] = usePayloadLogCreatedBefore()
  const [entity, setEntity] = usePayloadLogEntity()
  const [method, setMethod] = usePayloadLogMethod()
  const [status_code, setStatusCode] = usePayloadLogStatusCode()
  const [is_error, setIsError] = usePayloadLogIsError()

  const [showFilters, setShowFilters] = useState(false)
  const [filtersManuallyClosed, setFiltersManuallyClosed] = useState(false)
  const [selectedLog, setSelectedLog] = useState<PayloadLog | null>(null)

  const hasFilters =
    created_after != null ||
    created_before != null ||
    (entity != null && entity !== '') ||
    method != null ||
    status_code != null ||
    is_error != null

  const clearFilters = () => {
    setCreated_after(null)
    setCreated_before(null)
    setEntity(null)
    setMethod(null)
    setStatusCode(null)
    setIsError(null)
    setOffset(null)
    setFiltersManuallyClosed(false)
  }

  const params: PayloadLogParams = {
    offset,
    limit,
    ordering,
    created_after: created_after ? startOfDay(created_after).toISOString() : undefined,
    created_before: created_before ? endOfDay(created_before).toISOString() : undefined,
    entity: entity ?? undefined,
    method: method ?? undefined,
    status_code: status_code ?? undefined,
    is_error: is_error === 'true' ? true : is_error === 'false' ? false : undefined
  }

  const filtersOpen = showFilters || (hasFilters && !filtersManuallyClosed)

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getPayloadLogsQuery(params),
    placeholderData: keepPreviousData
  })

  return (
    <>
      <div className='flex h-full min-h-0 flex-col gap-3'>
        <div className='flex items-center justify-between'>
          <h3 className='text-lg font-semibold'>API Payload Logs</h3>
        </div>

        <div>
          <Button
            variant='outline'
            onClick={() => {
              if (showFilters || (hasFilters && !filtersManuallyClosed)) {
                setShowFilters(false)
                setFiltersManuallyClosed(true)
              } else {
                setShowFilters(true)
                setFiltersManuallyClosed(false)
              }
            }}
          >
            {filtersOpen ? <FilterX /> : <Filter />}
            {filtersOpen ? 'Hide Filters' : 'Filters'}
          </Button>
        </div>

        {filtersOpen ? (
          <div className='ring-foreground/10 bg-card rounded-xl p-4 ring-1'>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              <FilterField label='Created After'>
                <DatePicker
                  showTime
                  placeholder='Select date'
                  value={created_after ?? undefined}
                  onChange={(date) => {
                    setCreated_after(date ?? null)
                    setOffset(null)
                  }}
                />
              </FilterField>

              <FilterField label='Created Before'>
                <DatePicker
                  showTime
                  placeholder='Select date'
                  value={created_before ?? undefined}
                  onChange={(date) => {
                    setCreated_before(date ?? null)
                    setOffset(null)
                  }}
                />
              </FilterField>

              <FilterField label='Entity'>
                <Input
                  placeholder='e.g. Order, Customer'
                  value={entity ?? ''}
                  onChange={(e) => {
                    setEntity(e.target.value)
                    setOffset(null)
                  }}
                />
              </FilterField>

              <FilterField label='Method'>
                <Select
                  value={method ?? ALL_VALUE}
                  onValueChange={(v) => {
                    setMethod(v === ALL_VALUE ? null : v)
                    setOffset(null)
                  }}
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
                  value={status_code ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === '') {
                      setStatusCode(null)
                    } else {
                      const n = Number(v)
                      if (!Number.isNaN(n)) setStatusCode(n)
                    }
                    setOffset(null)
                  }}
                />
              </FilterField>

              <FilterField label='Is Error'>
                <Select
                  value={is_error ?? ALL_VALUE}
                  onValueChange={(v) => {
                    setIsError(v === ALL_VALUE ? null : v)
                    setOffset(null)
                  }}
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

        <div className='ring-foreground/10 flex h-full flex-col overflow-hidden rounded-xl ring-1'>
          <PayloadLogsDataTable
            data={data?.results ?? []}
            isLoading={isLoading || isPlaceholderData}
            sorting={sorting}
            setSorting={setSorting}
            onView={setSelectedLog}
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
