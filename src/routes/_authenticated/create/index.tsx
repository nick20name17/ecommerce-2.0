import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Eraser, FileCheck, ShoppingCart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { CartSummary } from './-components/cart-summary'
import { CartTable } from './-components/cart-table'
import { CustomerCombobox } from './-components/customer-combobox'
import { ProductEditSheet } from './-components/product-edit-sheet'
import { ProductSearch } from './-components/product-search'
import { CART_QUERY_KEYS, getCartQuery } from '@/api/cart/query'
import { cartService } from '@/api/cart/service'
import {
  getProductByAutoidQuery,
  getProductConfigurationsQuery,
} from '@/api/product/query'
import type { CartItem, ConfigurationProduct, Product } from '@/api/product/schema'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Spinner } from '@/components/ui/spinner'
import type { Customer } from '@/api/customer/schema'
import { getErrorMessage } from '@/helpers/error'
import { useProjectId } from '@/hooks/use-project-id'

export const Route = createFileRoute('/_authenticated/create/')({
  component: CreatePage,
})

function CreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [projectId] = useProjectId()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const { data: cart, isLoading: cartLoading, isFetching: cartFetching } = useQuery({
    ...getCartQuery(customer?.id ?? '', projectId),
  })
  const [cartUpdating, setCartUpdating] = useState(false)
  const [clearingCart, setClearingCart] = useState(false)
  const [creatingProposal, setCreatingProposal] = useState(false)
  const [creatingOrder, setCreatingOrder] = useState(false)

  const [editProduct, setEditProduct] = useState<Product | CartItem | null>(null)
  const [editMode, setEditMode] = useState<'add' | 'edit'>('add')
  const [editSheetOpen, setEditSheetOpen] = useState(false)

  const autoidForConfig =
    editProduct && 'product_autoid' in editProduct
      ? editProduct.product_autoid
      : (editProduct as Product)?.autoid
  const needConfig =
    editSheetOpen &&
    !!editProduct &&
    !!customer?.id &&
    (isCartItem(editProduct)
      ? (editProduct.configurations?.length ?? 0) > 0
      : Number((editProduct as Product).configurations) > 0)
  const configQuery = useQuery({
    ...getProductConfigurationsQuery(autoidForConfig ?? '', {
      customer_id: customer?.id ?? '',
      project_id: projectId ?? undefined,
    }),
    enabled: needConfig,
  })
  const productQuery = useQuery({
    ...getProductByAutoidQuery(autoidForConfig ?? '', {
      customer_id: customer?.id,
      project_id: projectId ?? undefined,
    }),
    enabled:
      editSheetOpen &&
      !!editProduct &&
      isCartItem(editProduct) &&
      !(editProduct.photos?.length) &&
      !!customer?.id,
  })
  const configData = ((): ConfigurationProduct | null => {
    const data = configQuery.data
    if (!data?.configurations || !editProduct || !isCartItem(editProduct)) return data ?? null
    const savedByGroup = new Map<string, string>()
    for (const c of editProduct.configurations) savedByGroup.set(c.name, c.id)
    const next = JSON.parse(JSON.stringify(data)) as ConfigurationProduct
    for (const group of next.configurations ?? []) {
      for (const gi of group.items) {
        gi.active = gi.id === savedByGroup.get(group.name)
      }
    }
    return next
  })()
  const configLoading = configQuery.isLoading
  const editProductWithPhotos =
    !editProduct ||
    !isCartItem(editProduct) ||
    (editProduct.photos?.length ?? 0) > 0
      ? editProduct
      : (() => {
          const photos = productQuery.data?.photos
          return photos?.length ? { ...editProduct, photos: photos as string[] } : editProduct
        })()

  useEffect(() => {
    if (configQuery.isError && editSheetOpen) {
      toast.error(getErrorMessage(configQuery.error))
      queueMicrotask(() => {
        setEditSheetOpen(false)
        setEditProduct(null)
      })
    }
  }, [configQuery.isError, configQuery.error, editSheetOpen])

  const cartItems = cart?.items ?? []
  const isBusy = cartUpdating || cartLoading || creatingProposal || creatingOrder

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
      setEditProduct({ ...product, unit: product.unit || product.def_unit })
      setEditMode('add')
      setEditSheetOpen(true)
    } else {
      setCartUpdating(true)
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
      setCartUpdating(false)
    }
  }

  const handleEditItem = (item: CartItem) => {
    if (!customer) return
    setEditProduct({ ...item })
    setEditMode('edit')
    setEditSheetOpen(true)
  }

  const handleRemoveItem = async (itemId: number) => {
    if (!customer) return
    const item = cartItems.find((i) => i.id === itemId)
    setCartUpdating(true)
    try {
      await cartService.deleteItem(itemId, customer.id, projectId)
      invalidateCart()
      if (item) toast.success(`${item.product_id} removed`)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
    setCartUpdating(false)
  }

  const handleQuantityChange = async (itemId: number, quantity: number) => {
    if (!customer) return
    setCartUpdating(true)
    try {
      await cartService.updateItem(itemId, { quantity }, customer.id, projectId)
      invalidateCart()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
    setCartUpdating(false)
  }

  const handleClearAll = async () => {
    if (!customer || cartItems.length === 0) return
    setClearingCart(true)
    setCartUpdating(true)
    try {
      await cartService.flush(customer.id, projectId)
      invalidateCart()
      toast.success('All items cleared')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
    setClearingCart(false)
    setCartUpdating(false)
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
    setCreatingProposal(true)
    try {
      await cartService.submitProposal(customer.id, projectId)
      invalidateCart()
      toast.success('Proposal created successfully')
      navigate({ to: '/proposals' })
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
    setCreatingProposal(false)
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
    setCreatingOrder(true)
    try {
      await cartService.submitOrder(customer.id, projectId)
      invalidateCart()
      toast.success('Order created successfully')
      navigate({ to: '/orders' })
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
    setCreatingOrder(false)
  }

  return (
    <div className='flex h-full flex-col gap-4'>
      <h1 className='text-2xl font-bold'>Create New</h1>

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
              updating={cartUpdating}
              fetching={cartFetching}
              onEdit={handleEditItem}
              onRemove={handleRemoveItem}
              onQuantityChange={handleQuantityChange}
            />
          </Section>

          {/* Summary */}
          {(cart || cartLoading) && (
            <div className='border-b p-4'>
              <CartSummary cart={cart ?? null} loading={cartLoading} updating={cartUpdating} />
            </div>
          )}

          {/* Actions */}
          <div className='flex flex-wrap justify-end gap-2 p-4'>
            <Button variant='ghost' onClick={() => navigate({ to: '/' })}>
            Cancel
          </Button>
            <Button
              variant='outline'
              disabled={cartItems.length === 0 || isBusy}
              onClick={handleClearAll}
            >
              {clearingCart ? <Spinner className='mr-2 size-4' /> : <Eraser className='mr-2 size-4' />}
              Clear All
            </Button>
            <Button
              variant='default'
              disabled={!customer || cartItems.length === 0 || isBusy}
              onClick={handleCreateProposal}
            >
              {creatingProposal ? <Spinner className='mr-2 size-4' /> : <FileCheck className='mr-2 size-4' />}
              Create Proposal
            </Button>
            <Button
              variant='secondary'
              disabled={!customer || cartItems.length === 0 || isBusy}
              onClick={handleCreateOrder}
            >
              {creatingOrder ? <Spinner className='mr-2 size-4' /> : <ShoppingCart className='mr-2 size-4' />}
              Create Order
            </Button>
          </div>
        </div>
      </ScrollArea>

      <ProductEditSheet
        key={editProduct ? (isCartItemType(editProduct) ? editProduct.id : editProduct.autoid) : 'none'}
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
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

function isCartItem(p: Product | CartItem | null): p is CartItem {
  return p != null && 'product_autoid' in p
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
