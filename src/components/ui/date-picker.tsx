'use client'

import { format, parse } from 'date-fns'
import { Calendar as CalendarIcon, ChevronDownIcon } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DATE_FORMATS } from '@/constants/app'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  className?: string
  placeholder?: string
  /** When true, show a time input next to the calendar and include time in the value */
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
  const timeValue = value ? format(value, 'HH:mm') : ''

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

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeStr = e.target.value
    if (!timeStr) return
    try {
      const parsed = parse(timeStr, 'HH:mm', new Date(0))
      const base = value ?? new Date()
      const next = new Date(base)
      next.setHours(parsed.getHours(), parsed.getMinutes(), 0, 0)
      onChange(next)
    } catch {
      // ignore invalid input
    }
  }

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
          <div className='flex gap-3 p-3'>
            <Calendar
              defaultMonth={value}
              mode='single'
              selected={value}
              onSelect={handleDateSelect}
            />
            <Field className='w-32 shrink-0'>
              <FieldLabel
                className='text-xs'
                htmlFor='date-picker-time'
              >
                Time
              </FieldLabel>
              <Input
                id='date-picker-time'
                type='time'
                step='60'
                value={timeValue}
                onChange={handleTimeChange}
                className='bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
              />
            </Field>
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
