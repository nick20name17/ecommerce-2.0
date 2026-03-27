import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  Check,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'

import { PICK_LIST_QUERY_KEYS } from '@/api/pick-list/query'
import type { PickListItem } from '@/api/pick-list/schema'
import { pickListService } from '@/api/pick-list/service'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Props {
  pickListId: number
  items: PickListItem[]
  isDraft: boolean
  isMobile: boolean
}

export function PickListItemsTable({ pickListId, items, isDraft, isMobile }: Props) {
  const queryClient = useQueryClient()
  const [editingItem, setEditingItem] = useState<number | null>(null)
  const [editQty, setEditQty] = useState('')
  const [itemToRemove, setItemToRemove] = useState<PickListItem | null>(null)

  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: string }) =>
      pickListService.updateItem(pickListId, itemId, { picked_quantity: quantity }),
    meta: {
      successMessage: 'Quantity updated',
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PICK_LIST_QUERY_KEYS.detail(pickListId) })
      setEditingItem(null)
    },
  })

  const removeMutation = useMutation({
    mutationFn: (itemId: number) => pickListService.removeItem(pickListId, itemId),
    meta: {
      successMessage: 'Item removed',
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PICK_LIST_QUERY_KEYS.detail(pickListId) })
      setItemToRemove(null)
    },
  })

  const startEdit = (item: PickListItem) => {
    setEditingItem(item.id)
    setEditQty(item.picked_quantity)
  }

  const commitEdit = (itemId: number) => {
    updateMutation.mutate({ itemId, quantity: editQty })
  }

  if (items.length === 0) {
    return (
      <div className='py-8 text-center text-[13px] text-text-tertiary'>
        No items yet.{isDraft ? ' Add items to this pick list.' : ''}
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      {!isMobile && (
        <div className='flex items-center gap-4 border-b border-border bg-bg-secondary/60 px-4 py-1.5 text-[12px] font-medium uppercase tracking-[0.04em] text-text-tertiary'>
          <div className='w-[120px] shrink-0'>Order</div>
          <div className='min-w-0 flex-1'>Detail ID</div>
          <div className='w-[100px] shrink-0 text-right'>Quantity</div>
          {items.some((i) => i.push_status) && (
            <div className='w-[100px] shrink-0'>Push Status</div>
          )}
          {isDraft && <div className='w-[60px] shrink-0' />}
        </div>
      )}

      {/* Rows */}
      {items.map((item) => {
        const isEditing = editingItem === item.id

        if (isMobile) {
          return (
            <div key={item.id} className='border-b border-border-light px-4 py-2.5'>
              <div className='mb-1 flex items-center justify-between'>
                <span className='text-[13px] font-medium text-foreground'>
                  {item.order_autoid}
                </span>
                <span className='text-[13px] tabular-nums text-foreground'>
                  {item.picked_quantity}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-[13px] text-text-tertiary'>{item.detail_autoid}</span>
                {item.push_status && <PushStatusBadge status={item.push_status} error={item.push_error} />}
              </div>
              {isDraft && (
                <div className='mt-1.5 flex gap-1.5'>
                  <button
                    type='button'
                    className='text-[12px] font-medium text-primary'
                    onClick={() => startEdit(item)}
                  >
                    Edit qty
                  </button>
                  <button
                    type='button'
                    className='text-[12px] font-medium text-destructive'
                    onClick={() => setItemToRemove(item)}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          )
        }

        return (
          <div
            key={item.id}
            className='group/row flex items-center gap-4 border-b border-border-light px-4 py-2 transition-colors duration-100 hover:bg-bg-hover'
          >
            <div className='w-[120px] shrink-0 text-[13px] font-semibold tabular-nums text-foreground'>
              {item.order_autoid}
            </div>
            <div className='min-w-0 flex-1 truncate text-[13px] font-mono text-text-secondary'>
              {item.detail_autoid}
            </div>
            <div className='w-[100px] shrink-0 text-right'>
              {isEditing && isDraft ? (
                <div className='flex items-center justify-end gap-1'>
                  <Input
                    value={editQty}
                    onChange={(e) => setEditQty(e.target.value)}
                    className='h-7 w-[70px] text-right text-[13px]'
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitEdit(item.id)
                      if (e.key === 'Escape') setEditingItem(null)
                    }}
                    autoFocus
                  />
                  <Button
                    size='icon-xs'
                    variant='ghost'
                    onClick={() => commitEdit(item.id)}
                    isPending={updateMutation.isPending}
                  >
                    <Check className='size-3' />
                  </Button>
                </div>
              ) : (
                <span
                  className={cn(
                    'text-[13px] tabular-nums text-foreground',
                    isDraft && 'cursor-pointer hover:text-primary',
                  )}
                  onClick={() => isDraft && startEdit(item)}
                >
                  {item.picked_quantity}
                </span>
              )}
            </div>
            {items.some((i) => i.push_status) && (
              <div className='w-[100px] shrink-0'>
                {item.push_status && <PushStatusBadge status={item.push_status} error={item.push_error} />}
              </div>
            )}
            {isDraft && (
              <div className='flex w-[60px] shrink-0 justify-end'>
                <Button
                  size='icon-xs'
                  variant='ghost'
                  className='opacity-0 group-hover/row:opacity-100'
                  onClick={() => setItemToRemove(item)}
                >
                  <Trash2 className='size-3 text-destructive' />
                </Button>
              </div>
            )}
          </div>
        )
      })}

      {/* Remove confirmation */}
      <AlertDialog open={!!itemToRemove} onOpenChange={(open) => !open && setItemToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className='bg-destructive/10 text-destructive'>
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Remove Item</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {itemToRemove?.detail_autoid} from this pick list?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={() => itemToRemove && removeMutation.mutate(itemToRemove.id)}
              isPending={removeMutation.isPending}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function PushStatusBadge({ status, error }: { status: string; error?: string | null }) {
  if (status === 'success') {
    return (
      <span className='inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold leading-none text-emerald-800 dark:border-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300'>
        <Check className='size-2.5' />
        Pushed
      </span>
    )
  }
  return (
    <span
      className='inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold leading-none text-red-800 dark:border-red-600 dark:bg-red-500/20 dark:text-red-300'
      title={error ?? undefined}
    >
      <AlertTriangle className='size-2.5' />
      Failed
    </span>
  )
}
