import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useEditSheetData } from './use-edit-sheet-data'
import { CART_QUERY_KEYS, getCartQuery } from '@/api/cart/query'
import { cartService } from '@/api/cart/service'
import type { Cart } from '@/api/product/schema'
import { getCustomerDetailQuery } from '@/api/customer/query'
import type { Customer } from '@/api/customer/schema'
import { orderService } from '@/api/order/service'
import type { OrderPatchPayload } from '@/api/order/schema'
import type { CartItem, Product } from '@/api/product/schema'
import type { EntityAttachmentsRef } from '@/components/common/entity-attachments/entity-attachments'
import { getErrorMessage } from '@/helpers/error'
import { cancelPendingCreatedAutoid, waitForCreatedAutoid } from '@/helpers/pending-created-autoid'
import { addPendingOrder, addPendingProposal, removePendingOrder, removePendingProposal } from '@/hooks/use-pending-orders'
import { useProjectId } from '@/hooks/use-project-id'
import { useSelectedCustomerId } from '@/hooks/use-selected-customer'

type EditState = { product: Product | CartItem | null; mode: 'add' | 'edit'; open: boolean }
type EditAction =
  | { type: 'OPEN_ADD'; product: Product }
  | { type: 'OPEN_EDIT'; item: CartItem }
  | { type: 'CLOSE' }

