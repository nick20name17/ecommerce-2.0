import * as React from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  MoreHorizontalIcon
} from 'lucide-react'

function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      role='navigation'
      aria-label='pagination'
      data-slot='pagination'
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  )
}

function PaginationContent({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot='pagination-content'
      className={cn('gap-0.5 flex items-center', className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<'li'>) {
  return <li data-slot='pagination-item' {...props} />
}

type PaginationButtonProps = {
  isActive?: boolean
} & Pick<React.ComponentProps<typeof Button>, 'size' | 'disabled'> &
  React.ComponentProps<'button'>

function PaginationButton({
  className,
  isActive,
  size = 'icon',
  ...props
}: PaginationButtonProps) {
  return (
    <Button
      variant={isActive ? 'outline' : 'ghost'}
      size={size}
      aria-current={isActive ? 'page' : undefined}
      data-slot='pagination-button'
      data-active={isActive}
      className={cn(isActive && 'pointer-events-none', className)}
      {...props}
    />
  )
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PaginationButton>) {
  return (
    <PaginationButton
      aria-label='Go to previous page'
      size='icon'
      className={cn(className)}
      {...props}
    >
      <ChevronLeftIcon />
    </PaginationButton>
  )
}

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PaginationButton>) {
  return (
    <PaginationButton
      aria-label='Go to next page'
      size='icon'
      className={cn(className)}
      {...props}
    >
      <ChevronRightIcon />
    </PaginationButton>
  )
}

function PaginationFirst({
  className,
  ...props
}: React.ComponentProps<typeof PaginationButton>) {
  return (
    <PaginationButton
      aria-label='Go to first page'
      size='icon'
      className={cn(className)}
      {...props}
    >
      <ChevronsLeftIcon />
    </PaginationButton>
  )
}

function PaginationLast({
  className,
  ...props
}: React.ComponentProps<typeof PaginationButton>) {
  return (
    <PaginationButton
      aria-label='Go to last page'
      size='icon'
      className={cn(className)}
      {...props}
    >
      <ChevronsRightIcon />
    </PaginationButton>
  )
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden
      data-slot='pagination-ellipsis'
      className={cn(
        "size-8 [&_svg:not([class*='size-'])]:size-4 flex items-center justify-center",
        className
      )}
      {...props}
    >
      <MoreHorizontalIcon />
      <span className='sr-only'>More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationButton,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationNext,
  PaginationPrevious
}
