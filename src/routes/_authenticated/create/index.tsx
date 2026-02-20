import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useReducer, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

import { CartSummary } from './-components/cart-summary'
import { CartTable } from './-components/cart-table'
import { CreatePageActions } from './-components/create-page-actions'
import { CustomerCombobox } from './-components/customer-combobox'
import { ProductEditSheet } from './-components/product-edit-sheet'
import { ProductSearch } from './-components/product-search'
import { useEditSheetData } from './-components/use-edit-sheet-data'
import { CART_QUERY_KEYS, getCartQuery } from '@/api/cart/query'
import { cartService } from '@/api/cart/service'
import type { Customer } from '@/api/customer/schema'
import type { CartItem, Product } from '@/api/product/schema'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getErrorMessage } from '@/helpers/error'
import { useProjectId } from '@/hooks/use-project-id'

type EditState = { product: Product | CartItem | null; mode: 'add' | 'edit'; open: boolean }
type EditAction =
  | { type: 'OPEN_ADD'; product: Product }
  | { type: 'OPEN_EDIT'; item: CartItem }
  | { type: 'CLOSE' }

function editReducer(state: EditState, action: EditAction): EditState {
  switch (action.type) {
    case 'OPEN_ADD':
      return { product: { ...action.product, unit: action.product.unit || action.product.def_unit }, mode: 'add', open: true }
    case 'OPEN_EDIT':
      return { product: { ...action.item }, mode: 'edit', open: true }
    case 'CLOSE':
      return { product: null, mode: 'add', open: false }
    default:
      return state
  }
}

type BusyState = {
  cartUpdating: boolean
  clearingCart: boolean
  creatingProposal: boolean
  creatingOrder: boolean
}
type BusyAction =
  | { type: 'CART_UPDATING'; value: boolean }
  | { type: 'CLEARING'; value: boolean }
  | { type: 'CREATING_PROPOSAL'; value: boolean }
  | { type: 'CREATING_ORDER'; value: boolean }

function busyReducer(state: BusyState, action: BusyAction): BusyState {
  switch (action.type) {
    case 'CART_UPDATING':
      return { ...state, cartUpdating: action.value }
    case 'CLEARING':
      return { ...state, clearingCart: action.value }
    case 'CREATING_PROPOSAL':
      return { ...state, creatingProposal: action.value }
    case 'CREATING_ORDER':
      return { ...state, creatingOrder: action.value }
    default:
      return state
  }
}

const initialBusy: BusyState = {
  cartUpdating: false,
  clearingCart: false,
  creatingProposal: false,
  creatingOrder: false,
}

export const Route = createFileRoute('/_authenticated/create/')({
  component: CreatePage,
  head: () => ({
    meta: [{ title: 'Create' }]
  })
})

function CreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [projectId] = useProjectId()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [busy, busyDispatch] = useReducer(busyReducer, initialBusy)
  const [editState, editDispatch] = useReducer(editReducer, {
    product: null,
    mode: 'add',
    open: false,
  })

  const { data: cart, isLoading: cartLoading, isFetching: cartFetching } = useQuery({
    ...getCartQuery(customer?.id ?? '', projectId),
  })
  const { product: editProduct, mode: editMode, open: editSheetOpen } = editState

  const { configData, configLoading, editProductWithPhotos } = useEditSheetData(
    editProduct,
    editSheetOpen,
    customer?.id ?? '',
    projectId,
    editDispatch
  )

  const cartItems = cart?.items ?? []
  const isBusy =
    busy.cartUpdating || cartLoading || busy.creatingProposal || busy.creatingOrder

  const invalidateCart = () => {
    if (customer?.id != null) {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEYS.detail(customer.id, projectId) })
    }
  }

  const handleCustomerChange = (c: Customer | null) => {
    setCustomer(c)
  }

  const handleProductSelect = async (product: Product) => {
    if (!customer) return

    const hasConfigurations = Number(product.configurations) > 0
    const hasMultipleUnits = (product.units?.length ?? 0) > 1

    if (hasConfigurations || hasMultipleUnits) {
      editDispatch({ type: 'OPEN_ADD', product })
    } else {
      busyDispatch({ type: 'CART_UPDATING', value: true })
      const customerId = customer.id
      const payload = {
        product_autoid: product.autoid,
        quantity: 1,
        unit: product.unit || product.def_unit || '',
      }
      try {
        await cartService.addItem(payload, customerId, projectId)
        invalidateCart()
        toast.success(`${product.id} added to cart`)
      } catch (error) {
        toast.error(getErrorMessage(error))
      }
      busyDispatch({ type: 'CART_UPDATING', value: false })
    }
  }

  const handleEditItem = (item: CartItem) => {
    if (!customer) return
    editDispatch({ type: 'OPEN_EDIT', item })
  }

  const handleRemoveItem = async (itemId: number) => {
    if (!customer) return
    const item = cartItems.find((i) => i.id === itemId)
    busyDispatch({ type: 'CART_UPDATING', value: true })
    try {
      await cartService.deleteItem(itemId, customer.id, projectId)
      invalidateCart()
      if (item) toast.success(`${item.product_id} removed`)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
    busyDispatch({ type: 'CART_UPDATING', value: false })
  }

  const handleQuantityChange = async (itemId: number, quantity: number) => {
    if (!customer) return
    busyDispatch({ type: 'CART_UPDATING', value: true })
    try {
      await cartService.updateItem(itemId, { quantity }, customer.id, projectId)
      invalidateCart()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
    busyDispatch({ type: 'CART_UPDATING', value: false })
  }

  const handleClearAll = async () => {
    if (!customer || cartItems.length === 0) return
    busyDispatch({ type: 'CLEARING', value: true })
    busyDispatch({ type: 'CART_UPDATING', value: true })
    try {
      await cartService.flush(customer.id, projectId)
      invalidateCart()
      toast.success('All items cleared')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
    busyDispatch({ type: 'CLEARING', value: false })
    busyDispatch({ type: 'CART_UPDATING', value: false })
  }

  const handleCreateProposal = async () => {
    if (!customer) {
      toast.warning('Please select a customer for this proposal')
      return
    }
    if (cartItems.length === 0) {
      toast.warning('Please add at least one product to the proposal')
      return
    }
    busyDispatch({ type: 'CREATING_PROPOSAL', value: true })
    try {
      const result = await cartService.submitProposal(customer.id, projectId)
      invalidateCart()
      toast.success('Proposal created successfully')
      navigate({ to: '/proposals', search: { autoid: result.AUTOID, status: 'all' } })
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
    busyDispatch({ type: 'CREATING_PROPOSAL', value: false })
  }

  const handleCreateOrder = async () => {
    if (!customer) {
      toast.warning('Please select a customer for this order')
      return
    }
    if (cartItems.length === 0) {
      toast.warning('Please add at least one product to the order')
      return
    }
    busyDispatch({ type: 'CREATING_ORDER', value: true })
    try {
      const result = await cartService.submitOrder(customer.id, projectId)
      invalidateCart()
      toast.success('Order created successfully')
      navigate({ to: '/orders', search: { autoid: result.AUTOID, status: 'all' } })
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
    busyDispatch({ type: 'CREATING_ORDER', value: false })
  }

  return (
    <div className='flex h-full flex-col gap-4'>
      <div className='flex items-center gap-3 min-w-0'>
        <Button variant='ghost' size='icon' asChild>
          <Link to='/'>
            <ArrowLeft className='size-4' />
          </Link>
        </Button>
        <h1 className='text-2xl font-bold'>Create New</h1>
      </div>

      <ScrollArea className='min-h-0 flex-1'>
        <div className='bg-card overflow-hidden rounded-lg border'>
          {/* Customer Selection */}
          <Section title='Select Customer' description='Choose a customer for this proposal.'>
            <CustomerCombobox value={customer} onChange={handleCustomerChange} projectId={projectId} />
          </Section>

          {/* Product Search */}
          <Section title='Add Products' description='Search for products by ID or description.'>
            <ProductSearch
              customerId={customer?.id ?? null}
              projectId={projectId}
              onSelect={handleProductSelect}
              disabled={!customer || isBusy}
            />
          </Section>

          {/* Cart Items */}
          <Section
            title='Proposal Items'
            trailing={
              cartItems.length > 0 && !cartLoading ? (
                <span className='bg-muted rounded px-2 py-0.5 text-xs'>
                  {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
                </span>
              ) : null
            }
          >
            <CartTable
              items={cartItems}
              loading={cartLoading}
              updating={busy.cartUpdating}
              fetching={cartFetching}
              onEdit={handleEditItem}
              onRemove={handleRemoveItem}
              onQuantityChange={handleQuantityChange}
            />
          </Section>

          {/* Summary */}
          {(cart || cartLoading) && (
            <div className='border-b p-4'>
              <CartSummary
                cart={cart ?? null}
                loading={cartLoading}
                updating={busy.cartUpdating}
              />
            </div>
          )}

          <CreatePageActions
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
        </div>
      </ScrollArea>

      <ProductEditSheet
        key={editProduct ? (isCartItemType(editProduct) ? editProduct.id : editProduct.autoid) : 'none'}
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
    </div>
  )
}

function isCartItemType(p: Product | CartItem): p is CartItem {
  return 'product_autoid' in p
}

function Section({
  title,
  description,
  trailing,
  children,
}: {
  title: string
  description?: string
  trailing?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className='border-b p-4'>
      <div className='mb-3 flex items-center justify-between'>
        <div>
          <h3 className='font-semibold'>{title}</h3>
          {description && <p className='text-muted-foreground text-sm'>{description}</p>}
        </div>
        {trailing}
      </div>
      {children}
    </div>
  )
}
