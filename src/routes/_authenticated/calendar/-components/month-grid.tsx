import { useRef, useState } from 'react'

import {
  buildMonthWeeks,
  buildWeekBars,
  isSameDay,
  toISODate,
  type CalendarEvent
} from './calendar-lib'

import { cn } from '@/lib/utils'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** px from week-cell top reserved for the day numbers */
const BARS_TOP = 28
/** px per bar track (bar height + gap) */
const TRACK_HEIGHT = 26

interface MonthGridProps {
  month: Date
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  /** Called when a bar is dropped on a day. New start date in ISO. */
  onEventDrop?: (event: CalendarEvent, newStart: string) => void
}

export function MonthGrid({ month, events, onEventClick, onEventDrop }: MonthGridProps) {
  const weeks = buildMonthWeeks(month)
  const today = new Date()
  const dragEvent = useRef<CalendarEvent | null>(null)
  const [dropWeek, setDropWeek] = useState<string | null>(null)

  return (
    <div className='flex h-full min-h-0 flex-col'>
      {/* Weekday header */}
      <div className='grid shrink-0 grid-cols-7 border-b border-border'>
        {WEEKDAYS.map(d => (
          <div
            key={d}
            className='py-1.5 text-center text-[11px] font-semibold tracking-[0.06em] text-text-tertiary uppercase'
          >
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      <div className='flex flex-1 flex-col overflow-y-auto'>
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
                    onDragStart={e => {
                      dragEvent.current = bar.event
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onDragEnd={() => {
                      dragEvent.current = null
                      setDropWeek(null)
                    }}
                    onClick={() => onEventClick?.(bar.event)}
                    className={cn(
                      'pointer-events-auto absolute flex h-[22px] cursor-grab items-center gap-1.5 overflow-hidden rounded-[5px] px-1.5 text-left text-[12px] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition-opacity duration-[80ms] hover:opacity-90 active:cursor-grabbing',
                      bar.clipLeft && 'rounded-l-none',
                      bar.clipRight && 'rounded-r-none'
                    )}
                    style={{
                      left: `calc(${(bar.startCol / 7) * 100}% + 3px)`,
                      width: `calc(${(bar.span / 7) * 100}% - 6px)`,
                      top: BARS_TOP + bar.track * TRACK_HEIGHT,
                      backgroundColor: bar.event.color
                    }}
                  >
                    <span className='truncate'>{bar.event.title}</span>
                    {bar.event.meta && (
                      <span className='ml-auto shrink-0 text-[10px] text-white/75 tabular-nums'>
                        {bar.event.meta}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
