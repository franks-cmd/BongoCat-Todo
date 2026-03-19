import type { Category, Priority, ReminderRecord, Todo, TodoFilters } from '@/types/todo'

import dayjs from 'dayjs'
import { filter, find, sortBy } from 'es-toolkit/compat'
import { nanoid } from 'nanoid'
import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'

export interface ReminderIntervals {
  upcoming: number[]
  overdue: number
}

export interface ReminderSettings {
  enabled: boolean
  intervals: Record<Priority, ReminderIntervals>
}

const DEFAULT_REMINDER_INTERVALS: Record<Priority, ReminderIntervals> = {
  high: { upcoming: [60, 30], overdue: 30 },
  medium: { upcoming: [30], overdue: 60 },
  low: { upcoming: [], overdue: 120 },
}

export const useTodoStore = defineStore('todo', () => {
  const todos = ref<Todo[]>([])
  const categories = ref<Category[]>([])
  const filters = reactive<TodoFilters>({
    search: '',
    category: null,
    priority: null,
    completed: null,
  })
  const reminderSettings = reactive<ReminderSettings>({
    enabled: true,
    intervals: { ...DEFAULT_REMINDER_INTERVALS },
  })
  const reminderRecords = ref<ReminderRecord[]>([])

  const addTodo = (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = dayjs().toISOString()
    const maxOrder = todos.value.length > 0
      ? Math.max(...todos.value.map(t => t.sortOrder))
      : -1
    const newTodo: Todo = {
      ...todo,
      id: nanoid(),
      createdAt: now,
      updatedAt: now,
      sortOrder: maxOrder + 1,
    }
    todos.value = [...todos.value, newTodo]
    return newTodo
  }

  const updateTodo = (id: string, updates: Partial<Omit<Todo, 'id'>>) => {
    const index = todos.value.findIndex(t => t.id === id)
    if (index === -1) return
    const updated: Todo = {
      ...todos.value[index],
      ...updates,
      updatedAt: dayjs().toISOString(),
    }
    todos.value = [...todos.value]
    todos.value[index] = updated
    return updated
  }

  const deleteTodo = (id: string) => {
    todos.value = filter(todos.value, t => t.id !== id)
    reminderRecords.value = filter(reminderRecords.value, r => r.todoId !== id)
  }

  const completeTodo = (id: string) => updateTodo(id, { completed: true })

  const getTodo = (id: string) => find(todos.value, { id })

  const reorderTodos = (id: string, newIndex: number) => {
    const list = [...todos.value]
    const oldIndex = list.findIndex(t => t.id === id)
    if (oldIndex === -1) return
    const [item] = list.splice(oldIndex, 1)
    list.splice(newIndex, 0, item!)
    todos.value = list.map((t, i) => ({ ...t, sortOrder: i, updatedAt: dayjs().toISOString() }))
  }

  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...category,
      id: nanoid(),
    }
    categories.value = [...categories.value, newCategory]
    return newCategory
  }

  const updateCategory = (id: string, updates: Partial<Omit<Category, 'id'>>) => {
    const index = categories.value.findIndex(c => c.id === id)
    if (index === -1) return
    categories.value = [...categories.value]
    categories.value[index] = { ...categories.value[index], ...updates }
    return categories.value[index]
  }

  const deleteCategory = (id: string) => {
    categories.value = filter(categories.value, c => c.id !== id)
    todos.value = todos.value.map(t =>
      t.categoryId === id ? { ...t, categoryId: null } : t,
    )
  }

  const getCategory = (id: string) => find(categories.value, { id })

  const addReminderRecord = (todoId: string, type: ReminderRecord['type'], slotMinutes?: number) => {
    const record: ReminderRecord & { _slot?: number } = {
      todoId,
      remindedAt: dayjs().toISOString(),
      type,
    }
    if (slotMinutes !== undefined) (record as ReminderRecord & { _slot: number })._slot = slotMinutes
    reminderRecords.value = [...reminderRecords.value, record]
  }

  const getLastReminderForSlot = (todoId: string, type: ReminderRecord['type'], slotMinutes?: number) => {
    const records = reminderRecords.value.filter(r => r.todoId === todoId && r.type === type)
    const rec = records as (ReminderRecord & { _slot?: number })[]
    const withSlot = slotMinutes !== undefined
      ? rec.filter(r => r._slot === slotMinutes)
      : rec
    if (withSlot.length === 0) return null
    return withSlot.reduce((latest, r) =>
      dayjs(r.remindedAt).isAfter(dayjs(latest.remindedAt)) ? r : latest,
    ).remindedAt
  }

  const filteredTodos = computed(() => {
    let result = [...todos.value]
    if (filters.search) {
      const s = filters.search.toLowerCase()
      result = filter(result, t =>
        t.title.toLowerCase().includes(s) || t.description.toLowerCase().includes(s))
    }
    if (filters.category != null)
      result = filter(result, t => t.categoryId === filters.category)
    if (filters.priority != null)
      result = filter(result, t => t.priority === filters.priority)
    if (filters.completed != null)
      result = filter(result, t => t.completed === filters.completed)
    return sortBy(result, 'sortOrder')
  })

  const overdueTodos = computed(() => {
    const now = dayjs()
    return filter(todos.value, t =>
      !t.completed && t.dueDate != null && dayjs(t.dueDate).isBefore(now))
  })

  const upcomingTodos = computed(() => {
    const now = dayjs()
    return filter(todos.value, t =>
      !t.completed && t.dueDate != null && dayjs(t.dueDate).isAfter(now))
  })

  const todosNeedingReminder = computed(() => {
    if (!reminderSettings.enabled) return []
    const now = dayjs()
    const needing: { todo: Todo, type: ReminderRecord['type'], slotMinutes?: number }[] = []

    for (const todo of todos.value) {
      if (todo.completed || todo.dueDate == null) continue
      const due = dayjs(todo.dueDate)
      const intervals = reminderSettings.intervals[todo.priority]
      const minsUntilDue = due.diff(now, 'minute')

      if (minsUntilDue > 0) {
        for (const slot of intervals.upcoming) {
          if (minsUntilDue <= slot) {
            const lastReminded = getLastReminderForSlot(todo.id, 'upcoming', slot)
            if (!lastReminded)
              needing.push({ todo, type: 'upcoming', slotMinutes: slot })
          }
        }
      } else {
        const lastDueReminded = getLastReminderForSlot(todo.id, 'due')
        if (!lastDueReminded) {
          needing.push({ todo, type: 'due' })
        } else {
          const interval = intervals.overdue
          const lastOverdueReminded = getLastReminderForSlot(todo.id, 'overdue', interval)
          const minsSinceReminder = lastOverdueReminded
            ? now.diff(dayjs(lastOverdueReminded), 'minute')
            : now.diff(due, 'minute')
          if (!lastOverdueReminded || minsSinceReminder >= interval)
            needing.push({ todo, type: 'overdue', slotMinutes: interval })
        }
      }
    }
    return needing
  })

  return {
    todos,
    categories,
    filters,
    reminderSettings,
    reminderRecords,
    addTodo,
    updateTodo,
    deleteTodo,
    completeTodo,
    getTodo,
    reorderTodos,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategory,
    addReminderRecord,
    filteredTodos,
    overdueTodos,
    upcomingTodos,
    todosNeedingReminder,
  }
}, {
  tauri: {
    filterKeys: ['todos', 'categories', 'filters', 'reminderSettings', 'reminderRecords'],
    filterKeysStrategy: 'pick',
  },
})
