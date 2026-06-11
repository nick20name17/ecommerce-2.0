import { ExternalLink, RotateCcw } from 'lucide-react'

import { nameInitials, type CalendarEvent } from './calendar-lib'
import { WriteModePill } from './write-mode-pill'

import type { CalendarSourceInfo } from '@/api/calendar/schema'
import { InitialsAvatar } from '@/components/ds/initials-avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'

const WRITE_MODE_NOTES: Record<string, string> = {
  overlay:
    'This source is overlay-only. Changing dates writes a CalendarOverride row; the EBMS record is never modified.',
  ebms: 'This source writes back to EBMS. Changing dates updates the EBMS date fields directly.',
  config:
    'This source is admin-configurable (overlay or write-back per deployment). Currently treated as overlay.',
  web: 'A native EBMS Online record — there is no EBMS row behind it. Changing the date edits the record itself.'
}

function fmtShort(iso: string | null | undefined) {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface EventDrawerProps {
  event: CalendarEvent | null
  source?: CalendarSourceInfo
  onOpenChange: (open: boolean) => void
  /** PATCH dates; pass null to clear */
  onReschedule: (event: CalendarEvent, start: string | null, end: string | null) => void
  onOpenTask?: (taskId: string) => void
}

export function EventDrawer({
  event,
  source,
  onOpenChange,
  onReschedule,
  onOpenTask
}: EventDrawerProps) {
  if (!event) return null

  const writeMode = event.writeMode ?? source?.write_mode ?? 'overlay'
  const isTask = event.source === 'task'
  const nativeLabel = event.nativeStart
    ? `${fmtShort(event.nativeStart)}${
        event.nativeEnd && event.nativeEnd !== event.nativeStart
          ? ` → ${fmtShort(event.nativeEnd)}`
          : ''
      }`
    : 'none'

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-[380px] overflow-y-auto sm:max-w-[380px]'>
        <SheetHeader className='space-y-2 border-b border-border pb-4'>
          <div className='flex items-center gap-2'>
            <span className='size-2.5 rounded-[3px]' style={{ backgroundColor: event.color }} />
            <span className='text-[12px] font-semibold text-text-secondary'>
              {source?.label ?? event.source}
            </span>
            <WriteModePill mode={writeMode} />
          </div>
          <SheetTitle className='text-left text-[17px] leading-snug font-semibold'>
            {event.title}
          </SheetTitle>
          <SheetDescription className='text-left text-[12px] text-text-tertiary'>
            {source?.ebms_table
              ? `${source.ebms_table}.AUTOID = ${event.id}`
              : `${source?.label ?? 'Record'} ${event.code ?? event.id}`}
          </SheetDescription>
        </SheetHeader>

        <div className='space-y-5 py-4'>
          {/* Dates */}
          <div>
            <div className='mb-1.5 text-[11px] font-semibold tracking-[0.06em] text-text-tertiary uppercase'>
              {source?.date_label ?? 'Date'}
            </div>
            <div className='flex items-center gap-2'>
              <Input
                type='date'
                className='h-8 text-[13px]'
                value={event.start ?? ''}
                onChange={e => onReschedule(event, e.target.value || null, event.end ?? null)}
              />
              <span className='text-text-tertiary'>→</span>
              <Input
                type='date'
                className='h-8 text-[13px]'
                value={event.end ?? ''}
                onChange={e => onReschedule(event, event.start ?? null, e.target.value || null)}
              />
            </div>
            {event.overridden && (
              <Button
                variant='ghost'
                className='mt-2 h-7 gap-1.5 rounded-[6px] px-2 text-[12px] text-text-secondary'
                onClick={() => onReschedule(event, null, null)}
              >
                <RotateCcw className='size-3' />
                Reset to EBMS date ({nativeLabel})
              </Button>
            )}
          </div>

          {/* Native date (EBMS sources) */}
          {!isTask && (
            <div>
              <div className='mb-1 text-[11px] font-semibold tracking-[0.06em] text-text-tertiary uppercase'>
                EBMS native date
              </div>
              <div className='text-[13px]'>
                {event.nativeStart ? nativeLabel : <span className='text-text-tertiary'>none</span>}
              </div>
            </div>
          )}

          {/* Assignee */}
          {event.meta && (
            <div>
              <div className='mb-1.5 text-[11px] font-semibold tracking-[0.06em] text-text-tertiary uppercase'>
                Assigned to
              </div>
              <div className='flex items-center gap-2 text-[13px]'>
                <InitialsAvatar initials={nameInitials(event.meta)} size={20} />
                {event.meta}
              </div>
            </div>
          )}

          {/* Write behavior */}
          <div>
            <div className='mb-1.5 text-[11px] font-semibold tracking-[0.06em] text-text-tertiary uppercase'>
              Write behavior
            </div>
            <div className='rounded-[8px] border border-border bg-bg-secondary px-3 py-2.5 text-[12px] leading-relaxed text-text-secondary'>
              {WRITE_MODE_NOTES[writeMode]}
            </div>
          </div>

          {isTask && onOpenTask && (
            <Button
              variant='outline'
              className='h-8 w-full gap-1.5 rounded-[6px] text-[13px]'
              onClick={() => onOpenTask(event.id)}
            >
              <ExternalLink className='size-3.5' />
              Open To-Do
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
