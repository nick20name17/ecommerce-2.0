import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Eraser, FileCheck, ShoppingCart } from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { CartSummary } from './-components/cart-summary'
import { CartTable } from './-components/cart-table'
import { CustomerCombobox } from './-components/customer-combobox'
import { ProductEditSheet } from './-components/product-edit-sheet'
import { ProductSearch } from './-components/product-search'
import { cartService } from '@/api/cart/service'
import type { Cart, CartItem, ConfigurationProduct, Product } from '@/api/product/schema'
import { productService } from '@/api/product/service'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Spinner } from '@/components/ui/spinner'
import type { Customer } from '@/api/customer/schema'
import { getErrorMessage } from '@/helpers/error'
import { useProjectIdParam } from '@/hooks/use-query-params'

export const Route = createFileRoute('/_authenticated/create/')({
  component: CreatePage,
})

function CreatePage() {
  const navigate = useNavigate()
  const [projectId] = useProjectIdParam()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [cart, setCart] = useState<Cart | null>(null)
  const [cartLoading, setCartLoading] = useState(false)
  const [cartUpdating, setCartUpdating] = useState(false)
  const [clearingCart, setClearingCart] = useState(false)
  const [creatingProposal, setCreatingProposal] = useState(false)
  const [creatingOrder, setCreatingOrder] = useState(false)

  const [editProduct, setEditProduct] = useState<Product | CartItem | null>(null)
  const [editMode, setEditMode] = useState<'add' | 'edit'>('add')
  const [editSheetOpen, setEditSheetOpen] = useState(false)
  const [configData, setConfigData] = useState<ConfigurationProduct | null>(null)
  const [configLoading, setConfigLoading] = useState(false)

  const cartItems = cart?.items ?? []
  const isBusy = cartUpdating || cartLoading || creatingProposal || creatingOrder

  const loadCart = useCallback(async (customerId: string) => {
    setCartLoading(true)
    try {
      const data = await cartService.get(customerId, projectId)
      setCart(data)
    } catch (error) {
      setCart(null)
      toast.error(getErrorMessage(error))
    } finally {
      setCartLoading(false)
    }
  }, [projectId])

  const refreshCart = useCallback(async () => {
    if (!customer) return
    setCartUpdating(true)
    try {
      const data = await cartService.get(customer.id, projectId)
      setCart(data)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setCartUpdating(false)
    }
  }, [customer, projectId])

  const handleCustomerChange = useCallback(
    async (c: Customer | null) => {
      setCustomer(c)
      if (c) {
        await loadCart(c.id)
      } else {
        setCart(null)
      }
    },
    [loadCart]
  )

  const handleProductSelect = useCallback(
    async (product: Product) => {
      if (!customer) return

      const hasConfigurations = Number(product.configurations) > 0
      const hasMultipleUnits = (product.units?.length ?? 0) > 1

      if (hasConfigurations || hasMultipleUnits) {
        setEditProduct({ ...product, unit: product.unit || product.def_unit })
        setEditMode('add')
        setEditSheetOpen(true)

        if (hasConfigurations) {
          setConfigLoading(true)
          try {
            const data = await productService.getConfigurations(product.autoid, {
              customer_id: customer.id,
              project_id: projectId ?? undefined,
            })
            setConfigData(data)
          } catch (error) {
            toast.error(getErrorMessage(error))
            setEditSheetOpen(false)
            setEditProduct(null)
          } finally {
            setConfigLoading(false)
          }
        }
      } else {
        setCartUpdating(true)
        setConfigLoading(true)
        try {
          await cartService.addItem(
            {
              product_autoid: product.autoid,
              quantity: 1,
              unit: product.unit || product.def_unit || '',
            },
            customer.id,
            projectId
          )
          await refreshCart()
          toast.success(`${product.id} added to cart`)
        } catch (error) {
          toast.error(getErrorMessage(error))
        } finally {
          setConfigLoading(false)
          setCartUpdating(false)
        }
      }
    },
    [customer, refreshCart, projectId]
  )

  const handleEditItem = useCallback(
    async (item: CartItem) => {
      if (!customer) return
      setEditProduct({ ...item })
      setEditMode('edit')
      setEditSheetOpen(true)
      setConfigData(null)

      const needsConfigurations = item.configurations?.length > 0
      if (needsConfigurations) {
        setConfigLoading(true)
        try {
          const [data, productData] = await Promise.all([
            productService.getConfigurations(item.product_autoid, {
              customer_id: customer.id,
              project_id: projectId ?? undefined,
            }),
            !item.photos?.length
              ? productService.getByAutoid(item.product_autoid, {
                  customer_id: customer.id,
                  project_id: projectId ?? undefined,
                })
              : null,
          ])
          if (data?.configurations) {
            const savedByGroup = new Map<string, string>()
            for (const c of item.configurations) savedByGroup.set(c.name, c.id)
            for (const group of data.configurations) {
              for (const gi of group.items) {
                gi.active = gi.id === savedByGroup.get(group.name)
              }
            }
          }
          if (productData?.photos?.length) {
            setEditProduct((prev) =>
              prev ? { ...prev, photos: productData.photos as string[] } : prev
            )
          }
          setConfigData(data)
        } catch (error) {
          toast.error(getErrorMessage(error))
          setEditSheetOpen(false)
          setEditProduct(null)
        } finally {
          setConfigLoading(false)
        }
      }
    },
    [customer, projectId]
  )

  const handleRemoveItem = useCallback(
    async (itemId: number) => {
      if (!customer) return
      const item = cartItems.find((i) => i.id === itemId)
      setCartUpdating(true)
      try {
        const data = await cartService.deleteItem(itemId, customer.id, projectId)
        setCart(data)
        if (item) toast.success(`${item.product_id} removed`)
      } catch (error) {
        toast.error(getErrorMessage(error))
      } finally {
        setCartUpdating(false)
      }
    },
    [customer, cartItems, projectId]
  )

  const handleQuantityChange = useCallback(
    async (itemId: number, quantity: number) => {
      if (!customer) return
      setCartUpdating(true)
      try {
        const data = await cartService.updateItem(itemId, { quantity }, customer.id, projectId)
        setCart(data)
      } catch (error) {
        toast.error(getErrorMessage(error))
      } finally {
        setCartUpdating(false)
      }
    },
    [customer, projectId]
  )

  const handleClearAll = useCallback(async () => {
    if (!customer || cartItems.length === 0) return
    setClearingCart(true)
    setCartUpdating(true)
    try {
      await cartService.flush(customer.id, projectId)
      setCart((prev) => (prev ? { ...prev, items: [], total: 0, old_total: 0 } : prev))
      toast.success('All items cleared')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setClearingCart(false)
      setCartUpdating(false)
    }
  }, [customer, cartItems.length, projectId])

  const handleCreateProposal = useCallback(async () => {
    if (!customer || cartItems.length === 0) return
    setCreatingProposal(true)
    try {
      await cartService.submitProposal(customer.id, projectId)
      setCart((prev) => (prev ? { ...prev, items: [], total: 0, old_total: 0 } : prev))
      toast.success('Proposal created successfully')
      navigate({ to: '/' })
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setCreatingProposal(false)
    }
  }, [customer, cartItems.length, navigate, projectId])

  const handleCreateOrder = useCallback(async () => {
    if (!customer || cartItems.length === 0) return
    setCreatingOrder(true)
    try {
      await cartService.submitOrder(customer.id, projectId)
      setCart((prev) => (prev ? { ...prev, items: [], total: 0, old_total: 0 } : prev))
      toast.success('Order created successfully')
      navigate({ to: '/' })
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setCreatingOrder(false)
    }
  }, [customer, cartItems.length, navigate, projectId])

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
              onEdit={handleEditItem}
              onRemove={handleRemoveItem}
              onQuantityChange={handleQuantityChange}
            />
          </Section>

          {/* Summary */}
          {(cart || cartLoading) && (
            <div className='border-b p-4'>
              <CartSummary cart={cart} loading={cartLoading} updating={cartUpdating} />
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
        product={editProduct}
        mode={editMode}
        configData={configData}
        configLoading={configLoading}
        customerId={customer?.id ?? ''}
        projectId={projectId}
        onSaved={refreshCart}
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
