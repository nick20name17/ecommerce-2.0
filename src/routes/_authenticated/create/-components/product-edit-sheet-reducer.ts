import type { Configuration, ConfigurationItem } from '@/api/product/schema'

export type ConfigPath = Array<{ configName: string; itemId: string }>

export type SheetState = {
  quantity: number
  initialQuantity: number
  saving: boolean
  confirmClose: boolean
  photoIndex: number
  selectedUnit: string
  configs: Configuration[]
  activeTab: string
  initialConfigIds: Set<string | number>
  /** Monotonic counter incremented by every user-driven selection or reset. Auto-advance/auto-open
   *  reads this to ignore initial render and async-fetch-driven transitions, so edit-mode loads
   *  with saved selections don't auto-jump through completed steps. */
  userInteractionTick: number
}

export type SheetAction =
  | { type: 'RESET_PRODUCT'; qty: number; unit: string }
  | { type: 'SET_QUANTITY'; value: number }
  | { type: 'SET_SAVING'; value: boolean }
  | { type: 'SET_CONFIRM_CLOSE'; value: boolean }
  | { type: 'SET_PHOTO_INDEX'; value: number }
  | { type: 'SET_SELECTED_UNIT'; value: string }
  | {
      type: 'SET_CONFIGS'
      configs: Configuration[]
      activeTab: string
      initialConfigIds: Set<string | number>
    }
  | { type: 'CLEAR_CONFIGS' }
  | { type: 'SET_ACTIVE_TAB'; value: string }
  | { type: 'UPDATE_CONFIGS'; updater: (prev: Configuration[]) => Configuration[] }
  | { type: 'SELECT_ITEM'; path: ConfigPath; configName: string; itemId: string }
  | { type: 'DESELECT_ALL_CONFIGS' }

export const initialSheetState: SheetState = {
  quantity: 1,
  initialQuantity: 1,
  saving: false,
  confirmClose: false,
  photoIndex: 0,
  selectedUnit: '',
  configs: [],
  activeTab: '',
  initialConfigIds: new Set(),
  userInteractionTick: 0
}

const toggleItemInConfigs = (
  configs: Configuration[],
  configName: string,
  itemId: string
): Configuration[] =>
  configs.map((c) => {
    if (c.name !== configName) return c
    return {
      ...c,
      items: c.items.map((i) => {
        const willBeActive = i.id === itemId ? !i.active : false
        if (i.active && !willBeActive) {
          return {
            ...i,
            active: false,
            subConfigurations: undefined,
            subConfigsLoaded: false,
            subConfigsLoading: false
          }
        }
        return { ...i, active: willBeActive }
      })
    }
  })

export const updateConfigsAtPath = (
  configs: Configuration[],
  path: ConfigPath,
  mutate: (configs: Configuration[]) => Configuration[]
): Configuration[] => {
  if (path.length === 0) return mutate(configs)
  const [head, ...rest] = path
  return configs.map((c) => {
    if (c.name !== head.configName) return c
    return {
      ...c,
      items: c.items.map((i) => {
        if (i.id !== head.itemId || !i.subConfigurations) return i
        return {
          ...i,
          subConfigurations: updateConfigsAtPath(i.subConfigurations, rest, mutate)
        }
      })
    }
  })
}

export const sheetReducer = (state: SheetState, action: SheetAction): SheetState => {
  switch (action.type) {
    case 'RESET_PRODUCT':
      return {
        ...state,
        quantity: action.qty,
        initialQuantity: action.qty,
        photoIndex: 0,
        selectedUnit: action.unit,
        confirmClose: false,
        initialConfigIds: new Set(),
        userInteractionTick: 0
      }
    case 'SET_QUANTITY':
      return { ...state, quantity: action.value }
    case 'SET_SAVING':
      return { ...state, saving: action.value }
    case 'SET_CONFIRM_CLOSE':
      return { ...state, confirmClose: action.value }
    case 'SET_PHOTO_INDEX':
      return { ...state, photoIndex: action.value }
    case 'SET_SELECTED_UNIT':
      return { ...state, selectedUnit: action.value }
    case 'SET_CONFIGS':
      return {
        ...state,
        configs: action.configs,
        activeTab: action.activeTab,
        initialConfigIds: action.initialConfigIds,
        userInteractionTick: 0
      }
    case 'CLEAR_CONFIGS':
      return { ...state, configs: [], activeTab: '', userInteractionTick: 0 }
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.value }
    case 'UPDATE_CONFIGS':
      return { ...state, configs: action.updater(state.configs) }
    case 'SELECT_ITEM':
      return {
        ...state,
        userInteractionTick: state.userInteractionTick + 1,
        configs: updateConfigsAtPath(state.configs, action.path, (configs) =>
          toggleItemInConfigs(configs, action.configName, action.itemId)
        )
      }
    case 'DESELECT_ALL_CONFIGS': {
      const clearAll = (configs: Configuration[]): Configuration[] =>
        configs.map((c) => ({
          ...c,
          items: c.items.map<ConfigurationItem>((i) => ({
            ...i,
            active: false,
            subConfigurations: undefined,
            subConfigsLoaded: false,
            subConfigsLoading: false
          }))
        }))
      const cleared = clearAll(state.configs)
      return {
        ...state,
        configs: cleared,
        activeTab: cleared[0]?.name ?? '',
        userInteractionTick: state.userInteractionTick + 1
      }
    }
    default:
      return state
  }
}
