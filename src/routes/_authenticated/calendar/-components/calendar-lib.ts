/**
 * Calendar core: event shape + month/track layout.
 *
 * Generalizes the Countryside calendar pattern (buildWeekBars greedy track
 * layout). Events are source-discriminated so EBMS entities (orders,
 * proposals, jobs…) can plug in beside native tasks later.
 */

export interface CalendarEvent {
  /** Source key from the backend registry ('task', 'job', …) */
  source: string
  /** Source-scoped id (task pk, EBMS autoid…) */
  id: string
  title: string
  /** ISO yyyy-mm-dd (inclusive) */
  start: string
  /** ISO yyyy-mm-dd (inclusive) */
  end: string
  /** Resolved display color (hex or CSS color) */
  color: string
  meta?: string
}

// ── Date helpers (local-time, ISO date strings) ──────────────

const pad = (n: number) => String(n).padStart(2, '0')

export const toISODate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const fromISODate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const addDays = (d: Date, n: number) => {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export const isSameDay = (a: Date, b: Date) => toISODate(a) === toISODate(b)

/** Whole days from ISO date a to ISO date b (b - a). */
export const diffDays = (a: string, b: string) =>
  Math.round((fromISODate(b).getTime() - fromISODate(a).getTime()) / 86400000)

/** Weeks (rows of 7 Dates, Sun-first) covering the given month. */
export function buildMonthWeeks(month: Date): Date[][] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const gridStart = addDays(first, -first.getDay())
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  const gridEnd = addDays(monthEnd, 6 - monthEnd.getDay())

  const weeks: Date[][] = []
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(d, i)))
  }
  return weeks
}

// ── Greedy track layout ──────────────────────────────────────

export interface WeekBar {
  event: CalendarEvent
  /** 0-6 column where the bar starts in this week */
  startCol: number
  /** Number of columns the bar spans */
  span: number
  /** Vertical track index (0 = first row of bars) */
  track: number
  /** Event continues from the previous week */
  clipLeft: boolean
  /** Event continues into the next week */
  clipRight: boolean
}

/**
 * Lay out the events overlapping a week into horizontal tracks.
 * Greedy: each bar takes the first track whose last occupied column
 * ends before the bar starts.
 */
export function buildWeekBars(events: CalendarEvent[], week: Date[]): WeekBar[] {
  const weekStart = week[0]
  const weekEnd = week[6]

  const inWeek = events
    .filter(e => {
      const s = fromISODate(e.start)
      const end = fromISODate(e.end)
      return s <= weekEnd && end >= weekStart
    })
    .sort(
      (a, b) =>
        fromISODate(a.start).getTime() - fromISODate(b.start).getTime() ||
        a.title.localeCompare(b.title)
    )

  const trackEnds: number[] = []
  return inWeek.map(event => {
    const s = fromISODate(event.start)
    const e = fromISODate(event.end)
    const clipLeft = s < weekStart
    const clipRight = e > weekEnd
    const startCol = clipLeft ? 0 : s.getDay()
    const endCol = clipRight ? 6 : e.getDay()

    let track = trackEnds.findIndex(end => end < startCol)
    if (track === -1) {
      track = trackEnds.length
      trackEnds.push(endCol)
    } else {
      trackEnds[track] = endCol
    }

    return { event, startCol, span: endCol - startCol + 1, track, clipLeft, clipRight }
  })
}
