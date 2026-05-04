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
  projectId?: number | null,
  customerId?: string
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

  // Fetch sub-configurations for active CTO items (components > 0)
  useEffect(() => {
    if (configs.length === 0 || !product) return

    for (const config of configs) {
      for (const item of config.items) {
        if (
          item.active &&
          item.components > 0 &&
          item.c_type === '2' &&
          !item.subConfigsLoaded &&
          !item.subConfigsLoading &&
          item.autoid
        ) {
          // Mark as loading
          dispatch({
            type: 'UPDATE_CONFIGS',
            updater: (prev) =>
              prev.map((c) =>
                c.name !== config.name
                  ? c
                  : {
                      ...c,
                      items: c.items.map((i) =>
                        i.id !== item.id ? i : { ...i, subConfigsLoading: true }
                      )
                    }
              )
          })

          const configName = config.name
          const itemId = item.id
          const itemAutoid = item.autoid

          productService
            .getConfigurations(itemAutoid, {
              customer_id: customerId || '',
              project_id: projectId ?? undefined
            })
            .then((subProduct) => {
              const subConfigs = subProduct.configurations.map((sc) => ({
                ...sc,
                items: sc.items.map((si) => {
                  const isDefault = !sc.allownone && sc.default === si.id
                  return { ...si, active: isDefault }
                })
              }))
              dispatch({
                type: 'UPDATE_CONFIGS',
                updater: (prev) =>
                  prev.map((c) =>
                    c.name !== configName
                      ? c
                      : {
                          ...c,
                          items: c.items.map((i) =>
                            i.id !== itemId
                              ? i
                              : {
                                  ...i,
                                  subConfigsLoading: false,
                                  subConfigsLoaded: true,
                                  subConfigurations: subConfigs
                                }
                          )
                        }
                  )
              })
            })
            .catch(() => {
              dispatch({
                type: 'UPDATE_CONFIGS',
                updater: (prev) =>
                  prev.map((c) =>
                    c.name !== configName
                      ? c
                      : {
                          ...c,
                          items: c.items.map((i) =>
                            i.id !== itemId
                              ? i
                              : { ...i, subConfigsLoading: false, subConfigsLoaded: true }
                          )
                        }
                  )
              })
            })
        }
      }
    }
  }, [configs, product, projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const activeConfigurations = (() => {
    const result: Array<{
      name: string
      id: string | number
      quan?: string
      cType?: string
      components?: number
      price?: string
      old_price?: string
      childs?: Array<{
        name: string
        id: string | number
        quan?: string
        cType?: string
        components?: number
        price?: string
        old_price?: string
        childs?: unknown[]
      }>
    }> = []
    configs.forEach((c) => {
      c.items.forEach((i) => {
        if (!i.active) return
        const entry: (typeof result)[number] = {
          name: c.name,
          id: i.id,
          quan: i.quan,
          cType: i.c_type,
          components: i.components,
          price: i.price,
          old_price: i.old_price
        }
        // Collect active sub-config items as childs
        if (i.subConfigurations) {
          const childs: NonNullable<typeof entry.childs> = []
          i.subConfigurations.forEach((sc) => {
            sc.items.forEach((si) => {
              if (!si.active) return
              childs.push({
                name: sc.name,
                id: si.id,
                quan: si.quan,
                cType: si.c_type,
                components: si.components,
                price: si.price,
                old_price: si.old_price,
                childs: []
              })
            })
          })
          if (childs.length > 0) entry.childs = childs
        }
        result.push(entry)
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
        // Add sub-configuration prices
        i.subConfigurations?.forEach((sc) =>
          sc.items.forEach((si) => {
            if (!si.active) return
            const sqty = Math.trunc(Number(si.quan))
            const smult = !Number.isNaN(sqty) && sqty > 0 ? sqty : 1
            total += (Number(si.price) || 0) * smult
          })
        )
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
        // Add sub-configuration prices
        i.subConfigurations?.forEach((sc) =>
          sc.items.forEach((si) => {
            if (!si.active) return
            const sqty = Math.trunc(Number(si.quan))
            const smult = !Number.isNaN(sqty) && sqty > 0 ? sqty : 1
            total += (Number(si.old_price) || 0) * smult
          })
        )
      })
    )
    return total
  })()

  // Wizard mode: activated when any config item is CTO (c_type=2, components>0)
  const wizardMode = configs.some((c) =>
    c.items.some((i) => i.components > 0 && i.c_type === '2')
  )

  const activeStepIndex = wizardMode ? configs.findIndex((c) => c.name === state.activeTab) : -1

  const canGoNext = (() => {
    if (!wizardMode || activeStepIndex < 0 || activeStepIndex >= configs.length - 1) return false
    const current = configs[activeStepIndex]
    if (!current.allownone && !current.items.some((i) => i.active)) return false
    const activeCTO = current.items.find((i) => i.active && i.subConfigurations?.length)
    if (activeCTO) {
      const hasUncheckedSub = activeCTO.subConfigurations!.some(
        (sc) => !sc.allownone && !sc.items.some((si) => si.active)
      )
      if (hasUncheckedSub) return false
    }
    return true
  })()

  const canGoPrev = wizardMode && activeStepIndex > 0

  const goNext = () => {
    if (canGoNext) dispatch({ type: 'SET_ACTIVE_TAB', value: configs[activeStepIndex + 1].name })
  }

  const goPrev = () => {
    if (canGoPrev) dispatch({ type: 'SET_ACTIVE_TAB', value: configs[activeStepIndex - 1].name })
  }

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
    isCartItem,
    wizardMode,
    canGoNext,
    canGoPrev,
    goNext,
    goPrev
  }
}
