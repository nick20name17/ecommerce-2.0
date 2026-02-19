import { forwardRef, useMemo, useState } from 'react'
import { HexColorPicker } from 'react-colorful'

import type { ButtonProps } from '@/components/ui/button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useForwardedRef } from '@/lib/use-forwarded-ref'
import { cn } from '@/lib/utils'

interface ColorPickerProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  inline?: boolean
}

const ColorPicker = forwardRef<
  HTMLInputElement,
  Omit<ButtonProps, 'value' | 'onChange' | 'onBlur'> & ColorPickerProps
>(
  (
    { disabled, value, onChange, onBlur, name, className, size, inline, ...props },
    forwardedRef
  ) => {
    const ref = useForwardedRef(forwardedRef)
    const [open, setOpen] = useState(false)

    const parsedValue = useMemo(() => value || '#FFFFFF', [value])

    if (inline) {
      return (
        <div className='flex flex-col gap-2'>
          <HexColorPicker
            color={parsedValue}
            onChange={onChange}
          />
          <Input
            maxLength={7}
            onChange={(e) => onChange(e.currentTarget.value)}
            onBlur={onBlur}
            ref={ref}
            value={parsedValue}
            name={name}
            disabled={disabled}
            className={cn('font-mono text-sm', className)}
          />
        </div>
      )
    }

    return (
      <Popover
        onOpenChange={setOpen}
        open={open}
      >
        <PopoverTrigger
          asChild
          disabled={disabled}
          onBlur={onBlur}
        >
          <Button
            {...props}
            className={cn('block', className)}
            name={name}
            onClick={() => setOpen(true)}
            size={size}
            style={{ backgroundColor: parsedValue }}
            variant='outline'
          >
            <div />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-full'>
          <HexColorPicker
            color={parsedValue}
            onChange={onChange}
          />
          <Input
            maxLength={7}
            onChange={(e) => onChange(e.currentTarget.value)}
            ref={ref}
            value={parsedValue}
            className='mt-2 font-mono text-sm'
          />
        </PopoverContent>
      </Popover>
    )
  }
)
ColorPicker.displayName = 'ColorPicker'

export { ColorPicker }

