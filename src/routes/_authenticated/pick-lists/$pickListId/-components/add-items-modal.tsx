import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { PICK_LIST_QUERY_KEYS } from '@/api/pick-list/query'
import { pickListService } from '@/api/pick-list/service'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface ItemRow {
  _id: string
  order_autoid: string
  detail_autoid: string
  picked_quantity: string
}

let _rowId = 0
const emptyRow = (): ItemRow => ({
  _id: `row-${++_rowId}`,
  order_autoid: '',
  detail_autoid: '',
  picked_quantity: '1.00',
})

interface Props {
  pickListId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddItemsModal({ pickListId, open, onOpenChange }: Props) {
  const queryClient = useQueryClient()
  const [rows, setRows] = useState<ItemRow[]>([emptyRow()])

  const mutation = useMutation({
    mutationFn: () =>
      pickListService.addItems(pickListId, {
        items: rows.filter((r) => r.order_autoid && r.detail_autoid),
      }),
    meta: {
      successMessage: 'Items added',
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PICK_LIST_QUERY_KEYS.detail(pickListId) })
      onOpenChange(false)
      setRows([emptyRow()])
    },
  })

  const updateRow = (index: number, field: keyof ItemRow, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }

  const addRow = () => setRows((prev) => [...prev, emptyRow()])

  const removeRow = (index: number) => {
    setRows((prev) => (prev.length <= 1 ? [emptyRow()] : prev.filter((_, i) => i !== index)))
  }

  const canSubmit = rows.some((r) => r.order_autoid && r.detail_autoid)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setRows([emptyRow()])
        onOpenChange(next)
      }}
    >
      <DialogContent className='flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[600px]'>
        <DialogHeader className='border-b border-border px-5 py-3'>
          <DialogTitle className='text-[14px]'>Add Items</DialogTitle>
        </DialogHeader>

        <DialogBody className='min-h-0 flex-1 overflow-y-auto px-5 py-4'>
          <div className='flex flex-col gap-3'>
            {/* Column labels */}
            <div className='grid grid-cols-[1fr_1fr_100px_32px] gap-2 text-[12px] font-medium text-text-tertiary'>
              <span>Order ID</span>
              <span>Detail ID</span>
              <span>Quantity</span>
              <span />
            </div>

            {rows.map((row, i) => (
              <div key={row._id} className='grid grid-cols-[1fr_1fr_100px_32px] items-center gap-2'>
                <Input
                  value={row.order_autoid}
                  onChange={(e) => updateRow(i, 'order_autoid', e.target.value)}
                  placeholder='ABC123'
                  className='h-8 text-[13px]'
                />
                <Input
                  value={row.detail_autoid}
                  onChange={(e) => updateRow(i, 'detail_autoid', e.target.value)}
                  placeholder='DET001'
                  className='h-8 text-[13px]'
                />
                <Input
                  value={row.picked_quantity}
                  onChange={(e) => updateRow(i, 'picked_quantity', e.target.value)}
                  placeholder='1.00'
                  className='h-8 text-right text-[13px]'
                />
                <Button size='icon-xs' variant='ghost' onClick={() => removeRow(i)}>
                  <Trash2 className='size-3 text-text-tertiary' />
                </Button>
              </div>
            ))}

            <button
              type='button'
              onClick={addRow}
              className='flex items-center gap-1.5 text-[13px] font-medium text-primary hover:text-primary/80'
            >
              <Plus className='size-3.5' />
              Add row
            </button>
          </div>
        </DialogBody>

        <DialogFooter className='border-t border-border px-5 py-3'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} isPending={mutation.isPending} disabled={!canSubmit}>
            Add Items
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
