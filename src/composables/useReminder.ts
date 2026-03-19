import type { Todo } from '@/types/todo'

import dayjs from 'dayjs'
import { onMounted, onUnmounted, ref, shallowRef } from 'vue'

import { useTodoStore } from '@/stores/todo'

export interface ActiveReminder {
  todo: Todo
  type: 'upcoming' | 'due' | 'overdue'
  message: string
  triggeredAt: string
}

const CHECK_INTERVAL_MS = 30 * 1000
const UPCOMING_MINUTES = 30
const DUE_THRESHOLD_MINUTES = 2

async function sendSystemNotification(reminder: ActiveReminder) {
  try {
    const { sendNotification } = await import('@tauri-apps/plugin-notification')
    sendNotification({
      title: reminder.todo.title,
      body: reminder.message,
    })
  } catch {
    // Notification plugin may not be installed or configured
  }
}

export function useReminder() {
  const todoStore = useTodoStore()
  const activeReminders = ref<ActiveReminder[]>([])
  const currentReminder = shallowRef<ActiveReminder | null>(null)
  const remindedIds = new Set<string>()
  let intervalId: ReturnType<typeof setInterval> | null = null

  function getReminderTypeAndMessage(todo: Todo): { type: ActiveReminder['type'], message: string } | null {
    if (!todo.dueDate || todo.completed) return null

    const due = dayjs(todo.dueDate)
    const now = dayjs()
    const diffMinutes = due.diff(now, 'minute')

    if (diffMinutes < -1) {
      const overdueMinutes = Math.abs(diffMinutes)
      if (overdueMinutes < 60) {
        return { type: 'overdue', message: `任务已过期 ${overdueMinutes}分钟` }
      }
      const hours = Math.floor(overdueMinutes / 60)
      const mins = overdueMinutes % 60
      const timeStr = mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
      return { type: 'overdue', message: `任务已过期 ${timeStr}` }
    }

    if (diffMinutes <= DUE_THRESHOLD_MINUTES && diffMinutes >= -1) {
      return { type: 'due', message: '任务即将到期' }
    }

    if (diffMinutes <= UPCOMING_MINUTES && diffMinutes > DUE_THRESHOLD_MINUTES) {
      return { type: 'upcoming', message: `${diffMinutes}分钟后到期` }
    }

    return null
  }

  function checkTodos() {
    const pendingTodos = todoStore.todos.filter(t => !t.completed && t.dueDate)
    const newReminders: ActiveReminder[] = []

    for (const todo of pendingTodos) {
      const result = getReminderTypeAndMessage(todo)
      if (!result) continue
      if (remindedIds.has(todo.id)) continue

      const active: ActiveReminder = {
        todo,
        type: result.type,
        message: result.message,
        triggeredAt: new Date().toISOString(),
      }
      newReminders.push(active)
      remindedIds.add(todo.id)
    }

    if (newReminders.length > 0) {
      for (const reminder of newReminders) {
        activeReminders.value.push(reminder)
      }
      showNextReminder()
      void sendSystemNotification(newReminders[0])
    }
  }

  function showNextReminder() {
    currentReminder.value = activeReminders.value[0] ?? null
  }

  function startReminder() {
    if (intervalId) return
    checkTodos()
    intervalId = setInterval(checkTodos, CHECK_INTERVAL_MS)
  }

  function stopReminder() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    activeReminders.value = []
    currentReminder.value = null
  }

  function dismissReminder(todoId: string) {
    activeReminders.value = activeReminders.value.filter(r => r.todo.id !== todoId)
    remindedIds.delete(todoId)
    showNextReminder()
  }

  function markAsDone(todoId: string) {
    todoStore.completeTodo(todoId)
    dismissReminder(todoId)
  }

  onMounted(() => {
    startReminder()
  })

  onUnmounted(() => {
    stopReminder()
  })

  return {
    currentReminder,
    activeReminders,
    startReminder,
    stopReminder,
    dismissReminder,
    markAsDone,
  }
}
