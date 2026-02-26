import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useReducer, useRef, useState } from 'react'
import { ArrowLeft, FilePlus2, Paperclip, Package, ShoppingCart, User } from 'lucide-react'
import { toast } from 'sonner'

import {
  EntityAttachments,
  type EntityAttachmentsRef
} from '@/components/common/entity-attachments/entity-attachments'
import { CartSummary } from './-components/cart-summary'
import { CartTable } from './-components/cart-table'
import { CreatePageActions } from './-components/create-page-actions'
import { CustomerCombobox } from './-components/customer-combobox'
import { ProductCatalogDialog } from './-components/product-catalog-dialog'
import { ProductEditSheet } from './-components/product-edit-sheet'
import { useEditSheetData } from './-components/use-edit-sheet-data'
import { CART_QUERY_KEYS, getCartQuery } from '@/api/cart/query'
import { cartService } from '@/api/cart/service'
import { getCustomerDetailQuery } from '@/api/customer/query'
import type { Customer } from '@/api/customer/schema'
import type { CartItem, Product } from '@/api/product/schema'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getErrorMessage } from '@/helpers/error'
import { useProjectId } from '@/hooks/use-project-id'
import { useSelectedCustomerId } from '@/hooks/use-selected-customer'
import { cn } from '@/lib/utils'

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
  const router = useRouter()
  const queryClient = useQueryClient()
  const [projectId] = useProjectId()
  const [savedCustomerId, setSavedCustomerId] = useSelectedCustomerId()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const attachmentsRef = useRef<EntityAttachmentsRef>(null)
  const [busy, busyDispatch] = useReducer(busyReducer, initialBusy)
  const [editState, editDispatch] = useReducer(editReducer, {
    product: null,
    mode: 'add',
    open: false,
  })

  const { data: savedCustomer, isLoading: customerLoading } = useQuery({
    ...getCustomerDetailQuery(savedCustomerId ?? '', projectId),
    enabled: !!savedCustomerId && !customer,
  })

  useEffect(() => {
    if (savedCustomer && !customer) {
      queueMicrotask(() => setCustomer(savedCustomer))
    }
  }, [savedCustomer, customer])

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
    setSavedCustomerId(c?.id ?? null)
  }

  const handleProductSelect = async (product: Product) => {
    if (!customer) return

    const hasConfigurations = Number(product.configurations) > 0
    const hasMultipleUnits = (product.units?.length ?? 0) > 1

    if (hasConfigurations || hasMultipleUnits) {
      editDispatch({ type: 'OPEN_ADD', product })
    } else {
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
    await toast.promise(
      (async () => {
        const result = await cartService.submitProposal(customer.id, projectId)
        if (attachmentsRef.current?.hasPendingFiles()) {
          await attachmentsRef.current.uploadPendingFiles(result.AUTOID, 'proposal')
        }
        return result
      })(),
      {
        loading: 'Creating proposal...',
        success: (result) => {
          invalidateCart()
          setCustomer(null)
          setSavedCustomerId(null)
          navigate({ to: '/proposals', search: { autoid: result.AUTOID, status: 'all' } })
          return 'Proposal created successfully'
        },
        error: (error) => getErrorMessage(error)
      }
    )
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
    await toast.promise(
      (async () => {
        const result = await cartService.submitOrder(customer.id, projectId)
        if (attachmentsRef.current?.hasPendingFiles()) {
          await attachmentsRef.current.uploadPendingFiles(result.AUTOID, 'order')
        }
        return result
      })(),
      {
        loading: 'Creating order...',
        success: (result) => {
          invalidateCart()
          setCustomer(null)
          setSavedCustomerId(null)
          navigate({ to: '/orders', search: { autoid: result.AUTOID, status: 'all' } })
          return 'Order created successfully'
        },
        error: (error) => getErrorMessage(error)
      }
    )
    busyDispatch({ type: 'CREATING_ORDER', value: false })
  }

  return (
    <div className='flex h-full flex-col'>
      {/* Sticky Header */}
      <header className='flex min-w-0 items-center justify-between gap-4 pb-4'>
        <div className='flex items-center gap-3'>
          <Button variant='ghost' size='icon' className='shrink-0' onClick={() => router.history.back()}>
            <ArrowLeft className='size-4' />
          </Button>
          <div className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
            <FilePlus2 className='size-5' />
          </div>
          <div className='min-w-0'>
            <h1 className='text-2xl font-semibold tracking-tight'>Create New</h1>
            <p className='text-sm text-muted-foreground'>Build a proposal or order</p>
          </div>
        </div>
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
      </header>

      <ScrollArea className='min-h-0 flex-1 -mx-4 px-4'>
        <div className='grid gap-4 pb-4 lg:grid-cols-[1fr,380px]'>
          {/* Left Column - Form */}
          <div className='flex flex-col gap-4'>
            {/* Customer Selection Card */}
            <Section
              icon={<User className='size-4' />}
              title='Customer'
              description='Select a customer for this proposal'
              step={1}
              isComplete={!!customer}
            >
              <CustomerCombobox value={customer} onChange={handleCustomerChange} projectId={projectId} />
            </Section>

            {/* Product Search Card */}
            <Section
              icon={<Package className='size-4' />}
              title='Products'
              description='Search and add products by ID or description'
              step={2}
              isComplete={cartItems.length > 0}
              isDisabled={!customer}
              allowOverflow
            >
              <div className='flex flex-col gap-3'>
                <Button
                  type='button'
                  className='w-full justify-between'
                  disabled={!customer || isBusy}
                  onClick={() => setCatalogOpen(true)}
                >
                  <span>Browse catalog</span>
                  <span className='text-primary-foreground/80 text-xs font-normal'>
                    Categories · Search · Prices
                  </span>
                </Button>
                <p className='text-xs text-muted-foreground'>
                  Use the catalog to filter by category and search across products. Configurable products will prompt for options.
                </p>
              </div>
            </Section>

            {/* Attachments */}
            <Section
              icon={<Paperclip className='size-4' />}
              title='Attachments'
              description='Add files to attach to the proposal or order after creation'
              isDisabled={!customer}
            >
              <EntityAttachments
                ref={attachmentsRef}
                entityType='proposal'
                projectId={projectId}
                mode='deferred'
              />
            </Section>
          </div>

          {/* Right Column - Cart */}
          <div className='flex flex-col gap-4'>
            <Section
              icon={<ShoppingCart className='size-4' />}
              title='Cart'
              trailing={
                cartItems.length > 0 && !cartLoading ? (
                  <span className='rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary'>
                    {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
                  </span>
                ) : null
              }
              noPadding
            >
              <CartTable
                items={cartItems}
                loading={cartLoading || customerLoading || cartFetching}
                onEdit={handleEditItem}
                onRemove={handleRemoveItem}
                onQuantityChange={handleQuantityChange}
              />
              {(cart || cartLoading || customerLoading) && (
                <div className='border-t p-4'>
                  <CartSummary
                    cart={cart ?? null}
                    loading={cartLoading || customerLoading}
                    updating={busy.cartUpdating}
                  />
                </div>
              )}
            </Section>
          </div>
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

      <ProductCatalogDialog
        open={catalogOpen}
        onOpenChange={setCatalogOpen}
        customerId={customer?.id ?? null}
        projectId={projectId}
        onSelect={handleProductSelect}
        disabled={isBusy}
      />
    </div>
  )
}

function isCartItemType(p: Product | CartItem): p is CartItem {
  return 'product_autoid' in p
}

function Section({
  icon,
  title,
  description,
  trailing,
  step,
  isComplete,
  isDisabled,
  noPadding,
  allowOverflow,
  children,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  trailing?: React.ReactNode
  step?: number
  isComplete?: boolean
  isDisabled?: boolean
  noPadding?: boolean
  allowOverflow?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card transition-all',
        !allowOverflow && 'overflow-hidden',
        isDisabled && 'opacity-60'
      )}
    >
      <div className='flex items-center gap-3 border-b bg-muted/30 px-4 py-3'>
        {step !== undefined && (
          <div
            className={cn(
              'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
              isComplete
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {step}
          </div>
        )}
        {icon && !step && (
          <div className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground'>
            {icon}
          </div>
        )}
        <div className='min-w-0 flex-1'>
          <h3 className='text-sm font-semibold'>{title}</h3>
          {description && <p className='text-xs text-muted-foreground'>{description}</p>}
        </div>
        {trailing}
      </div>
      <div className={cn(!noPadding && 'p-4')}>{children}</div>
    </div>
  )
}
