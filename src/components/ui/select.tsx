import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { Select as SelectPrimitive } from 'radix-ui'
import * as React from 'react'

import { cn } from '@/lib/utils'

const Select = ({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) => (
  <SelectPrimitive.Root
    data-slot='select'
    {...props}
  />
)

const SelectGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) => (
  <SelectPrimitive.Group
    data-slot='select-group'
    className={cn('scroll-my-0.5 p-0.5', className)}
    {...props}
  />
)

const SelectValue = ({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) => (
  <SelectPrimitive.Value
    data-slot='select-value'
    {...props}
  />
)

const SelectTrigger = ({
  className,
  size = 'default',
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: 'sm' | 'default'
}) => (
    <SelectPrimitive.Trigger
      data-slot='select-trigger'
      data-size={size}
      className={cn(
        'border-border data-placeholder:text-text-tertiary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive flex w-fit items-center justify-between gap-1.5 rounded-[6px] border bg-background py-1.5 pr-2 pl-2.5 text-[13px] whitespace-nowrap transition-[border-color,box-shadow] duration-100 outline-none select-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-1 data-[size=default]:h-9 data-[size=sm]:h-7 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-3.5',
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className='pointer-events-none size-3.5 text-text-tertiary' />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )

const SelectContent = ({
  className,
  children,
  position = 'popper',
  align = 'start',
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) => (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot='select-content'
        data-align-trigger={position === 'item-aligned'}
        className={cn(
          'bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1 relative z-50 max-h-(--radix-select-content-available-height) min-w-36 origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-[8px] border border-border shadow-sm duration-100 data-[align-trigger=true]:animate-none',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className
        )}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          data-position={position}
          className={cn(
            'p-0.5 data-[position=popper]:h-(--radix-select-trigger-height) data-[position=popper]:w-full data-[position=popper]:min-w-(--radix-select-trigger-width)',
            position === 'popper' && ''
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )

const SelectLabel = ({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) => (
    <SelectPrimitive.Label
      data-slot='select-label'
      className={cn('px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-text-tertiary', className)}
      {...props}
    />
  )

const SelectItem = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) => (
    <SelectPrimitive.Item
      data-slot='select-item'
      className={cn(
        'focus:bg-bg-hover relative flex w-full cursor-default items-center gap-1.5 rounded-[5px] py-1.5 pr-7 pl-2 text-[13px] outline-hidden select-none transition-colors duration-75 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-3.5 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2',
        className
      )}
      {...props}
    >
      <span className='pointer-events-none absolute right-1.5 flex size-4 items-center justify-center'>
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className='pointer-events-none size-3.5 text-foreground' />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )

const SelectSeparator = ({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) => (
    <SelectPrimitive.Separator
      data-slot='select-separator'
      className={cn('bg-border-light pointer-events-none -mx-0.5 my-0.5 h-px', className)}
      {...props}
    />
  )

const SelectScrollUpButton = ({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) => (
    <SelectPrimitive.ScrollUpButton
      data-slot='select-scroll-up-button'
      className={cn(
        "bg-popover z-10 flex cursor-default items-center justify-center py-0.5 [&_svg:not([class*='size-'])]:size-3.5",
        className
      )}
      {...props}
    >
      <ChevronUpIcon />
    </SelectPrimitive.ScrollUpButton>
  )

const SelectScrollDownButton = ({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) => (
    <SelectPrimitive.ScrollDownButton
      data-slot='select-scroll-down-button'
      className={cn(
        "bg-popover z-10 flex cursor-default items-center justify-center py-0.5 [&_svg:not([class*='size-'])]:size-3.5",
        className
      )}
      {...props}
    >
      <ChevronDownIcon />
    </SelectPrimitive.ScrollDownButton>
  )

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue
}
