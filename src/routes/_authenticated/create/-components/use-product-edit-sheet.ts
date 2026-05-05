import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'

import {
  type ConfigPath,
  type SheetAction,
  initialSheetState,
  sheetReducer,
  updateConfigsAtPath
} from './product-edit-sheet-reducer'
import type {
  CartConfiguration,
  CartItem,
  Configuration,
  ConfigurationItem,
  ConfigurationProduct,
  Product
} from '@/api/product/schema'
import { productService } from '@/api/product/service'

const isCartItem = (p: Product | CartItem): p is CartItem =>
  'id' in p && typeof (p as CartItem).id === 'number' && 'product_autoid' in p

// Backend `c_type` tagging is unreliable on some products, so we mirror Vue: fetch nested
// for any active item with an autoid. Empty `configurations[]` in the response means flat.
const shouldFetchNested = (item: ConfigurationItem) =>
  !!item.autoid && item.id !== '-1' && String(item.id) !== '-1'

// Generic walk over active items in a config tree. Carries the path of (configName, itemId)
// hops taken to reach each visited item. `walk` is the only tree traversal in this file —
// every domain predicate / accumulator below builds on it.
type ActiveVisitor<T> = (
  item: ConfigurationItem,
  configName: string,
  ancestorPath: ConfigPath
) => T | void

const walkActive = <T>(
  configs: Configuration[],
  visit: ActiveVisitor<T>,
  ancestorPath: ConfigPath = []
): T | undefined => {
  for (const config of configs) {
    for (const item of config.items) {
      if (!item.active) continue
      const result = visit(item, config.name, ancestorPath)
      if (result !== undefined) return result
      if (item.subConfigurations?.length) {
        const nested = walkActive(
          item.subConfigurations,
          visit,
          [...ancestorPath, { configName: config.name, itemId: item.id }]
        )
        if (nested !== undefined) return nested
      }
    }
  }
  return undefined
}

const applySavedSelections = (
  configs: Configuration[],
  saved: CartConfiguration[] | undefined
): Configuration[] => {
  if (!saved?.length) return configs
  const byName = new Map(saved.map((s) => [s.name, s]))
  return configs.map((c) => {
    const sav = byName.get(c.name)
    if (!sav) return c
    return {
      ...c,
      items: c.items.map((i) => (i.id === sav.id ? { ...i, active: true } : i))
    }
  })
}

const findSavedChildsAtPath = (
  saved: CartConfiguration[] | undefined,
  path: ConfigPath
): CartConfiguration[] | undefined => {
  let current: CartConfiguration[] | undefined = saved
  for (const step of path) {
    const match: CartConfiguration | undefined = current?.find(
      (c) => c.name === step.configName && c.id === step.itemId
    )
    if (!match) return undefined
    current = match.childs
  }
  return current
}

// Build the cart payload per nested-configurations-frontend-guide.md §4. `active` is omitted
// — the server adds it on the response side; the request only needs the selected ids.
const buildActivePayload = (configs: Configuration[]): CartConfiguration[] => {
  const out: CartConfiguration[] = []
  for (const c of configs) {
    for (const i of c.items) {
      if (!i.active) continue
      const entry: CartConfiguration = {
        name: c.name,
        id: i.id,
        quan: i.quan,
        cType: i.c_type,
        components: i.components,
        price: i.price,
        old_price: i.old_price
      }
      if (i.subConfigurations?.length) {
        const childs = buildActivePayload(i.subConfigurations)
        if (childs.length > 0) entry.childs = childs
      }
      out.push(entry)
    }
  }
  return out
}

const hasAnyUncheckedRequired = (configs: Configuration[]): boolean => {
  for (const c of configs) {
    const active = c.items.find((i) => i.active)
    if (!c.allownone && !active) return true
    if (active?.subConfigurations?.length && hasAnyUncheckedRequired(active.subConfigurations)) {
      return true
    }
  }
  return false
}

const isAnythingLoadingDeep = (configs: Configuration[]): boolean =>
  walkActive<true>(configs, (item) => {
    if (item.subConfigsLoading) return true
  }) === true

const sumActivePriceField = (configs: Configuration[], field: 'price' | 'old_price'): number => {
  let total = 0
  walkActive(configs, (item) => {
    const qty = Math.trunc(Number(item.quan))
    const multiplier = !Number.isNaN(qty) && qty > 0 ? qty : 1
    total += (Number(item[field]) || 0) * multiplier
  })
  return total
}