const editReducer = (state: EditState, action: EditAction): EditState => {
  switch (action.type) {
    case 'OPEN_ADD':
      return {
        product: { ...action.product, unit: action.product.unit || action.product.def_unit },
        mode: 'add',
        open: true
      }
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

const busyReducer = (state: BusyState, action: BusyAction): BusyState => {
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
  creatingOrder: false
}

const isCartItemType = (p: Product | CartItem): p is CartItem => {
  return 'product_autoid' in p
}

export interface AddressFields {
  name: string
  address1: string
  address2: string
  city: string
  state: string
  zip: string
}

const emptyAddress: AddressFields = { name: '', address1: '', address2: '', city: '', state: '', zip: '' }

const addressFromCustomer = (c: Customer): AddressFields => ({
  name: c.l_name ?? '',
  address1: c.address1 ?? '',
  address2: c.address2 ?? '',
  city: c.city ?? '',
  state: c.state ?? '',
  zip: c.zip ?? '',
})

export function useCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [projectId] = useProjectId()
  const [savedCustomerId, setSavedCustomerId] = useSelectedCustomerId()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [billTo, setBillTo] = useState<AddressFields>(emptyAddress)
  const [shipTo, setShipTo] = useState<AddressFields>(emptyAddress)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [addingProductAutoid, setAddingProductAutoid] = useState<string | null>(null)
  const [updatingQuantityItemId, setUpdatingQuantityItemId] = useState<number | null>(null)
  const [removingItemId, setRemovingItemId] = useState<number | null>(null)
  const attachmentsRef = useRef<EntityAttachmentsRef>(null)
  const [busy, busyDispatch] = useReducer(busyReducer, initialBusy)
  const [editState, editDispatch] = useReducer(editReducer, {
    product: null,
    mode: 'add',
    open: false
  })

  // Fetch full customer detail whenever we have a customer ID
  const customerId = customer?.id ?? savedCustomerId ?? ''
  const { data: customerDetail, isLoading: customerLoading } = useQuery({
    ...getCustomerDetailQuery(customerId, projectId),
    enabled: !!customerId
  })

  // Restore saved customer on page load
  useEffect(() => {
    if (customerDetail && !customer && savedCustomerId) {
      queueMicrotask(() => {
        setCustomer(customerDetail)
        const addr = addressFromCustomer(customerDetail)
        setBillTo(addr)
        setShipTo(addr)
      })
    }
  }, [customerDetail, customer, savedCustomerId])

  const { data: cart, isLoading: cartLoading, fetchStatus: cartFetchStatus } = useQuery({
    ...getCartQuery(customer?.id ?? '', projectId)
  })
  // isLoading is true for disabled queries (pending + idle). Only treat as loading when actually fetching.
  const cartActuallyLoading = cartLoading && cartFetchStatus === 'fetching'
  const { product: editProduct, mode: editMode, open: editSheetOpen } = editState

  const { configData, configLoading, editProductWithPhotos } = useEditSheetData(
    editProduct,
    editSheetOpen,
    customer?.id ?? '',
    projectId,
    editDispatch
  )

  const cartItems = cart?.items ?? []
  const isBusy = busy.cartUpdating || cartLoading || busy.creatingProposal || busy.creatingOrder

  // Set cart data directly from API response (avoids redundant GET refetch)
  const setCart = useCallback(
    (data: Cart) => {
      if (customer?.id != null) {
        queryClient.setQueryData(CART_QUERY_KEYS.detail(customer.id, projectId), data)
      }
    },
    [customer?.id, projectId, queryClient]
  )

  const invalidateCart = () => {
    if (customer?.id != null) {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEYS.detail(customer.id, projectId) })
    }
  }

  const handleCustomerChange = (c: Customer | null) => {
    setCustomer(c)
    setSavedCustomerId(c?.id ?? null)
    if (c) {
      const addr = addressFromCustomer(c)
      setBillTo(addr)
      setShipTo(addr)
    } else {
      setBillTo(emptyAddress)
      setShipTo(emptyAddress)
    }
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
        unit: product.unit || product.def_unit || ''
      }
      setAddingProductAutoid(product.autoid)
      try {
        const updatedCart = await cartService.addItem(payload, customerId, projectId)
        setCart(updatedCart)
        toast.success(`${product.id} added to cart`)
      } catch (error) {
        toast.error(getErrorMessage(error))
      } finally {
        setAddingProductAutoid(null)
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
    setRemovingItemId(itemId)
    busyDispatch({ type: 'CART_UPDATING', value: true })
    try {
      const updatedCart = await cartService.deleteItem(itemId, customer.id, projectId)
      setCart(updatedCart)
      if (item) toast.success(`${item.product_id} removed`)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      busyDispatch({ type: 'CART_UPDATING', value: false })
      setRemovingItemId(null)
    }
  }

  // Debounced quantity update — optimistically updates local cart, debounces API call
  const qtyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const qtyAbortRef = useRef<AbortController | null>(null)

  const handleQuantityChange = useCallback(
    (itemId: number, quantity: number) => {
      if (!customer) return

      // Optimistically update the cart items in cache
      const cartKey = CART_QUERY_KEYS.detail(customer.id, projectId)
      const currentCart = queryClient.getQueryData<Cart>(cartKey)
      if (currentCart?.items) {
        const item = currentCart.items.find((i) => i.id === itemId)
        if (item) {
          queryClient.setQueryData(cartKey, {
            ...currentCart,
            items: currentCart.items.map((i) =>
              i.id === itemId ? { ...i, quantity } : i
            )
          })
        }
      }

      setUpdatingQuantityItemId(itemId)
      busyDispatch({ type: 'CART_UPDATING', value: true })

      // Cancel pending debounce
      if (qtyTimerRef.current) clearTimeout(qtyTimerRef.current)
      if (qtyAbortRef.current) qtyAbortRef.current.abort()

      qtyTimerRef.current = setTimeout(async () => {
        const controller = new AbortController()
        qtyAbortRef.current = controller
        try {
          const updatedCart = await cartService.updateItem(
            itemId,
            { quantity },
            customer.id,
            projectId
          )
          if (!controller.signal.aborted) {
            setCart(updatedCart)
          }
        } catch (error) {
          if (!controller.signal.aborted) {
            toast.error(getErrorMessage(error))
            invalidateCart() // Refetch on error to restore correct state
          }
        } finally {
          if (!controller.signal.aborted) {
            busyDispatch({ type: 'CART_UPDATING', value: false })
            setUpdatingQuantityItemId(null)
          }
        }
      }, 400)
    },
    [customer, projectId, queryClient, setCart, invalidateCart]
  )

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

  const handleCreateProposal = () => {
    if (!customer) {
      toast.warning('Please select a customer for this proposal')
      return
    }
    if (cartItems.length === 0) {
      toast.warning('Please add at least one product to the proposal')
      return
    }

    const custId = customer.id
    const projId = projectId
    const pendingAttachments = attachmentsRef.current?.hasPendingFiles()
      ? attachmentsRef.current
      : null

    addPendingProposal()
    invalidateCart()
    setCustomer(null)
    setSavedCustomerId(null)
    toast.success('Proposal submitted — processing in background')
    navigate({ to: '/proposals', search: { status: 'all' } })

    cartService.submitProposal(custId, projId)
      .then(() => {
        removePendingProposal()
        return waitForCreatedAutoid('proposal', 60_000)
      })
      .then(async (autoid) => {
        if (pendingAttachments) {
          await pendingAttachments.uploadPendingFiles(autoid, 'proposal')
        }
      })
      .catch((e) => {
        removePendingProposal()
        cancelPendingCreatedAutoid('proposal')
        toast.error(getErrorMessage(e))
      })
  }

  const patchAddresses = async (autoid: string) => {
    const payload: OrderPatchPayload = {
      name: billTo.name,
      address1: billTo.address1,
      address2: billTo.address2,
      city: billTo.city,
      state: billTo.state,
      zip: billTo.zip,
      c_name: shipTo.name,
      c_address1: shipTo.address1,
      c_address2: shipTo.address2,
      c_city: shipTo.city,
      c_state: shipTo.state,
      c_zip: shipTo.zip,
    }
    try {
      await orderService.patch(autoid, payload)
    } catch {
      // Non-blocking — order is already created
    }
  }

  const handleCreateOrder = () => {
    if (!customer) {
      toast.warning('Please select a customer for this order')
      return
    }
    if (cartItems.length === 0) {
      toast.warning('Please add at least one product to the order')
      return
    }

    // Capture refs before navigating (component will unmount)
    const custId = customer.id
    const projId = projectId
    const pendingAttachments = attachmentsRef.current?.hasPendingFiles()
      ? attachmentsRef.current
      : null

    // Navigate immediately — don't wait for the API
    addPendingOrder()
    invalidateCart()
    setCustomer(null)
    setSavedCustomerId(null)
    toast.success('Order submitted — processing in background')
    navigate({ to: '/orders', search: { status: 'all' } })

    // Fire-and-forget: entire flow runs in background
    cartService.submitOrder(custId, projId)
      .then(() => {
        removePendingOrder()
        return waitForCreatedAutoid('order', 60_000)
      })
      .then(async (autoid) => {
        await Promise.all([
          patchAddresses(autoid),
          pendingAttachments
            ? pendingAttachments.uploadPendingFiles(autoid, 'order')
            : Promise.resolve(),
        ])
      })
      .catch((e) => {
        removePendingOrder()
        cancelPendingCreatedAutoid('order')
        toast.error(getErrorMessage(e))
      })
  }

  return {
    projectId,
    customer,
    customerDetail: customerDetail ?? customer,
    catalogOpen,
    setCatalogOpen,
    cart,
    cartItems,
    cartLoading: cartActuallyLoading,
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
    isCartItemType
  }
}
