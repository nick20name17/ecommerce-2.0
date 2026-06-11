import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import {
  addDays,
  buildMonthWeeks,
  diffDays,
  fromISODate,
  toISODate,
  type CalendarEvent
} from './-components/calendar-lib'
import { MonthGrid } from './-components/month-grid'

import {
  CALENDAR_QUERY_KEYS,
  getCalendarEventsQuery,
  getCalendarSourcesQuery
} from '@/api/calendar/query'
import { calendarService } from '@/api/calendar/service'
import { TASK_QUERY_KEYS } from '@/api/task/query'
import { ICalendar, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useProjectId } from '@/hooks/use-project-id'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/calendar/')({
  component: CalendarPage,
  head: () => ({
    meta: [{ title: 'Calendar' }]
  })
})

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

function CalendarPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [projectId] = useProjectId()
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [hiddenSources, setHiddenSources] = useState<Set<string>>(new Set())

  // Visible grid range (incl. leading/trailing days of adjacent months)
  const weeks = buildMonthWeeks(month)
  const gridStart = toISODate(weeks[0][0])
  const gridEnd = toISODate(weeks[weeks.length - 1][6])

  const { data: sourcesData } = useQuery(getCalendarSourcesQuery(projectId))
  const sources = sourcesData?.sources ?? []

  const { data: eventsData, isLoading } = useQuery({
    ...getCalendarEventsQuery({
      date_from: gridStart,
      date_to: gridEnd,
      ...(projectId != null ? { project_id: projectId } : {})
    }),
    placeholderData: keepPreviousData
  })

  const rescheduleMutation = useMutation({
    mutationFn: ({ event, start, end }: { event: CalendarEvent; start: string; end: string }) =>
      calendarService.patchEvent(event.source, event.id, { start, end }, projectId),
    onSuccess: (_data, { event, start }) => {
      queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEYS.events() })
      if (event.source === 'task') {
        queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.all() })
      }
      toast.success(`${event.title} → ${start}`)
    },
    meta: {
      errorMessage: 'Failed to reschedule'
    }
  })

  const events: CalendarEvent[] = (eventsData?.events ?? [])
    .filter(e => !hiddenSources.has(e.source))
    .map(e => ({
      source: e.source,
      id: e.id,
      title: e.title,
      start: e.start,
      end: e.end,
      color: e.color,
      meta: e.meta ?? undefined
    }))

  const toggleSource = (key: string) => {
    setHiddenSources(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleEventClick = (event: CalendarEvent) => {
    if (event.source === 'task') {
      navigate({ to: '/tasks/$taskId', params: { taskId: event.id } })
    }
  }

  const handleEventDrop = (event: CalendarEvent, newStart: string) => {
    if (event.start === newStart) return
    // Preserve the event's duration when dragging multi-day bars
    const duration = diffDays(event.start, event.end)
    const newEnd = toISODate(addDays(fromISODate(newStart), duration))
    rescheduleMutation.mutate({ event, start: newStart, end: newEnd })
  }

  const shiftMonth = (n: number) =>
    setMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + n, 1))

  const goToday = () => {
    const now = new Date()
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1))
  }

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* ── Header ── */}
      <header className='flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-3.5 sm:px-6'>
        <SidebarTrigger className='-ml-1' />
        <div className='flex items-center gap-1.5'>
          <PageHeaderIcon icon={ICalendar} color={PAGE_COLORS.calendar} />
          <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>Calendar</h1>
        </div>

        <div className='flex-1' />

        {/* Source legend — driven by the backend registry */}
        <div className='hidden items-center gap-1 md:flex'>
          {sources.map(src => {
            const off = hiddenSources.has(src.key)
            if (!src.available) {
              return (
                <Tooltip key={src.key}>
                  <TooltipTrigger asChild>
                    <span className='flex h-7 cursor-default items-center gap-1.5 rounded-[6px] px-2 text-[12px] font-medium text-text-tertiary opacity-40'>
                      <span
                        className='size-2.5 rounded-[3px]'
                        style={{ boxShadow: `inset 0 0 0 1.5px ${src.color}` }}
                      />
                      {src.label}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Waiting for the {src.ebms_table} table in the EBMS mirror
                  </TooltipContent>
                </Tooltip>
              )
            }
            return (
              <button
                key={src.key}
                type='button'
                onClick={() => toggleSource(src.key)}
                className={cn(
                  'flex h-7 items-center gap-1.5 rounded-[6px] px-2 text-[12px] font-medium transition-colors duration-[80ms] hover:bg-bg-hover',
                  off ? 'text-text-tertiary opacity-50' : 'text-text-secondary'
                )}
              >
                <span
                  className='size-2.5 rounded-[3px]'
                  style={{
                    backgroundColor: off ? 'transparent' : src.color,
                    boxShadow: `inset 0 0 0 1.5px ${src.color}`
                  }}
                />
                {src.label}
              </button>
            )
          })}
        </div>

        <div className='mx-1 hidden h-4 w-px bg-border md:block' />

        {/* Month nav */}
        <div className='flex items-center gap-1'>
          <Button
            variant='outline'
            size='icon'
            className='size-7 rounded-[6px]'
            onClick={() => shiftMonth(-1)}
            aria-label='Previous month'
          >
            <ChevronLeft className='size-3.5' />
          </Button>
          <div className='min-w-[120px] text-center text-[13px] font-semibold tabular-nums'>
            {MONTH_LABELS[month.getMonth()]} {month.getFullYear()}
          </div>
          <Button
            variant='outline'
            size='icon'
            className='size-7 rounded-[6px]'
            onClick={() => shiftMonth(1)}
            aria-label='Next month'
          >
            <ChevronRight className='size-3.5' />
          </Button>
          <Button
            variant='outline'
            className='h-7 rounded-[6px] px-2.5 text-[12px] font-medium'
            onClick={goToday}
          >
            Today
          </Button>
        </div>
      </header>

      {/* ── Grid ── */}
      <div className='min-h-0 flex-1'>
        {isLoading ? (
          <div className='flex h-full flex-col gap-px p-4'>
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className='w-full flex-1 rounded-[6px]' />
            ))}
          </div>
        ) : (
          <MonthGrid
            month={month}
            events={events}
            onEventClick={handleEventClick}
            onEventDrop={handleEventDrop}
          />
        )}
      </div>

      {/* ── Footer hint ── */}
      <div className='flex h-8 shrink-0 items-center gap-2 border-t border-border px-3.5 text-[11px] text-text-tertiary sm:px-6'>
        <CalendarDays className='size-3' />
        {events.length} event{events.length === 1 ? '' : 's'} this month · drag a bar to reschedule
      </div>
    </div>
  )
}
