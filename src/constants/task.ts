export const TASK_PRIORITY = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  urgent: 'urgent',
} as const

export type TaskPriority = (typeof TASK_PRIORITY)[keyof typeof TASK_PRIORITY]

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TASK_PRIORITY.low]: 'Low',
  [TASK_PRIORITY.medium]: 'Medium',
  [TASK_PRIORITY.high]: 'High',
  [TASK_PRIORITY.urgent]: 'Urgent',
}

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  [TASK_PRIORITY.low]: '#6B7280',
  [TASK_PRIORITY.medium]: '#3B82F6',
  [TASK_PRIORITY.high]: '#F59E0B',
  [TASK_PRIORITY.urgent]: '#EF4444',
}

export function getTaskPriorityLabel(priority: TaskPriority): string {
  return TASK_PRIORITY_LABELS[priority] ?? priority
}

export function getTaskPriorityColor(priority: TaskPriority): string {
  return TASK_PRIORITY_COLORS[priority] ?? '#6B7280'
}
