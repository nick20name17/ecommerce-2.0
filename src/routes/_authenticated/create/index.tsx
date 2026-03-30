import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useBlocker, useRouter } from '@tanstack/react-router'
import { createFileRoute } from '@tanstack/react-router'
import {
  ChevronLeft,
  Eraser,
  FileCheck,
  FilePlus2,
  LayoutGrid,
  MapPin,
  Paperclip,
  ShoppingCart,
  User,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { CartEditableTable } from './-components/cart-editable-table'
import { CartSummary } from './-components/cart-summary'
import { CustomerCombobox } from './-components/customer-combobox'
import { ProductCatalogDialog } from './-components/product-catalog-dialog'
import { ProductEditSheet } from './-components/product-edit-sheet'
import { useCreatePage, type AddressFields } from './-components/use-create-page'
import {
  EntityAttachments,
} from '@/components/common/entity-attachments/entity-attachments'
import { CUSTOMER_QUERY_KEYS } from '@/api/customer/query'
import { customerService } from '@/api/customer/service'
import { getEditableFieldsQuery } from '@/api/data/query'
import { getFieldConfigQuery } from '@/api/field-config/query'
import { getPriceLevelsQuery } from '@/api/price-level/query'
import { getSalespersonsQuery } from '@/api/salesperson/query'
import { getColumnLabel } from '@/helpers/dynamic-columns'
import { CustomerInfoPanel } from '@/routes/_authenticated/customers/$customerId/-components/customer-info-card'
import { PropertyField } from '@/routes/_authenticated/orders/$orderId/-components/order-properties'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const CreatePage = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [attachmentsOpen, setAttachmentsOpen] = useState(false)

  const {
    projectId,
    customer,
    customerDetail,
    catalogOpen,
    setCatalogOpen,
    cart,
    cartItems,
    cartLoading,
    customerLoading,
    isBusy,
    busy,
    updatingQuantityItemId,
    addingProductAutoid,
    removingItemId,
    attachmentsRef,
    editProduct,
    editProductWithPhotos,
    editMode,
    editSheetOpen,
    editDispatch,
    configData,
    configLoading,
    invalidateCart,
    billTo,
    setBillTo,
    shipTo,
    setShipTo,
    handleCustomerChange,
    handleProductSelect,
    handleEditItem,
    handleRemoveItem,
    handleQuantityChange,
    handleClearAll,
    handleCreateProposal,
    handleCreateOrder,
    isCartItemType,
  } = useCreatePage()

  const hasCartItems = cartItems.length > 0

  useBlocker({
    shouldBlockFn: () => hasCartItems,
    withResolver: true,
  })

  const { data: fieldConfig } = useQuery(getFieldConfigQuery(projectId))
  const { data: priceLevels } = useQuery(getPriceLevelsQuery(projectId))
  const { data: editableFields } = useQuery(getEditableFieldsQuery(projectId))
  const { data: salespersons } = useQuery(getSalespersonsQuery())

  const customerId = customer?.id ?? ''
  const editableCustomerFields = editableFields?.customer ?? []

  const invalidateCustomerDelayed = () => {
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.detail(customerId) })
      queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.lists() })
    }, 3000)
  }

  const priceLevelMutation = useMutation({
    mutationFn: (value: string) => customerService.update(customerId, { in_level: value }),
    onSuccess: (updatedCustomer) => {
      queryClient.setQueryData(
        [...CUSTOMER_QUERY_KEYS.detail(customerId), projectId],
        updatedCustomer,
      )
      invalidateCustomerDelayed()
      toast.success('Price level updated')
    },
  })

  const patchMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      customerService.update(customerId, payload),
    onSuccess: (updatedCustomer) => {
      queryClient.setQueryData(
        [...CUSTOMER_QUERY_KEYS.detail(customerId), projectId],
        updatedCustomer,
      )
      invalidateCustomerDelayed()
      toast.success('Customer updated')
    },
    meta: { errorMessage: 'Failed to update customer' },
  })

  const handleFieldSave = useCallback(
    (field: string, value: string) => {
      if (!customerDetail) return
      const current = (customerDetail[field] as string | null) ?? ''
      if (value === current) return
      patchMutation.mutate({ [field]: value || null })
    },
    [customerDetail, patchMutation],
  )

  const savingField = patchMutation.isPending
    ? Object.keys(patchMutation.variables ?? {})[0] ?? null
    : null

  const customerCustomFields = useMemo(() => {
    const entries = fieldConfig?.customer ?? []
    return entries.filter((e) => !e.default && e.enabled && e.field !== 'salesman')
  }, [fieldConfig])

  const isCreating = busy.creatingProposal || busy.creatingOrder
  const canSubmit = !!customer && cartItems.length > 0 && !isBusy && !isCreating
  const loading = cartLoading || customerLoading

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* ── Header ── */}
      <header className='flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-3.5 sm:px-6'>
        <SidebarTrigger className='-ml-1' />
        <button
          type='button'
          className='inline-flex h-7 items-center gap-0.5 rounded-[6px] border border-border bg-bg-secondary pl-1.5 pr-2.5 text-[13px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground'
          onClick={() => router.history.back()}
        >
          <ChevronLeft className='size-3.5' />
          <span className='hidden sm:inline'>Back</span>
        </button>

        <div className='flex size-[22px] shrink-0 items-center justify-center rounded-[6px] bg-teal-500'>
          <FilePlus2 className='size-[13px] text-white' />
        </div>
        <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>Create</h1>

        <div className='flex-1' />

        {/* Catalog */}
        <button
          type='button'
          className={cn(
            'inline-flex h-7 items-center gap-1.5 rounded-[5px] border border-border bg-bg-secondary px-2.5 text-[12px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground disabled:pointer-events-none disabled:opacity-40',
          )}
          disabled={!customer || isBusy}
          onClick={() => setCatalogOpen(true)}
        >
          <LayoutGrid className='size-3.5' />
          <span className='hidden sm:inline'>Catalog</span>
        </button>

        {/* Clear */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type='button'
              className='inline-flex size-7 items-center justify-center rounded-[5px] text-text-tertiary transition-colors duration-[80ms] hover:bg-bg-hover hover:text-destructive disabled:pointer-events-none disabled:opacity-40'
              disabled={cartItems.length === 0 || isBusy || isCreating}
              onClick={handleClearAll}
            >
              {busy.clearingCart ? <Spinner className='size-3.5' /> : <Eraser className='size-3.5' />}
            </button>
          </TooltipTrigger>
          <TooltipContent>Clear all items</TooltipContent>
        </Tooltip>
      </header>

      {/* ── Content — two-column Shopify-style ── */}
      <div className='flex min-h-0 flex-1'>
        {/* Left: Main content — cart table */}
        <div className='flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'>
          <div className='min-h-0 flex-1 overflow-hidden'>
            <CartEditableTable
              items={cartItems}
              loading={loading}
              disabled={isBusy || isCreating}
              customerId={customer?.id ?? ''}
              projectId={projectId}
              updatingQuantityItemId={updatingQuantityItemId}
              onProductFound={handleProductSelect}
              onEdit={handleEditItem}
              onRemove={handleRemoveItem}
              onQuantityChange={handleQuantityChange}
            />
          </div>

          {/* Cart summary footer */}
          {(cart || loading) && (
            <div className='shrink-0 border-t border-border px-6 py-2.5'>
              <CartSummary
                cart={cart ?? null}
                loading={loading}
                updating={busy.cartUpdating}
              />
            </div>
          )}
        </div>

        {/* Right: Sidebar — customer, info, addresses, actions */}
        <div className='hidden w-[320px] shrink-0 flex-col overflow-hidden border-l border-border bg-bg-secondary/30 lg:flex'>
          {/* Customer combobox — fixed at top */}
          <div className='shrink-0 border-b border-border p-4'>
            <div className='mb-2.5 flex items-center gap-1.5'>
              <User className='size-3.5 text-text-tertiary' />
              <span className='text-[12px] font-semibold uppercase tracking-[0.04em] text-text-tertiary'>
                Customer
              </span>
            </div>
            <CustomerCombobox
              value={customer}
              onChange={handleCustomerChange}
              projectId={projectId}
            />
          </div>

          {/* Scrollable middle area */}
          <div className='min-h-0 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'>
            {/* Customer details — same as customer detail page */}
            {customer && customerDetail && (
              <>
                <CustomerInfoPanel
                  customer={customerDetail}
                  fieldConfig={fieldConfig}
                  priceLevels={priceLevels}
                  onPriceLevelChange={(value) => priceLevelMutation.mutate(value)}
                  editableFields={editableCustomerFields}
                  onFieldSave={handleFieldSave}
                  salespersons={salespersons}
                  savingField={savingField}
                  savingPriceLevel={priceLevelMutation.isPending}
                />

                {/* Custom fields */}
                {customerCustomFields.length > 0 && (
                  <div className='border-b border-border'>
                    <div className='bg-bg-secondary/60 px-4 py-2'>
                      <span className='text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary'>
                        Custom Fields
                      </span>
                    </div>
                    <div className='bg-background text-[13px]'>
                      {customerCustomFields.map((entry) => {
                        const label = getColumnLabel(entry.field, 'customer', fieldConfig)
                        const val = customerDetail[entry.field]
                        const strVal = val != null ? String(val) : null
                        const isEditable = !!entry.editable || editableCustomerFields.includes(entry.field)
                        return (
                          <PropertyField
                            key={entry.field}
                            label={label}
                            value={strVal}
                            field={entry.field}
                            onSave={handleFieldSave}
                            editable={isEditable}
                            saving={savingField === entry.field}
                          />
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Bill To / Ship To */}
            {customer && (
              <>
                <AddressCard title='Bill To' address={billTo} onChange={setBillTo} />
                <AddressCard title='Ship To' address={shipTo} onChange={setShipTo} />
              </>
            )}

            {/* Attachments */}
            <div className='border-b border-border p-4'>
              <button
                type='button'
                className='inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-[6px] border border-border bg-background text-[13px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-bg-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-50'
                disabled={!customer}
                onClick={() => setAttachmentsOpen(true)}
              >
                <Paperclip className='size-3.5' />
                Attachments
              </button>
            </div>
          </div>

          {/* Actions — fixed at bottom */}
          <div className='shrink-0 border-t border-border p-4'>
            <div className='flex flex-col gap-2'>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type='button'
                    className='inline-flex h-9 w-full items-center justify-center gap-2 rounded-[6px] bg-primary text-[13px] font-semibold text-primary-foreground transition-opacity duration-[80ms] hover:opacity-90 disabled:pointer-events-none disabled:opacity-40'
                    disabled={!canSubmit}
                    onClick={handleCreateProposal}
                  >
                    {busy.creatingProposal ? (
                      <Spinner className='size-3.5' />
                    ) : (
                      <FileCheck className='size-3.5' />
                    )}
                    Create Proposal
                  </button>
                </TooltipTrigger>
                {!canSubmit && (
                  <TooltipContent>
                    {!customer
                      ? 'Select a customer first'
                      : cartItems.length === 0
                        ? 'Add at least one product'
                        : 'Please wait…'}
                  </TooltipContent>
                )}
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type='button'
                    className='inline-flex h-9 w-full items-center justify-center gap-2 rounded-[6px] border border-border bg-background text-[13px] font-medium text-foreground transition-colors duration-[80ms] hover:bg-bg-hover disabled:pointer-events-none disabled:opacity-40'
                    disabled={!canSubmit}
                    onClick={handleCreateOrder}
                  >
                    {busy.creatingOrder ? (
                      <Spinner className='size-3.5' />
                    ) : (
                      <ShoppingCart className='size-3.5' />
                    )}
                    Create Order
                  </button>
                </TooltipTrigger>
                {!canSubmit && (
                  <TooltipContent>
                    {!customer
                      ? 'Select a customer first'
                      : cartItems.length === 0
                        ? 'Add at least one product'
                        : 'Please wait…'}
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile/tablet bottom bar (visible below lg breakpoint) ── */}
      <div className='flex shrink-0 items-center justify-between gap-2 border-t border-border px-4 py-2 lg:hidden'>
        <div className='flex min-w-0 flex-1 items-center gap-2'>
          <div className='min-w-0 flex-1'>
            <CustomerCombobox
              value={customer}
              onChange={handleCustomerChange}
              projectId={projectId}
            />
          </div>
          <button
            type='button'
            className='inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[6px] border border-border bg-background px-2.5 text-[12px] font-medium text-text-secondary'
            disabled={!customer}
            onClick={() => setAttachmentsOpen(true)}
          >
            <Paperclip className='size-3' />
          </button>
        </div>
        <div className='flex shrink-0 items-center gap-2'>
          <button
            type='button'
            className='inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-border bg-background px-3 text-[12px] font-medium text-foreground disabled:opacity-40'
            disabled={!canSubmit}
            onClick={handleCreateOrder}
          >
            {busy.creatingOrder && <Spinner className='size-3' />}
            Order
          </button>
          <button
            type='button'
            className='inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-primary px-3 text-[12px] font-semibold text-primary-foreground disabled:opacity-40'
            disabled={!canSubmit}
            onClick={handleCreateProposal}
          >
            {busy.creatingProposal && <Spinner className='size-3' />}
            Proposal
          </button>
        </div>
      </div>

      {/* ── Dialogs ── */}
      <ProductEditSheet
        key={
          editProduct
            ? isCartItemType(editProduct)
              ? editProduct.id
              : editProduct.autoid
            : 'none'
        }
        open={editSheetOpen}
        onOpenChange={(open) => {
          if (!open) editDispatch({ type: 'CLOSE' })
        }}
        product={editProductWithPhotos}
        mode={editMode}
        configData={configData}
        configLoading={configLoading}
        customerId={customer?.id ?? ''}
        projectId={projectId}
        onSaved={invalidateCart}
      />

      <ProductCatalogDialog
        open={catalogOpen}
        onOpenChange={setCatalogOpen}
        customerId={customer?.id ?? null}
        projectId={projectId}
        onSelect={handleProductSelect}
        onRemoveItem={handleRemoveItem}
        disabled={isBusy}
        addingProductAutoid={addingProductAutoid}
        removingItemId={removingItemId}
      />

      {/* Attachments dialog */}
      <Dialog open={attachmentsOpen} onOpenChange={setAttachmentsOpen}>
        <DialogContent className='flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md'>
          <DialogHeader className='border-b border-border px-5 py-3'>
            <DialogTitle className='flex items-center gap-2 text-[14px]'>
              <Paperclip className='size-4 text-text-tertiary' />
              Attachments
            </DialogTitle>
          </DialogHeader>
          <div className='min-h-0 flex-1 overflow-y-auto'>
            <EntityAttachments
              ref={attachmentsRef}
              entityType='proposal'
              projectId={projectId}
              mode='deferred'
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Address Card (compact display + edit dialog) ────────────

function AddressCard({
  title,
  address,
  onChange,
}: {
  title: string
  address: AddressFields
  onChange: (addr: AddressFields) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<AddressFields>(address)

  const handleOpen = () => {
    setDraft(address)
    setOpen(true)
  }

  const handleSave = () => {
    onChange(draft)
    setOpen(false)
  }

  const updateDraft = (field: keyof AddressFields, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  const hasAddress = address.name || address.address1 || address.city
  const cityStateZip = [address.city, address.state, address.zip].filter(Boolean).join(', ')

  return (
    <>
      <div
        className='cursor-pointer border-b border-border px-4 py-2.5 transition-colors duration-75 hover:bg-bg-hover/50'
        onClick={handleOpen}
      >
        <div className='mb-1 flex items-center gap-1.5'>
          <MapPin className='size-3 shrink-0 text-text-quaternary' />
          <span className='text-[11px] font-semibold uppercase tracking-[0.04em] text-text-tertiary'>
            {title}
          </span>
        </div>
        {hasAddress ? (
          <div className='pl-[18px] text-[12px] leading-relaxed text-text-secondary'>
            {address.name && <div className='font-medium text-foreground'>{address.name}</div>}
            {address.address1 && <div>{address.address1}</div>}
            {address.address2 && <div>{address.address2}</div>}
            {cityStateZip && <div>{cityStateZip}</div>}
          </div>
        ) : (
          <div className='pl-[18px] text-[12px] text-text-quaternary'>No address set</div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='gap-0 overflow-hidden p-0 sm:max-w-[380px]'>
          <DialogHeader className='border-b border-border px-5 py-3'>
            <DialogTitle className='flex items-center gap-2 text-[14px]'>
              <MapPin className='size-4 text-text-tertiary' />
              {title}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3 px-5 py-4'>
            <AddressDialogField label='Name' value={draft.name} onChange={(v) => updateDraft('name', v)} autoFocus />
            <AddressDialogField label='Street' value={draft.address1} onChange={(v) => updateDraft('address1', v)} />
            <AddressDialogField label='Apt / Suite' value={draft.address2} onChange={(v) => updateDraft('address2', v)} />
            <div className='grid grid-cols-3 gap-2'>
              <AddressDialogField label='City' value={draft.city} onChange={(v) => updateDraft('city', v)} />
              <AddressDialogField label='State' value={draft.state} onChange={(v) => updateDraft('state', v)} />
              <AddressDialogField label='ZIP' value={draft.zip} onChange={(v) => updateDraft('zip', v)} />
            </div>
          </div>
          <div className='flex justify-end gap-2 border-t border-border px-5 py-3'>
            <button
              type='button'
              className='inline-flex h-7 items-center rounded-[6px] border border-border px-3 text-[12px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-bg-hover hover:text-foreground'
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              type='button'
              className='inline-flex h-7 items-center rounded-[6px] bg-primary px-3 text-[12px] font-semibold text-primary-foreground transition-opacity duration-[80ms] hover:opacity-90'
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function AddressDialogField({
  label,
  value,
  onChange,
  autoFocus,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  autoFocus?: boolean
}) {
  return (
    <div>
      <label className='mb-1 block text-[12px] font-medium text-text-tertiary'>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        autoFocus={autoFocus}
        className='h-8 w-full rounded-[6px] border border-border bg-background px-2.5 text-[13px] text-foreground outline-none transition-colors duration-[80ms] placeholder:text-text-quaternary focus:border-primary focus:ring-1 focus:ring-primary/20'
      />
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/create/')({
  component: CreatePage,
  head: () => ({
    meta: [{ title: 'Create' }],
  }),
})
