import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import {
  Eraser,
  FileCheck,
  LayoutGrid,
  Paperclip,
  ShoppingCart,
  User,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { CartEditableTable } from '../create/-components/cart-editable-table'
import { CartSummary } from '../create/-components/cart-summary'
import { CustomerCombobox } from '../create/-components/customer-combobox'
import { ProductCatalogDialog } from '../create/-components/product-catalog-dialog'
import { ProductEditSheet } from '../create/-components/product-edit-sheet'
import { useCreatePage } from '../create/-components/use-create-page'
import {
  EntityAttachments,
} from '@/components/common/entity-attachments/entity-attachments'
import { getFieldConfigQuery } from '@/api/field-config/query'
import { getColumnLabel } from '@/helpers/dynamic-columns'
import { CustomerInfoPanel } from '@/routes/_authenticated/customers/$customerId/-components/customer-info-card'
import { PropertyField } from '@/routes/_authenticated/orders/$orderId/-components/order-properties'
import { IOrderDesk, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

const OrderDeskPage = () => {
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

  const { data: fieldConfig } = useQuery(getFieldConfigQuery(projectId))

  const customerCustomFields = useMemo(() => {
    const entries = fieldConfig?.customer ?? []
    return entries.filter((e) => !e.default && e.enabled)
  }, [fieldConfig])

  const isCreating = busy.creatingProposal || busy.creatingOrder
  const canSubmit = !!customer && cartItems.length > 0 && !isBusy && !isCreating
  const loading = cartLoading || customerLoading

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* ── Header ── */}
      <header className='flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-6'>
        <SidebarTrigger className='-ml-1' />
        <PageHeaderIcon icon={IOrderDesk} color={PAGE_COLORS.orderDesk} />
        <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>Order Desk</h1>

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
            {/* Customer details — same panel as customer detail page */}
            {customer && customerDetail && (
              <>
                <CustomerInfoPanel
                  customer={customerDetail}
                  fieldConfig={fieldConfig}
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
                        return (
                          <PropertyField
                            key={entry.field}
                            label={label}
                            value={strVal}
                            field={entry.field}
                            onSave={() => {}}
                            editable={false}
                          />
                        )
                      })}
                    </div>
                  </div>
                )}
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

      {/* ── Mobile bottom bar ── */}
      <div className='flex shrink-0 items-center justify-between gap-2 border-t border-border px-4 py-2 lg:hidden'>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            className='inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-border bg-background px-2.5 text-[12px] font-medium text-text-secondary'
            disabled={!customer}
            onClick={() => setAttachmentsOpen(true)}
          >
            <Paperclip className='size-3' />
          </button>
        </div>
        <div className='flex items-center gap-2'>
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

export const Route = createFileRoute('/_authenticated/order-desk/')({
  component: OrderDeskPage,
  head: () => ({
    meta: [{ title: 'Order Desk' }],
  }),
})
