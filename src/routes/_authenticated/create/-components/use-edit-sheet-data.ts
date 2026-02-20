import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from 'sonner'

import {
  getProductByAutoidQuery,
  getProductConfigurationsQuery,
} from '@/api/product/query'
import type { CartItem, ConfigurationProduct, Product } from '@/api/product/schema'
import { getErrorMessage } from '@/helpers/error'

function isCartItem(p: Product | CartItem | null): p is CartItem {
  return p != null && 'product_autoid' in p
}

export function useEditSheetData(
  editProduct: Product | CartItem | null,
  editSheetOpen: boolean,
  customerId: string,
  projectId: number | null | undefined,
  closeSheet: (action: { type: 'CLOSE' }) => void
) {
  const autoidForConfig =
    editProduct && 'product_autoid' in editProduct
      ? editProduct.product_autoid
      : (editProduct as Product)?.autoid
  const needConfig =
    editSheetOpen &&
    !!editProduct &&
    !!customerId &&
    (isCartItem(editProduct)
      ? (editProduct.configurations?.length ?? 0) > 0
      : Number((editProduct as Product).configurations) > 0)

  const projectIdNum = projectId ?? undefined
  const configQuery = useQuery({
    ...getProductConfigurationsQuery(autoidForConfig ?? '', {
      customer_id: customerId,
      project_id: projectIdNum,
    }),
    enabled: needConfig,
  })
  const productQuery = useQuery({
    ...getProductByAutoidQuery(autoidForConfig ?? '', {
      customer_id: customerId || undefined,
      project_id: projectIdNum,
    }),
    enabled:
      editSheetOpen &&
      !!editProduct &&
      isCartItem(editProduct) &&
      !(editProduct.photos?.length) &&
      !!customerId,
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
      queueMicrotask(() => closeSheet({ type: 'CLOSE' }))
    }
  }, [configQuery.isError, configQuery.error, editSheetOpen, closeSheet])

  return {
    configData,
    configLoading: configQuery.isLoading,
    editProductWithPhotos,
  }
}
