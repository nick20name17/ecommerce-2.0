import { format } from 'date-fns'
import { Calendar as CalendarIcon, ChevronDownIcon } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DATE_FORMATS } from '@/constants/app'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  className?: string
  placeholder?: string
  /** When true, show a time picker next to the calendar and include time in the value */
  showTime?: boolean
}

export function DatePicker({
  value,
  onChange,
  className,
  placeholder,
  showTime = false
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const hours = Array.from({ length: 12 }, (_, i) => i + 1)
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5)

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onChange(undefined)
      return
    }
    if (showTime && value) {
      const merged = new Date(date)
      merged.setHours(value.getHours(), value.getMinutes(), 0, 0)
      onChange(merged)
    } else {
      onChange(date)
    }
    if (!showTime) {
      setOpen(false)
    }
  }

  const handleTimeChange = (type: 'hour' | 'minute' | 'ampm', val: string) => {
    const base = value ?? new Date()
    const next = new Date(base)

    if (type === 'hour') {
      const hour12 = parseInt(val, 10)
      const isPM = next.getHours() >= 12
      let hour24 = hour12 === 12 ? 0 : hour12
      if (isPM) hour24 += 12
      next.setHours(hour24)
    } else if (type === 'minute') {
      next.setMinutes(parseInt(val, 10))
    } else if (type === 'ampm') {
      const currentHour = next.getHours()
      if (val === 'PM' && currentHour < 12) {
        next.setHours(currentHour + 12)
      } else if (val === 'AM' && currentHour >= 12) {
        next.setHours(currentHour - 12)
      }
    }

    onChange(next)
  }

  const getHour12 = () => {
    if (!value) return 12
    const h = value.getHours() % 12
    return h === 0 ? 12 : h
  }

  const getMinute = () => (value ? value.getMinutes() : 0)
  const getAmPm = () => (value && value.getHours() >= 12 ? 'PM' : 'AM')

  const displayFormat = showTime ? DATE_FORMATS.dateTime : DATE_FORMATS.datePicker

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          data-empty={!value}
          className={cn(
            'data-[empty=true]:text-muted-foreground justify-start text-left font-normal',
            showTime ? 'w-full justify-between' : '',
            className
          )}
        >
          {showTime ? (
            <>
              {value ? format(value, displayFormat) : <span>{placeholder}</span>}
              <ChevronDownIcon />
            </>
          ) : (
            <>
              <CalendarIcon />
              {value ? format(value, displayFormat) : <span>{placeholder}</span>}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn('w-auto p-0', showTime && 'overflow-hidden')}
        align={showTime ? 'start' : undefined}
      >
        {showTime ? (
          <div className='flex'>
            <Calendar
              defaultMonth={value}
              mode='single'
              selected={value}
              onSelect={handleDateSelect}
            />
            <div className='border-border flex divide-x border-l'>
              <ScrollArea className='h-[300px] w-16'>
                <div className='flex flex-col p-2'>
                  {hours.map((hour) => (
                    <Button
                      key={hour}
                      size='icon'
                      variant={getHour12() === hour ? 'default' : 'ghost'}
                      className='aspect-square w-full shrink-0'
                      onClick={() => handleTimeChange('hour', hour.toString())}
                    >
                      {hour}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
              <ScrollArea className='h-[300px] w-16'>
                <div className='flex flex-col p-2'>
                  {minutes.map((minute) => (
                    <Button
                      key={minute}
                      size='icon'
                      variant={getMinute() === minute ? 'default' : 'ghost'}
                      className='aspect-square w-full shrink-0'
                      onClick={() => handleTimeChange('minute', minute.toString())}
                    >
                      {minute.toString().padStart(2, '0')}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
              <ScrollArea className='h-[300px] w-16'>
                <div className='flex flex-col p-2'>
                  {(['AM', 'PM'] as const).map((ampm) => (
                    <Button
                      key={ampm}
                      size='icon'
                      variant={getAmPm() === ampm ? 'default' : 'ghost'}
                      className='aspect-square w-full shrink-0'
                      onClick={() => handleTimeChange('ampm', ampm)}
                    >
                      {ampm}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        ) : (
          <Calendar
            mode='single'
            selected={value}
            onSelect={handleDateSelect}
          />
        )}
      </PopoverContent>
    </Popover>
  )
}
