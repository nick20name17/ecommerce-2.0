export type FilterPresetEntityType = 'customer' | 'order' | 'proposal'

export type FilterOp =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'not_contains'
  | 'startswith'
  | 'in'
  | 'is_empty'
  | 'is_not_empty'

export interface FilterConditionLeaf {
  field: string
  op: FilterOp
  value: string | number | boolean | string[]
}

export interface FilterConditionGroup {
  operator: 'and' | 'or'
  conditions: (FilterConditionLeaf | FilterConditionGroup)[]
}

export function isConditionGroup(
  c: FilterConditionLeaf | FilterConditionGroup
): c is FilterConditionGroup {
  return 'operator' in c
}

export interface FilterPreset {
  id: number
  entity_type: FilterPresetEntityType
  name: string
  conditions: FilterConditionGroup
  shared: boolean
  visible_to_roles: string[]
  visible_to_users: number[]
  created_by?: number | null
}

export interface CreateFilterPresetPayload {
  entity_type: FilterPresetEntityType
  name: string
  conditions: FilterConditionGroup
  shared?: boolean
  visible_to_roles?: string[]
  visible_to_users?: number[]
}

export type UpdateFilterPresetPayload = Partial<CreateFilterPresetPayload>

export interface FilterPresetParams {
  entity_type?: FilterPresetEntityType
}
