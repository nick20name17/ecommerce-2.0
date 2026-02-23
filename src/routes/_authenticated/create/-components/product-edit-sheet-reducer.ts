import type { Configuration } from '@/api/product/schema'

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
}

export type SheetAction =
  | { type: 'RESET_PRODUCT'; qty: number; unit: string }
  | { type: 'SET_QUANTITY'; value: number }
  | { type: 'SET_SAVING'; value: boolean }
  | { type: 'SET_CONFIRM_CLOSE'; value: boolean }
  | { type: 'SET_PHOTO_INDEX'; value: number }
  | { type: 'SET_SELECTED_UNIT'; value: string }
  | { type: 'SET_CONFIGS'; configs: Configuration[]; activeTab: string; initialConfigIds: Set<string | number> }
  | { type: 'CLEAR_CONFIGS' }
  | { type: 'SET_ACTIVE_TAB'; value: string }
  | { type: 'UPDATE_CONFIGS'; updater: (prev: Configuration[]) => Configuration[] }
  | { type: 'SELECT_CONFIG_ITEM'; configName: string; itemId: string }

export const initialSheetState: SheetState = {
  quantity: 1,
  initialQuantity: 1,
  saving: false,
  confirmClose: false,
  photoIndex: 0,
  selectedUnit: '',
  configs: [],
  activeTab: '',
  initialConfigIds: new Set()
}

export function sheetReducer(state: SheetState, action: SheetAction): SheetState {
  switch (action.type) {
    case 'RESET_PRODUCT':
      return {
        ...state,
        quantity: action.qty,
        initialQuantity: action.qty,
        photoIndex: 0,
        selectedUnit: action.unit,
        confirmClose: false,
        initialConfigIds: new Set()
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
      return { ...state, configs: action.configs, activeTab: action.activeTab, initialConfigIds: action.initialConfigIds }
    case 'CLEAR_CONFIGS':
      return { ...state, configs: [], activeTab: '' }
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.value }
    case 'UPDATE_CONFIGS':
      return { ...state, configs: action.updater(state.configs) }
    case 'SELECT_CONFIG_ITEM':
      return {
        ...state,
        configs: state.configs.map((c) => {
          if (c.name !== action.configName) return c
          return {
            ...c,
            items: c.items.map((i) => ({
              ...i,
              active: i.id === action.itemId ? !i.active : false
            }))
          }
        })
      }
    default:
      return state
  }
}
