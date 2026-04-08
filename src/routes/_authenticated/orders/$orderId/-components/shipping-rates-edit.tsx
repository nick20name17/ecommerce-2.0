import { useEffect, useRef, useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import type { ShipToAddress } from './shipping-rates-dialog'

export function ShipToEditDialog({
  open,
  onOpenChange,
  address,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  address: ShipToAddress
  onSave: (address: ShipToAddress) => void
}) {
  const [draft, setDraft] = useState<ShipToAddress>(address)

  // Sync draft when opening
  const prevOpen = useRef(false)
  useEffect(() => {
    if (open && !prevOpen.current) setDraft(address)
    prevOpen.current = open
  }, [open, address])

  const update = (field: keyof ShipToAddress, value: string) => {
    setDraft((d) => ({ ...d, [field]: value }))
  }

  const formatPhoneInput = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }

  const handlePhoneChange = (value: string) => {
    update('c_phone', formatPhoneInput(value))
  }

  const formatZipInput = (value: string) => {
    // Allow alphanumeric + spaces for Canadian/international postal codes
    return value.toUpperCase().replace(/[^A-Z0-9 -]/g, '').slice(0, 10)
  }

  const handleZipChange = (value: string) => {
    update('c_zip', formatZipInput(value))
  }

  const handleSave = () => {
    onSave(draft)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='gap-0 p-0 sm:max-w-[400px]'>
        <DialogHeader className='border-b border-border px-5 py-3'>
          <DialogTitle className='text-[14px] font-semibold'>Ship To Address</DialogTitle>
        </DialogHeader>
        <div className='space-y-3 px-5 py-4'>
          <ShipToField label='Name' value={draft.c_name} onChange={(v) => update('c_name', v)} />
          <ShipToField label='Address' value={draft.c_address1} onChange={(v) => update('c_address1', v)} />
          <div className='grid grid-cols-3 gap-2'>
            <ShipToField label='City' value={draft.c_city} onChange={(v) => update('c_city', v)} />
            <ShipToField label='State' value={draft.c_state} onChange={(v) => update('c_state', v)} />
            <ShipToField label='ZIP / Postal' value={draft.c_zip} onChange={handleZipChange} />
          </div>
          <div className='grid grid-cols-2 gap-2'>
            <ShipToField label='Country' value={draft.c_country} onChange={(v) => update('c_country', v)} />
            <ShipToField label='Phone' value={draft.c_phone} onChange={handlePhoneChange} inputMode='tel' />
          </div>
        </div>
        <div className='flex items-center justify-end gap-2 border-t border-border px-5 py-3'>
          <button
            type='button'
            className='rounded-[6px] border border-border px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-bg-hover'
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            type='button'
            className='rounded-[6px] bg-primary px-3 py-1.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:opacity-90'
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ShipToField({
  label,
  value,
  onChange,
  inputMode,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  inputMode?: 'tel' | 'text'
}) {
  return (
    <div>
      <label className='mb-1 block text-[12px] font-medium text-text-tertiary'>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        inputMode={inputMode}
        className='h-8 w-full rounded-[6px] border border-border bg-background px-2.5 text-[13px] text-foreground outline-none transition-colors duration-[80ms] placeholder:text-text-quaternary focus:border-primary/50 focus:ring-1 focus:ring-primary/20'
      />
    </div>
  )
}
