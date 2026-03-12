import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { ArrowRight, Package, Search, Users } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { getCustomersQuery } from '@/api/customer/query'
import { getOrdersQuery } from '@/api/order/query'
import { useProjectId } from '@/hooks/use-project-id'
import { cn } from '@/lib/utils'

export const GlobalSearch = () => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const [projectId] = useProjectId()

  // Debounced search value
  const [debouncedQuery, setDebouncedQuery] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 200)
    return () => clearTimeout(t)
  }, [query])

  const enabled = debouncedQuery.length >= 2

  const { data: ordersData, isFetching: ordersFetching } = useQuery({
    ...getOrdersQuery({
      search: debouncedQuery,
      project_id: projectId ?? undefined,
      limit: 5,
    }),
    enabled,
  })

  const { data: customersData, isFetching: customersFetching } = useQuery({
    ...getCustomersQuery({
      search: debouncedQuery,
      project_id: projectId ?? undefined,
      limit: 5,
    }),
    enabled,
  })

  const orders = ordersData?.results ?? []
  const customers = customersData?.results ?? []
  const isFetching = ordersFetching || customersFetching

  type Result =
    | { type: 'order'; id: string; label: string; sub: string }
    | { type: 'customer'; id: string; label: string; sub: string }

  const results: Result[] = [
    ...orders.map((o) => ({
      type: 'order' as const,
      id: o.autoid,
      label: `Order ${o.invoice}`,
      sub: o.name || '\u2014',
    })),
    ...customers.map((c) => ({
      type: 'customer' as const,
      id: c.autoid,
      label: c.l_name,
      sub: c.contact_3 || c.contact_1 || '\u2014',
    })),
  ]

  // Reset active index when results change
  useEffect(() => setActiveIdx(0), [results.length])

  const handleSelect = useCallback(
    (result: Result) => {
      setOpen(false)
      setQuery('')
      if (result.type === 'order') {
        navigate({ to: '/orders/$orderId', params: { orderId: result.id } })
      } else {
        navigate({ to: '/customers/$customerId', params: { customerId: result.id } })
      }
    },
    [navigate],
  )

  // Keyboard shortcut to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Focus input when opening
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus())
    } else {
      setQuery('')
    }
  }, [open])

  // Keyboard navigation inside dialog
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[activeIdx]) {
      e.preventDefault()
      handleSelect(results[activeIdx])
    }
  }

  const hasResults = enabled && results.length > 0

  return (
    <>
      {/* Trigger button in sidebar */}
      <button
        type='button'
        onClick={(e) => {
          ;(e.currentTarget as HTMLButtonElement).blur()
          setOpen(true)
        }}
        className='flex h-[32px] w-full items-center gap-2 rounded-[6px] border border-black/[0.06] bg-black/[0.025] px-2.5 text-[13px] text-text-tertiary transition-[background-color,color,border-color,transform] duration-100 hover:border-black/[0.1] hover:bg-black/[0.04] hover:text-text-secondary focus:outline-none focus-visible:outline-none active:scale-[0.98] dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:border-white/[0.12] dark:hover:bg-white/[0.06]'
      >
        <Search className='size-[14px] shrink-0' />
        <span className='flex-1 text-left'>Search</span>
        <kbd className='hidden rounded-[4px] border border-black/[0.08] bg-white/50 px-1.5 py-0.5 text-[10px] font-medium text-text-tertiary sm:inline-block dark:border-white/[0.1] dark:bg-white/[0.06]'>
          ⌘K
        </kbd>
      </button>

      {/* Modal overlay — portalled to body to escape sidebar z-10 stacking context */}
      {open && createPortal(
          <div
            className='fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-[min(20vh,140px)] backdrop-blur-[2px] dark:bg-black/50'
            style={{ animation: 'fadeIn 100ms ease-out' }}
            onClick={() => setOpen(false)}
          >
            <div
              className='flex w-full max-w-[520px] flex-col overflow-hidden rounded-[12px] border border-border bg-popover shadow-[0_16px_70px_rgba(0,0,0,0.15)]'
              style={{ animation: 'dropIn 120ms ease-out' }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={handleKeyDown}
            >
              {/* Search input */}
              <div className='flex items-center gap-2.5 border-b border-border px-4 py-3'>
                <Search className='size-4 shrink-0 text-text-tertiary' />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder='Search orders, customers…'
                  className='flex-1 bg-transparent text-[14px] outline-none placeholder:text-text-tertiary'
                />
                {isFetching && (
                  <div className='size-4 shrink-0 animate-spin rounded-full border-2 border-border border-t-primary' />
                )}
              </div>

              {/* Results */}
              <div className='max-h-[360px] overflow-y-auto overscroll-contain p-1.5'>
                {!enabled && (
                  <div className='px-3 py-10 text-center text-[13px] text-text-tertiary'>
                    Type at least 2 characters to search
                  </div>
                )}

                {enabled && !isFetching && results.length === 0 && (
                  <div className='px-3 py-10 text-center text-[13px] text-text-tertiary'>
                    No results for &ldquo;{debouncedQuery}&rdquo;
                  </div>
                )}

                {enabled && orders.length > 0 && (
                  <div>
                    <div className='px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary'>
                      Orders
                    </div>
                    {orders.map((o, i) => {
                      const idx = i
                      const isActive = activeIdx === idx
                      return (
                        <button
                          key={o.autoid}
                          type='button'
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-1.5 text-left transition-colors duration-75',
                            isActive ? 'bg-bg-active' : 'hover:bg-bg-hover',
                          )}
                          onClick={() => handleSelect({ type: 'order', id: o.autoid, label: `Order ${o.invoice}`, sub: o.name || '\u2014' })}
                          onMouseEnter={() => setActiveIdx(idx)}
                        >
                          <div className='flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-amber-500/10 text-amber-600 dark:text-amber-400'>
                            <Package className='size-3.5' />
                          </div>
                          <div className='min-w-0 flex-1'>
                            <div className='truncate text-[13px] font-medium'>{o.invoice || o.id}</div>
                            <div className='truncate text-[12px] text-text-tertiary'>{o.name || '\u2014'}</div>
                          </div>
                          {isActive && (
                            <ArrowRight className='size-3 shrink-0 text-text-quaternary' />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}

                {enabled && customers.length > 0 && (
                  <div className={orders.length > 0 ? 'mt-1' : ''}>
                    <div className='px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary'>
                      Customers
                    </div>
                    {customers.map((c, i) => {
                      const idx = orders.length + i
                      const isActive = activeIdx === idx
                      return (
                        <button
                          key={c.autoid}
                          type='button'
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-1.5 text-left transition-colors duration-75',
                            isActive ? 'bg-bg-active' : 'hover:bg-bg-hover',
                          )}
                          onClick={() => handleSelect({ type: 'customer', id: c.autoid, label: c.l_name, sub: c.contact_3 || c.contact_1 || '\u2014' })}
                          onMouseEnter={() => setActiveIdx(idx)}
                        >
                          <div className='flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-blue-500/10 text-blue-600 dark:text-blue-400'>
                            <Users className='size-3.5' />
                          </div>
                          <div className='min-w-0 flex-1'>
                            <div className='truncate text-[13px] font-medium'>{c.l_name}</div>
                            <div className='truncate text-[12px] text-text-tertiary'>{c.contact_3 || c.contact_1 || '\u2014'}</div>
                          </div>
                          {isActive && (
                            <ArrowRight className='size-3 shrink-0 text-text-quaternary' />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Footer with keyboard hints */}
              {hasResults && (
                <div className='flex items-center gap-3 border-t border-border px-4 py-2'>
                  <div className='flex items-center gap-1.5 text-[11px] text-text-quaternary'>
                    <kbd className='inline-flex size-4 items-center justify-center rounded-[3px] border border-border bg-bg-secondary text-[10px]'>↑</kbd>
                    <kbd className='inline-flex size-4 items-center justify-center rounded-[3px] border border-border bg-bg-secondary text-[10px]'>↓</kbd>
                    <span>Navigate</span>
                  </div>
                  <div className='flex items-center gap-1.5 text-[11px] text-text-quaternary'>
                    <kbd className='inline-flex h-4 items-center justify-center rounded-[3px] border border-border bg-bg-secondary px-1 text-[10px]'>↵</kbd>
                    <span>Open</span>
                  </div>
                  <div className='flex items-center gap-1.5 text-[11px] text-text-quaternary'>
                    <kbd className='inline-flex h-4 items-center justify-center rounded-[3px] border border-border bg-bg-secondary px-1 text-[10px]'>esc</kbd>
                    <span>Close</span>
                  </div>
                </div>
              )}
            </div>
          </div>,
        document.body,
      )}
    </>
  )
}
