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
  [TASK_PRIORITY.low]: 'var(--priority-low)',
  [TASK_PRIORITY.medium]: 'var(--priority-medium)',
  [TASK_PRIORITY.high]: 'var(--priority-high)',
  [TASK_PRIORITY.urgent]: 'var(--priority-urgent)',
}

export function getTaskPriorityLabel(priority: TaskPriority): string {
  return TASK_PRIORITY_LABELS[priority] ?? priority
}

export function getTaskPriorityColor(priority: TaskPriority): string {
  return TASK_PRIORITY_COLORS[priority] ?? 'var(--priority-low)'
}
