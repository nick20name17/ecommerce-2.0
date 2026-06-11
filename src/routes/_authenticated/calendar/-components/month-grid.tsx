import { useRef, useState } from 'react'

import {
  buildMonthWeeks,
  buildWeekBars,
  isSameDay,
  nameInitials,
  toISODate,
  type CalendarEvent
} from './calendar-lib'

import { InitialsAvatar } from '@/components/ds/initials-avatar'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** px from week-cell top reserved for the day numbers */
const BARS_TOP = 30
/** px per bar track (bar height + gap) */
const TRACK_HEIGHT = 28

interface MonthGridProps {
  month: Date
  events: CalendarEvent[]
  /** Date-less events shown in the Unscheduled tray below the grid */
  trayEvents?: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  /** Called when a bar or tray chip is dropped on a day. New start date in ISO. */
  onEventDrop?: (event: CalendarEvent, newStart: string) => void
}

export function MonthGrid({
  month,
  events,
  trayEvents = [],
  onEventClick,
  onEventDrop
}: MonthGridProps) {
  const weeks = buildMonthWeeks(month)
  const today = new Date()
  const dragEvent = useRef<CalendarEvent | null>(null)
  const [dropWeek, setDropWeek] = useState<string | null>(null)

  const startDrag = (event: CalendarEvent) => (e: React.DragEvent) => {
    dragEvent.current = event
    e.dataTransfer.effectAllowed = 'move'
  }
  const endDrag = () => {
    dragEvent.current = null
    setDropWeek(null)
  }

  return (
    <div className='flex h-full min-h-0 flex-col overflow-y-auto bg-bg-secondary/40 px-3.5 pb-4 sm:px-6'>
      {/* Weekday header */}
      <div className='grid shrink-0 grid-cols-7 py-1.5'>
        {WEEKDAYS.map(d => (
          <div
            key={d}
            className='text-center text-[11px] font-semibold tracking-[0.06em] text-text-tertiary uppercase'
          >
            {d}
          </div>
        ))}
      </div>

      {/* Month card */}
      <div className='flex min-h-[60vh] flex-col overflow-hidden rounded-[10px] border border-border bg-background shadow-[var(--surface-shadow)]'>
        {weeks.map(week => {
          const weekKey = toISODate(week[0])
          const bars = buildWeekBars(events, week)
          const trackCount = bars.reduce((max, b) => Math.max(max, b.track + 1), 0)
          const minHeight = BARS_TOP + Math.max(1, trackCount) * TRACK_HEIGHT + 6

          return (
            <div
              key={weekKey}
              className={cn(
                'relative flex-1 border-b border-border-light last:border-b-0',
                dropWeek === weekKey && 'bg-bg-hover'
              )}
              style={{ minHeight }}
              onDragOver={e => {
                if (!dragEvent.current) return
                e.preventDefault()
                setDropWeek(weekKey)
              }}
              onDragLeave={() => setDropWeek(prev => (prev === weekKey ? null : prev))}
              onDrop={e => {
                e.preventDefault()
                setDropWeek(null)
                const dragged = dragEvent.current
                dragEvent.current = null
                if (!dragged || !onEventDrop) return
                const rect = e.currentTarget.getBoundingClientRect()
                const col = Math.max(
                  0,
                  Math.min(6, Math.floor(((e.clientX - rect.left) / rect.width) * 7))
                )
                onEventDrop(dragged, toISODate(week[col]))
              }}
            >
              {/* Day cells */}
              <div className='grid h-full grid-cols-7'>
                {week.map(day => {
                  const dim = day.getMonth() !== month.getMonth()
                  const isToday = isSameDay(day, today)
                  return (
                    <div
                      key={toISODate(day)}
                      className='border-r border-border-light px-1.5 pt-1.5 last:border-r-0'
                    >
                      <span
                        className={cn(
                          'inline-flex size-5.5 items-center justify-center text-[12px] font-medium tabular-nums',
                          dim ? 'text-text-tertiary/50' : 'text-text-secondary',
                          isToday && 'rounded-[6px] bg-primary font-semibold text-white'
                        )}
                      >
                        {day.getDate()}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Event bars */}
              <div className='pointer-events-none absolute inset-x-0 top-0'>
                {bars.map(bar => (
                  <button
                    key={`${bar.event.source}:${bar.event.id}`}
                    type='button'
                    draggable={!!onEventDrop}
                    onDragStart={startDrag(bar.event)}
                    onDragEnd={endDrag}
                    onClick={() => onEventClick?.(bar.event)}
                    className={cn(
                      'pointer-events-auto absolute flex h-[24px] cursor-grab items-center gap-1.5 overflow-hidden rounded-[6px] px-1.5 text-left text-[12px] font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition-opacity duration-[80ms] hover:opacity-90 active:cursor-grabbing',
                      bar.clipLeft && 'rounded-l-none',
                      bar.clipRight && 'rounded-r-none'
                    )}
                    style={{
                      left: `calc(${(bar.startCol / 7) * 100}% + 4px)`,
                      width: `calc(${(bar.span / 7) * 100}% - 8px)`,
                      top: BARS_TOP + bar.track * TRACK_HEIGHT,
                      backgroundColor: bar.event.color
                    }}
                  >
                    {bar.event.code && (
                      <span className='shrink-0 rounded-[4px] bg-white/25 px-1 text-[10px] font-bold tracking-[0.02em]'>
                        {bar.event.code}
                      </span>
                    )}
                    <span className='flex-1 truncate font-medium'>{bar.event.title}</span>
                    {bar.event.meta && (
                      <InitialsAvatar
                        initials={nameInitials(bar.event.meta)}
                        size={16}
                        className='shrink-0 ring-[1.5px] ring-white/70'
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Unscheduled tray */}
      <div
        className={cn(
          'mt-3 shrink-0 rounded-[10px] border border-dashed border-border bg-background px-3.5 py-3',
          trayEvents.length === 0 && 'opacity-70'
        )}
      >
        <div className='mb-2 text-[11px] font-semibold tracking-[0.06em] text-text-tertiary uppercase'>
          Unscheduled
          {trayEvents.length > 0 ? ` — drag onto a day to set a date (${trayEvents.length})` : ''}
        </div>
        {trayEvents.length === 0 ? (
          <div className='text-[12px] text-text-tertiary'>
            Nothing waiting. Items without a date land here until you drag them onto a day.
          </div>
        ) : (
          <div className='flex flex-wrap gap-2'>
            {trayEvents.map(event => (
              <button
                key={`${event.source}:${event.id}`}
                type='button'
                draggable={!!onEventDrop}
                onDragStart={startDrag(event)}
                onDragEnd={endDrag}
                onClick={() => onEventClick?.(event)}
                className='flex cursor-grab items-center gap-1.5 rounded-[6px] px-2 py-1 text-[12px] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition-opacity duration-[80ms] hover:opacity-90 active:cursor-grabbing'
                style={{ backgroundColor: event.color }}
              >
                {event.code && (
                  <span className='rounded-[4px] bg-white/25 px-1 text-[10px] font-bold'>
                    {event.code}
                  </span>
                )}
                {event.title}
                {event.meta && (
                  <InitialsAvatar
                    initials={nameInitials(event.meta)}
                    size={16}
                    className='ring-[1.5px] ring-white/70'
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
