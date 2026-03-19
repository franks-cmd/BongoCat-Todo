export type Priority = 'low' | 'medium' | 'high'

export interface Todo {
  id: string
  title: string
  description: string
  completed: boolean
  priority: Priority
  dueDate: string | null // ISO 8601
  sortOrder: number
  categoryId: string | null
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  color: string
}

export interface TodoFilters {
  search: string
  category: string | null
  priority: Priority | null
  completed: boolean | null
}

export interface ReminderRecord {
  todoId: string
  remindedAt: string
  type: 'upcoming' | 'due' | 'overdue'
}
