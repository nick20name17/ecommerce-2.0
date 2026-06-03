import * as z from 'zod/mini'

import type { UserSummary } from '../user/schema'

import type { ApiResponse, PaginationParams } from '@/api/schema'
import { TASK_PRIORITY_VALUES, type TaskPriority } from '@/constants/task'
import { VALIDATION_MESSAGES } from '@/constants/validation-messages'

export type { TaskPriority } from '@/constants/task'

export interface TaskStatus {
  id: number
  project: number
  name: string
  is_default: boolean
  color: string
  order: number
  created_at: string
  updated_at: string
}

export interface TaskListItem {
  id: number
  project: number
  title: string
  status: number
  status_name: string
  status_color: string
  priority: TaskPriority
  due_date: string | null
  author: number
  author_name: string
  responsible_user: number | null
  responsible_user_name: string | null
  attachment_count: string
  created_at: string
  updated_at: string
}

export interface TaskAttachment {
  id: number
  task: number
  file_name: string
  file_size: number
  file_size_mb: string
  file_type: string
  uploaded_by: number
  uploaded_by_details: UserSummary
  download_url: string
  created_at: string
}

export interface LinkedOrderSummary {
  autoid: string
  invoice: string
  name: string
  total: string
  status: 'O' | 'X' | 'U'
}

export interface LinkedProposalSummary {
  autoid: string
  quote: string
  b_name: string
  total: string
  status: 'O' | 'A' | 'L' | 'C' | 'E'
}

export interface LinkedCustomerSummary {
  id: string
  l_name: string
  email?: string
  phone?: string
}

export interface TaskNote {
  id: number
  task: number
  text: string
  author: number | null
  author_name: string
  created_at: string
  updated_at: string
}

export interface Task extends TaskListItem {
  description: string | null
  status_details: TaskStatus
  author_details: UserSummary
  responsible_user_details: UserSummary | null
  linked_order_autoid: string | null
  linked_proposal_autoid: string | null
  linked_customer_autoid: string | null
  linked_order_details: LinkedOrderSummary | null
  linked_proposal_details: LinkedProposalSummary | null
  linked_customer_details: LinkedCustomerSummary | null
  attachments: TaskAttachment[]
}

export interface CreateTaskPayload {
  project?: number
  title: string
  description?: string | null
  status: number
  priority: TaskPriority
  due_date?: string | null
  responsible_user?: number | null
  linked_order_autoid?: string | null
  linked_proposal_autoid?: string | null
  linked_customer_autoid?: string | null
}

export type UpdateTaskPayload = Partial<CreateTaskPayload>

export interface CreateTaskStatusPayload {
  project?: number
  name: string
  color: string
  order?: number
}

export type UpdateTaskStatusPayload = Partial<CreateTaskStatusPayload> & {
  is_default?: boolean
}

export type TaskListResponse = ApiResponse<TaskListItem>
export type TaskStatusResponse = ApiResponse<TaskStatus>

export interface TaskParams extends PaginationParams {
  search?: string
  ordering?: string
  status?: string
  priority?: string
  responsible_user?: number
  project_id?: number
  due_date_from?: string
  due_date_to?: string
  linked_customer_autoid?: string
  linked_order_autoid?: string
  linked_proposal_autoid?: string
}

export interface TaskStatusListResponse {
  results: TaskStatus[]
}

const CreateTaskSchema = z.object({
  title: z
    .string()
    .check(z.minLength(1, { error: VALIDATION_MESSAGES.titleRequired }), z.maxLength(200)),
  description: z.optional(z.nullable(z.string().check(z.maxLength(2000)))),
  status: z.number({ error: VALIDATION_MESSAGES.statusRequired }),
  priority: z.enum(TASK_PRIORITY_VALUES),
  due_date: z.optional(z.nullable(z.string())),
  responsible_user: z.optional(z.nullable(z.number())),
  linked_order_autoid: z.optional(z.nullable(z.string())),
  linked_proposal_autoid: z.optional(z.nullable(z.string())),
  linked_customer_autoid: z.optional(z.nullable(z.string()))
})

export type CreateTaskFormValues = z.infer<typeof CreateTaskSchema>

const UpdateTaskSchema = z.extend(z.partial(CreateTaskSchema), {
  title: z.optional(z.string().check(z.minLength(1), z.maxLength(200))),
  description: z.optional(z.nullable(z.string().check(z.maxLength(2000)))),
  status: z.optional(z.number()),
  priority: z.optional(z.enum(TASK_PRIORITY_VALUES)),
  due_date: z.optional(z.nullable(z.string())),
  responsible_user: z.optional(z.nullable(z.number())),
  linked_order_autoid: z.optional(z.nullable(z.string())),
  linked_proposal_autoid: z.optional(z.nullable(z.string())),
  linked_customer_autoid: z.optional(z.nullable(z.string()))
})

export type UpdateTaskFormValues = z.infer<typeof UpdateTaskSchema>
