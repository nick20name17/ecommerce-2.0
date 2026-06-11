import type { CalendarWriteMode } from '@/api/calendar/schema'
import { cn } from '@/lib/utils'

const PILLS: Record<CalendarWriteMode, { label: string; className: string; title: string }> = {
  overlay: {
    label: 'overlay',
    className: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    title: 'Re-dating stays web-side; EBMS never changes'
  },
  ebms: {
    label: '→ EBMS',
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    title: 'Re-dating writes back to the EBMS date fields'
  },
  config: {
    label: 'config',
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    title: 'Admin chooses per deployment: overlay or write-back'
  },
  web: {
    label: 'app event',
    className: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    title: 'Native EBMS Online row — not an EBMS record'
  }
}

export function WriteModePill({
  mode,
  className
}: {
  mode: CalendarWriteMode
  className?: string
}) {
  const pill = PILLS[mode]
  return (
    <span
      title={pill.title}
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-1.5 py-px text-[10px] leading-4 font-semibold',
        pill.className,
        className
      )}
    >
      {pill.label}
    </span>
  )
}
