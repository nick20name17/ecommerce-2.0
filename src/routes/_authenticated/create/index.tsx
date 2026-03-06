import { createFileRoute } from '@tanstack/react-router'

import { CreatePageCartColumn } from './-components/create-page-cart-column'
import { CreatePageForm } from './-components/create-page-form'
import { CreatePageHeader } from './-components/create-page-header'
import { ProductCatalogDialog } from './-components/product-catalog-dialog'
import { ProductEditSheet } from './-components/product-edit-sheet'
import { useCreatePage } from './-components/use-create-page'
import { ScrollArea } from '@/components/ui/scroll-area'

const CreatePage = () => {
  const {
    projectId,
    customer,
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
    isCartItemType
  } = useCreatePage()

  return (
    <div className='flex h-full flex-col'>
      <CreatePageHeader
        customerSelected={!!customer}
        hasItems={cartItems.length > 0}
        isBusy={isBusy}
        clearingCart={busy.clearingCart}
        creatingProposal={busy.creatingProposal}
        creatingOrder={busy.creatingOrder}
        onClearAll={handleClearAll}
        onCreateProposal={handleCreateProposal}
        onCreateOrder={handleCreateOrder}
      />

      <ScrollArea className='-mx-4 min-h-0 flex-1 px-4'>
        <div className='grid gap-4 pb-4 lg:grid-cols-[1fr,380px]'>
          <CreatePageForm
            customer={customer}
            projectId={projectId}
            hasCartItems={cartItems.length > 0}
            setCatalogOpen={setCatalogOpen}
            onCustomerChange={handleCustomerChange}
            attachmentsRef={attachmentsRef}
            isBusy={isBusy}
          />
          <CreatePageCartColumn
            cart={cart}
            cartItems={cartItems}
            cartLoading={cartLoading}
            customerLoading={customerLoading}
            updatingQuantityItemId={updatingQuantityItemId}
            cartUpdating={busy.cartUpdating}
            onEdit={handleEditItem}
            onRemove={handleRemoveItem}
            onQuantityChange={handleQuantityChange}
          />
        </div>
      </ScrollArea>

      <ProductEditSheet
        key={
          editProduct ? (isCartItemType(editProduct) ? editProduct.id : editProduct.autoid) : 'none'
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
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/create/')({
  component: CreatePage,
  head: () => ({
    meta: [{ title: 'Create' }]
  })
})
