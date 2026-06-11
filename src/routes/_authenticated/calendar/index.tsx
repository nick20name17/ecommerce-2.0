import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import {
  WRITE_MODE_TOAST,
  addDays,
  buildMonthWeeks,
  diffDays,
  fromISODate,
  toISODate,
  type CalendarEvent
} from './-components/calendar-lib'
import { EventDrawer } from './-components/event-drawer'
import { MonthGrid } from './-components/month-grid'
import { WriteModePill } from './-components/write-mode-pill'

import {
  CALENDAR_QUERY_KEYS,
  getCalendarEventsQuery,
  getCalendarSourcesQuery
} from '@/api/calendar/query'
import type { CalendarApiEvent } from '@/api/calendar/schema'
import { calendarService } from '@/api/calendar/service'
import { TASK_QUERY_KEYS, getTasksQuery } from '@/api/task/query'
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

const toCalendarEvent = (e: CalendarApiEvent): CalendarEvent => ({
  source: e.source,
  id: e.id,
  title: e.title,
  start: e.start,
  end: e.end,
  color: e.color,
  code: e.source === 'task' ? `#${e.id}` : e.id,
  meta: e.meta ?? undefined,
  writeMode: e.write_mode,
  nativeStart: e.native_start,
  nativeEnd: e.native_end,
  overridden: e.overridden
})

function CalendarPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [projectId] = useProjectId()
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [hiddenSources, setHiddenSources] = useState<Set<string>>(new Set())
  const [drawerKey, setDrawerKey] = useState<string | null>(null)

  // Visible grid range (incl. leading/trailing days of adjacent months)
  const weeks = buildMonthWeeks(month)
  const gridStart = toISODate(weeks[0][0])
  const gridEnd = toISODate(weeks[weeks.length - 1][6])

  const { data: sourcesData } = useQuery(getCalendarSourcesQuery(projectId))
  const sources = sourcesData?.sources ?? []
  const sourceByKey = new Map(sources.map(s => [s.key, s]))

  const { data: eventsData, isLoading } = useQuery({
    ...getCalendarEventsQuery({
      date_from: gridStart,
      date_to: gridEnd,
      ...(projectId != null ? { project_id: projectId } : {})
    }),
    placeholderData: keepPreviousData
  })

  // Unscheduled tray: native to-dos without a due date (EBMS sources join
  // this via the events endpoint once placements/tray support lands there)
  const { data: allTasksData } = useQuery(
    getTasksQuery({ project_id: projectId ?? undefined, limit: 200 })
  )
  const trayEvents: CalendarEvent[] = (allTasksData?.results ?? [])
    .filter(t => !t.due_date && !hiddenSources.has('task'))
    .map(t => ({
      source: 'task',
      id: String(t.id),
      title: t.title,
      color: t.status_color || '#8b5cf6',
      code: `#${t.id}`,
      meta: t.responsible_user_name ?? undefined,
      writeMode: 'web' as const
    }))

  const events: CalendarEvent[] = (eventsData?.events ?? [])
    .filter(e => !hiddenSources.has(e.source))
    .map(toCalendarEvent)

  const drawerEvent =
    (drawerKey && [...events, ...trayEvents].find(e => `${e.source}:${e.id}` === drawerKey)) || null

  const rescheduleMutation = useMutation({
    mutationFn: ({
      event,
      start,
      end
    }: {
      event: CalendarEvent
      start: string | null
      end: string | null
    }) => calendarService.patchEvent(event.source, event.id, { start, end }, projectId),
    onSuccess: (_data, { event, start }) => {
      queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEYS.events() })
      if (event.source === 'task') {
        queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.all() })
      }
      const mode = event.writeMode ?? 'overlay'
      toast.success(
        start
          ? `${event.code ?? event.title} → ${start}`
          : `${event.code ?? event.title} unscheduled`,
        {
          description: WRITE_MODE_TOAST[mode]
        }
      )
    },
    meta: {
      errorMessage: 'Failed to reschedule'
    }
  })

  const toggleSource = (key: string) => {
    setHiddenSources(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleEventClick = (event: CalendarEvent) => {
    setDrawerKey(`${event.source}:${event.id}`)
  }

  const handleEventDrop = (event: CalendarEvent, newStart: string) => {
    if (event.start === newStart) return
    // Preserve the event's duration when dragging multi-day bars
    const duration = event.start && event.end ? diffDays(event.start, event.end) : 0
    const newEnd = toISODate(addDays(fromISODate(newStart), duration))
    rescheduleMutation.mutate({ event, start: newStart, end: newEnd })
  }

  const shiftMonth = (n: number) =>
    setMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + n, 1))

  const goToday = () => {
    const now = new Date()
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1))
  }

  const legendRow = (src: (typeof sources)[number]) => {
    const off = hiddenSources.has(src.key)
    if (!src.available) {
      return (
        <Tooltip key={src.key}>
          <TooltipTrigger asChild>
            <div className='flex h-8 cursor-default items-center gap-2.5 rounded-[6px] px-2 opacity-40'>
              <span
                className='size-3 shrink-0 rounded-[4px]'
                style={{ boxShadow: `inset 0 0 0 1.5px ${src.color}` }}
              />
              <span className='flex-1 truncate text-[13px] font-medium text-text-tertiary'>
                {src.label}
              </span>
              <WriteModePill mode={src.write_mode} />
            </div>
          </TooltipTrigger>
          <TooltipContent side='right'>
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
          'flex h-8 w-full items-center gap-2.5 rounded-[6px] px-2 text-left transition-colors duration-[80ms] hover:bg-bg-hover',
          off && 'opacity-45'
        )}
      >
        <span
          className='size-3 shrink-0 rounded-[4px]'
          style={{
            backgroundColor: off ? 'transparent' : src.color,
            boxShadow: `inset 0 0 0 1.5px ${src.color}`
          }}
        />
        <span className='flex-1 truncate text-[13px] font-medium'>{src.label}</span>
        <WriteModePill mode={src.write_mode} />
      </button>
    )
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

      <div className='flex min-h-0 flex-1'>
        {/* ── Sources rail ── */}
        <aside className='hidden w-[210px] shrink-0 flex-col gap-px overflow-y-auto border-r border-border p-3 lg:flex'>
          <div className='mb-1.5 px-2 text-[11px] font-semibold tracking-[0.06em] text-text-tertiary uppercase'>
            Sources
          </div>
          {sources.map(legendRow)}
        </aside>

        {/* ── Grid + tray ── */}
        <div className='flex min-h-0 min-w-0 flex-1 flex-col'>
          {/* Compact legend on small screens */}
          <div className='flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-3.5 py-1.5 lg:hidden'>
            {sources
              .filter(s => s.available)
              .map(src => {
                const off = hiddenSources.has(src.key)
                return (
                  <button
                    key={src.key}
                    type='button'
                    onClick={() => toggleSource(src.key)}
                    className={cn(
                      'flex h-6 shrink-0 items-center gap-1.5 rounded-full border border-border px-2.5 text-[12px] font-medium',
                      off && 'opacity-45'
                    )}
                  >
                    <span className='size-2 rounded-full' style={{ backgroundColor: src.color }} />
                    {src.label}
                  </button>
                )
              })}
          </div>

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
              trayEvents={trayEvents}
              onEventClick={handleEventClick}
              onEventDrop={handleEventDrop}
            />
          )}

          {/* ── Footer ── */}
          <div className='flex h-8 shrink-0 items-center gap-2 border-t border-border px-3.5 text-[11px] text-text-tertiary sm:px-6'>
            <CalendarDays className='size-3' />
            {events.length} event{events.length === 1 ? '' : 's'} this month · drag a bar to
            reschedule
          </div>
        </div>
      </div>

      {/* ── Detail drawer ── */}
      {drawerEvent && (
        <EventDrawer
          event={drawerEvent}
          source={sourceByKey.get(drawerEvent.source)}
          onOpenChange={open => {
            if (!open) setDrawerKey(null)
          }}
          onReschedule={(event, start, end) => rescheduleMutation.mutate({ event, start, end })}
          onOpenTask={taskId => navigate({ to: '/tasks/$taskId', params: { taskId } })}
        />
      )}
    </div>
  )
}
