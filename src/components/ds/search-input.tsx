import { Search } from 'lucide-react'
import { forwardRef } from 'react'

import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  loading?: boolean
  containerClassName?: string
}

/**
 * Reusable search input for dropdowns and filter bars per DESIGN_SYSTEM.md:
 * - 6px 10px padding (mobile: 8px 10px)
 * - Search icon 14px, text 13px
 * - Shows spinner when loading
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ loading, containerClassName, className, ...props }, ref) => {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 border-b border-border px-2.5 py-[6px]',
          containerClassName
        )}
      >
        {loading ? (
          <Spinner className='size-3.5 shrink-0' />
        ) : (
          <Search className='size-3.5 shrink-0 text-text-tertiary' />
        )}
        <input
          ref={ref}
          className={cn(
            'flex-1 bg-transparent text-[13px] font-medium outline-none',
            'placeholder:text-text-tertiary',
            className
          )}
          {...props}
        />
      </div>
    )
  }
)
SearchInput.displayName = 'SearchInput'
