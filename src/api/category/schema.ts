export interface Breadcrumb {
  tree_id: string
  name: string
}

export interface CategoryChild {
  autoid: string
  tree_id: string
  parent_id: string
  tree_descr: string
  show_web: boolean
  tree_path: string
  subcategory_count: number
  product_count: number
  photo: string | null
}

export interface Category {
  autoid: string
  tree_id: string
  parent_id: string
  tree_descr: string
  show_web: boolean
  tree_path: string
  subcategory_count: number
  product_count: number
  photo: string | null
  children: CategoryChild[]
  breadcrumbs: Breadcrumb[]
}

export interface CategoryListResponse {
  results: Category[]
}

export interface CategoryParams {
  parent_id?: string
  project_id?: number
}

