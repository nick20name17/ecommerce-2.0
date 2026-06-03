export interface DashboardFinancialTotal {
  total_sales: number
  last_month_total_sales: number
  outstanding_invoices: number
  average_order_value: number
  last_month_average_order_value: number
}

export interface DashboardFinancialSubTotal {
  total_sales: number
  last_month_total_sales: number
  outstanding_invoices: number
  average_order_value: number
  last_month_average_order_value: number
}

export interface DashboardMetrics {
  sales_total_field: string
  total_order_count: number
  last_month_order_count: number
  unprocessed_orders: number
  pending_invoices: number
  total: DashboardFinancialTotal
  sub_total: DashboardFinancialSubTotal
}

export interface DashboardParams {
  customer_id?: string
  project_id?: number
}