const collectActiveIds = (configs: Configuration[]): Set<string | number> => {
  const out = new Set<string | number>()
  walkActive(configs, (item) => void out.add(item.id))
  return out
}

const containsCTOItem = (configs: Configuration[]): boolean => {
  for (const c of configs) {
    for (const i of c.items) {
      if (i.c_type === '2' && i.components > 0) return true
      if (i.subConfigurations?.length && containsCTOItem(i.subConfigurations)) return true
    }
  }
  return false
}

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
  const savedSelectionsRef = useRef<CartConfiguration[] | undefined>(undefined)
  const prevDonenessRef = useRef<Map<string, boolean>>(new Map())
  const { configs, userInteractionTick } = state

  // Mirror `product.configurations` into a ref for async callbacks (post-fetch handlers
  // need the saved selections to restore nested CTO state). useEffect — never during render.
  useEffect(() => {
    savedSelectionsRef.current =
      product && isCartItem(product) && mode === 'edit' ? product.configurations : undefined
  }, [product, mode])

  useEffect(() => {
    if (!product || !open) return
    const qty = mode === 'edit' && isCartItem(product) ? product.quantity : 1
    const unit = product.unit || (isCartItem(product) ? '' : product.def_unit) || ''
    queueMicrotask(() => dispatch({ type: 'RESET_PRODUCT', qty, unit }))
  }, [product, mode, open])

  useEffect(() => {
    requestedTabsRef.current.clear()
    prevDonenessRef.current.clear()
    if (!configData?.configurations?.length) {
      queueMicrotask(() => dispatch({ type: 'CLEAR_CONFIGS' }))
      return
    }
    // Match Vue: no auto-default selection. Only saved cart-item selections (applied upstream
    // in use-edit-sheet-data.ts) carry over. Required configs start empty — user must pick.
    const cloned = configData.configurations.map((c) => ({
      ...c,
      items: c.items.map((item) => ({ ...item })),
      photosRequested: false,
      photosLoading: false
    }))
    queueMicrotask(() =>
      dispatch({
        type: 'SET_CONFIGS',
        configs: cloned,
        activeTab: cloned[0]?.name ?? '',
        initialConfigIds: collectActiveIds(cloned)
      })
    )
  }, [configData])

  // Fetch photos for top-level config groups
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

  // Recursively fetch sub-configurations for any active item at any depth.
  useEffect(() => {
    if (configs.length === 0 || !product) return

    type Task = {
      ancestorPath: ConfigPath
      configName: string
      itemId: string
      itemAutoid: string
    }
    const tasks: Task[] = []
    const seenInThisRun = new Set<string>()

    walkActive(configs, (item, configName, ancestorPath) => {
      if (
        shouldFetchNested(item) &&
        !item.subConfigsLoaded &&
        !item.subConfigsLoading &&
        !seenInThisRun.has(item.autoid)
      ) {
        seenInThisRun.add(item.autoid)
        tasks.push({ ancestorPath, configName, itemId: item.id, itemAutoid: item.autoid })
      }
    })

    if (tasks.length === 0) return

    const patchItem = (
      task: Task,
      patch: (i: ConfigurationItem) => ConfigurationItem
    ) =>
      dispatch({
        type: 'UPDATE_CONFIGS',
        updater: (prev) =>
          updateConfigsAtPath(prev, task.ancestorPath, (configs) =>
            configs.map((c) =>
              c.name !== task.configName
                ? c
                : {
                    ...c,
                    items: c.items.map((i) => (i.id !== task.itemId ? i : patch(i)))
                  }
            )
          )
      })

    for (const t of tasks) {
      patchItem(t, (i) => ({ ...i, subConfigsLoading: true }))

      productService
        .getConfigurations(t.itemAutoid, {
          customer_id: customerId || '',
          project_id: projectId ?? undefined
        })
        .then((subProduct) => {
          const fullPath = [...t.ancestorPath, { configName: t.configName, itemId: t.itemId }]
          const savedChilds = findSavedChildsAtPath(savedSelectionsRef.current, fullPath)
          const cloned = subProduct.configurations.map((sc) => ({
            ...sc,
            items: sc.items.map((si) => ({ ...si }))
          }))
          const subConfigs = applySavedSelections(cloned, savedChilds)
          patchItem(t, (i) => ({
            ...i,
            subConfigsLoading: false,
            subConfigsLoaded: true,
            subConfigurations: subConfigs
          }))
        })
        .catch(() => {
          patchItem(t, (i) => ({ ...i, subConfigsLoading: false, subConfigsLoaded: true }))
        })
    }
  }, [configs, product, projectId, customerId])

  const activeConfigurations = useMemo(() => buildActivePayload(configs), [configs])
  const hasUncheckedRequired = useMemo(() => hasAnyUncheckedRequired(configs), [configs])
  const totalPrice = useMemo(
    () => (Number(configData?.base_price) || 0) + sumActivePriceField(configs, 'price'),
    [configs, configData?.base_price]
  )
  const totalOldPrice = useMemo(
    () =>
      (Number(configData?.base_old_price) || 0) + sumActivePriceField(configs, 'old_price'),
    [configs, configData?.base_old_price]
  )

  // Wizard mode is decided once per product from the source data — flipping after fetches
  // settled would jump the layout mid-interaction.
  const wizardMode = useMemo(
    () => (configData?.configurations ? containsCTOItem(configData.configurations) : false),
    [configData]
  )

  const activeStepIndex = wizardMode ? configs.findIndex((c) => c.name === state.activeTab) : -1

  // `requireSelection` distinguishes the lenient validity check (Next-step button: allownone
  // empty is OK) from the strict completion check (auto-advance: must have an active item).
  const isStepDone = useCallback(
    (step: Configuration | undefined, requireSelection: boolean): boolean => {
      if (!step) return false
      const activeItem = step.items.find((i) => i.active)
      if (!activeItem) return !requireSelection && step.allownone
      if (activeItem.subConfigsLoading) return false
      if (activeItem.subConfigurations?.length) {
        if (requireSelection && isAnythingLoadingDeep(activeItem.subConfigurations)) return false
        if (hasAnyUncheckedRequired(activeItem.subConfigurations)) return false
      }
      return true
    },
    []
  )

  const isStepFullyDone = useCallback(
    (step: Configuration | undefined) => isStepDone(step, true),
    [isStepDone]
  )

  const canGoNext = (() => {
    if (!wizardMode || activeStepIndex < 0 || activeStepIndex >= configs.length - 1) return false
    return isStepDone(configs[activeStepIndex], false)
  })()

  const canGoPrev = wizardMode && activeStepIndex > 0

  const goNext = () => {
    if (canGoNext) dispatch({ type: 'SET_ACTIVE_TAB', value: configs[activeStepIndex + 1].name })
  }

  const goPrev = () => {
    if (canGoPrev) dispatch({ type: 'SET_ACTIVE_TAB', value: configs[activeStepIndex - 1].name })
  }

  // Auto-advance on incomplete → complete transition. Always updates the ref so async-fetch
  // settled values are captured, but only dispatches once `userInteractionTick > 0` — initial
  // render with edit-mode saved selections must not auto-jump through completed steps.
  useEffect(() => {
    if (!wizardMode || activeStepIndex < 0 || activeStepIndex >= configs.length - 1) return
    const current = configs[activeStepIndex]
    const wasDone = prevDonenessRef.current.get(current.name) ?? false
    const wasTracked = prevDonenessRef.current.has(current.name)
    const isDone = isStepFullyDone(current)
    prevDonenessRef.current.set(current.name, isDone)
    if (userInteractionTick > 0 && wasTracked && isDone && !wasDone) {
      dispatch({ type: 'SET_ACTIVE_TAB', value: configs[activeStepIndex + 1].name })
    }
  }, [configs, wizardMode, activeStepIndex, isStepFullyDone, userInteractionTick])

  const hasChanges = useMemo(() => {
    if (state.quantity !== state.initialQuantity) return true
    const currentIds = collectActiveIds(configs)
    if (currentIds.size !== state.initialConfigIds.size) return true
    for (const id of currentIds) {
      if (!state.initialConfigIds.has(id)) return true
    }
    return false
  }, [configs, state.quantity, state.initialQuantity, state.initialConfigIds])

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
    goPrev,
    isStepFullyDone,
    userInteractionTick
  }
}
