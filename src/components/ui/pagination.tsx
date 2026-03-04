import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  MoreHorizontalIcon
} from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const Pagination = ({ className, ...props }: React.ComponentProps<'nav'>) => (
  <nav
    aria-label='pagination'
    data-slot='pagination'
    className={cn('mx-auto flex w-full justify-center', className)}
    {...props}
  />
)

const PaginationContent = ({ className, ...props }: React.ComponentProps<'ul'>) => (
  <ul
    data-slot='pagination-content'
    className={cn('flex items-center gap-0.5', className)}
    {...props}
  />
)

const PaginationItem = ({ ...props }: React.ComponentProps<'li'>) => (
  <li
    data-slot='pagination-item'
    {...props}
  />
)

type PaginationButtonProps = {
  isActive?: boolean
} & Pick<React.ComponentProps<typeof Button>, 'size' | 'disabled'> &
  React.ComponentProps<'button'>

const PaginationButton = ({
  className,
  isActive,
  size = 'icon',
  ...props
}: PaginationButtonProps) => (
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

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationButton>) => (
    <PaginationButton
      aria-label='Go to previous page'
      size='icon'
      className={cn(className)}
      {...props}
    >
      <ChevronLeftIcon />
    </PaginationButton>
  )

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationButton>) => (
    <PaginationButton
      aria-label='Go to next page'
      size='icon'
      className={cn(className)}
      {...props}
    >
      <ChevronRightIcon />
    </PaginationButton>
  )

const PaginationFirst = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationButton>) => (
    <PaginationButton
      aria-label='Go to first page'
      size='icon'
      className={cn(className)}
      {...props}
    >
      <ChevronsLeftIcon />
    </PaginationButton>
  )

const PaginationLast = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationButton>) => (
    <PaginationButton
      aria-label='Go to last page'
      size='icon'
      className={cn(className)}
      {...props}
    >
      <ChevronsRightIcon />
    </PaginationButton>
  )

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<'span'>) => (
    <span
      aria-hidden
      data-slot='pagination-ellipsis'
      className={cn(
        "flex size-8 items-center justify-center [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <MoreHorizontalIcon />
      <span className='sr-only'>More pages</span>
    </span>
  )

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
