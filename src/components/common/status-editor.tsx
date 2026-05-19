import { X } from 'lucide-react'

import type { ProductStatus } from '@/api/variable-product/schema'
import { PRODUCT_STATUS_VALUES } from '@/api/variable-product/schema'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const STATUS_LABEL: Record<ProductStatus, string> = {
  featured: 'Featured',
  sale: 'Sale',
  new: 'New',
  clearance: 'Clearance',
  coming_soon: 'Coming Soon',
}

export const STATUS_BADGE_CLASS: Record<ProductStatus, string> = {
  featured: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  sale: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
  new: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  clearance: 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
  coming_soon: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
}

export type StatusValue = ProductStatus | ''

interface Props {
  status: StatusValue
  expiresAt: string | null
  onStatusChange: (next: StatusValue) => void
  onExpiresAtChange: (next: string | null) => void
}

/**
 * Curated-status editor for VP / standalone products. Status is one of
 * 5 curated values (mirrors INVENTRY.E_FEATURE) or empty. Expiration is
 * optional — null means "doesn't expire". Used inside Edit dialogs.
 */
export const StatusEditor = ({
  status,
  expiresAt,
  onStatusChange,
  onExpiresAtChange,
}: Props) => {
  const expiresDate = expiresAt ? new Date(expiresAt) : undefined

  return (
    <>
      <div className='flex flex-col gap-1.5'>
        <Label>Status</Label>
        <div className='flex items-center gap-2'>
          <Select
            value={status || '__none'}
            onValueChange={(v) => {
              if (v === '__none') {
                onStatusChange('')
                onExpiresAtChange(null)
              } else {
                onStatusChange(v as ProductStatus)
              }
            }}
          >
            <SelectTrigger className='flex-1'>
              <SelectValue placeholder='None' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='__none'>
                <span className='text-text-tertiary'>None</span>
              </SelectItem>
              {PRODUCT_STATUS_VALUES.map((v) => (
                <SelectItem key={v} value={v}>
                  {STATUS_LABEL[v]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {status && (
        <div className='flex flex-col gap-1.5'>
          <Label>Expires</Label>
          <div className='flex items-center gap-2'>
            <DatePicker
              value={expiresDate}
              onChange={(d) => onExpiresAtChange(d ? d.toISOString() : null)}
              placeholder='No expiration'
              showTime
            />
            {expiresAt && (
              <Button
                type='button'
                variant='ghost'
                size='icon-sm'
                onClick={() => onExpiresAtChange(null)}
                title='Clear expiration'
              >
                <X className='size-3.5' />
              </Button>
            )}
          </div>
          <p className='text-[11px] text-text-tertiary'>
            Empty = never expires. Storefront hides the status after this
            date.
          </p>
        </div>
      )}
    </>
  )
}

interface BadgeProps {
  status: StatusValue
  expiresAt?: string | null
  className?: string
}

/** Compact status pill for list rows / detail headers. */
export const StatusBadge = ({ status, expiresAt, className }: BadgeProps) => {
  if (!status) return null
  const expired = expiresAt && new Date(expiresAt) < new Date()
  return (
    <span
      className={[
        'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
        expired
          ? 'bg-muted text-text-tertiary line-through'
          : STATUS_BADGE_CLASS[status],
        className ?? '',
      ].join(' ')}
      title={expired && expiresAt ? `Expired ${new Date(expiresAt).toLocaleDateString()}` : undefined}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}
