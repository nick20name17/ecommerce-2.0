import { useEffect, useReducer, useRef } from 'react'

import { type SheetAction, initialSheetState, sheetReducer } from './product-edit-sheet-reducer'
import type { CartItem, ConfigurationProduct, Product } from '@/api/product/schema'
import { productService } from '@/api/product/service'

const isCartItem = (p: Product | CartItem): p is CartItem =>
  'id' in p && typeof (p as CartItem).id === 'number' && 'product_autoid' in p

export const useProductEditSheet = (
  product: Product | CartItem | null,
  mode: 'add' | 'edit',
  open: boolean,
  configData: ConfigurationProduct | null,
  projectId?: number | null
) => {
  const [state, dispatch] = useReducer(sheetReducer, initialSheetState)
  const requestedTabsRef = useRef<Set<string>>(new Set())
  const { configs } = state

  useEffect(() => {
    if (!product || !open) return
    const qty = mode === 'edit' && isCartItem(product) ? product.quantity : 1
    const unit = product.unit || (isCartItem(product) ? '' : product.def_unit) || ''
    queueMicrotask(() => dispatch({ type: 'RESET_PRODUCT', qty, unit }))
  }, [product, mode, open])

  useEffect(() => {
    if (!configData?.configurations?.length) {
      queueMicrotask(() => {
        dispatch({ type: 'CLEAR_CONFIGS' })
        requestedTabsRef.current.clear()
      })
      return
    }
    requestedTabsRef.current.clear()
    const cloned = configData.configurations.map((c) => ({
      ...c,
      items: c.items.map((item) => ({ ...item })),
      photosRequested: false,
      photosLoading: false
    }))
    cloned.forEach((config) => {
      const hasActive = config.items.some((i) => i.active)
      if (!hasActive && config.default) {
        const def = config.items.find((i) => i.id === config.default)
        if (def) def.active = true
      }
    })
    const ids = new Set<string | number>()
    cloned.forEach((c) =>
      c.items.forEach((i) => {
        if (i.active) ids.add(i.id)
      })
    )
    queueMicrotask(() =>
      dispatch({
        type: 'SET_CONFIGS',
        configs: cloned,
        activeTab: cloned[0]?.name ?? '',
        initialConfigIds: ids
      })
    )
  }, [configData])

  // Fetch photos for all config groups (since all are shown inline, not tabbed)
  useEffect(() => {
    if (configs.length === 0 || !product) return

    const configurationId = configData?.id || configData?.autoid
    if (!configurationId) return

    const projectIdValue = projectId ?? undefined

    for (const config of configs) {
      if (requestedTabsRef.current.has(config.name)) continue
      requestedTabsRef.current.add(config.name)

      const tabToFetch = config.name
      const fetchPhotos = async () => {
        try {
          const photos = await productService.getConfigurationPhotos({
            configuration_id: configurationId,
            category_name: tabToFetch,
            project_id: projectIdValue
          })
          const photosMap = new Map(photos.map((p) => [p.id, p.photos]))
          dispatch({
            type: 'UPDATE_CONFIGS',
            updater: (prev) =>
              prev.map((c) => {
                if (c.name !== tabToFetch) return c
                return {
                  ...c,
                  photosLoading: false,
                  items: c.items.map((item) => ({
                    ...item,
                    photos: photosMap.get(item.id) ?? item.photos
                  }))
                }
              })
          })
        } catch {
          dispatch({
            type: 'UPDATE_CONFIGS',
            updater: (prev) =>
              prev.map((c) => (c.name === tabToFetch ? { ...c, photosLoading: false } : c))
          })
        }
      }

      queueMicrotask(() => {
        dispatch({
          type: 'UPDATE_CONFIGS',
          updater: (prev) =>
            prev.map((c) => (c.name === tabToFetch ? { ...c, photosLoading: true } : c))
        })
        fetchPhotos()
      })
    }
  }, [configs.length, product, projectId, configData]) // eslint-disable-line react-hooks/exhaustive-deps

  const activeConfigurations = (() => {
    const result: { name: string; id: string | number }[] = []
    configs.forEach((c) => {
      c.items.forEach((i) => {
        if (i.active) result.push({ name: c.name, id: i.id })
      })
    })
    return result
  })()

  const hasUncheckedRequired = configs.some((c) => !c.allownone && !c.items.some((i) => i.active))

  const totalPrice = (() => {
    let total = Number(configData?.base_price) || 0
    configs.forEach((c) =>
      c.items.forEach((i) => {
        if (!i.active) return
        const qty = Math.trunc(Number(i.quan))
        const multiplier = !Number.isNaN(qty) && qty > 0 ? qty : 1
        total += (Number(i.price) || 0) * multiplier
      })
    )
    return total
  })()

  const totalOldPrice = (() => {
    let total = Number(configData?.base_old_price) || 0
    configs.forEach((c) =>
      c.items.forEach((i) => {
        if (!i.active) return
        const qty = Math.trunc(Number(i.quan))
        const multiplier = !Number.isNaN(qty) && qty > 0 ? qty : 1
        total += (Number(i.old_price) || 0) * multiplier
      })
    )
    return total
  })()

  const hasChanges = (() => {
    if (state.quantity !== state.initialQuantity) return true
    const currentIds = new Set(activeConfigurations.map((c) => c.id))
    if (currentIds.size !== state.initialConfigIds.size) return true
    for (const id of currentIds) {
      if (!state.initialConfigIds.has(id)) return true
    }
    return false
  })()

  return {
    state,
    dispatch: dispatch as React.Dispatch<SheetAction>,
    activeConfigurations,
    hasUncheckedRequired,
    totalPrice,
    totalOldPrice,
    hasChanges,
    isCartItem
  }
}
