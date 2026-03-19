<script setup lang="ts">
import type { ActiveReminder } from '@/composables/useReminder'

import { Button } from 'ant-design-vue'
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  reminder: ActiveReminder | null
}>()

const emit = defineEmits<{
  dismiss: [todoId: string]
  done: [todoId: string]
}>()

const { t } = useI18n()
const autoHideTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const AUTO_HIDE_MS = 10000

function clearAutoHide() {
  if (autoHideTimer.value) {
    clearTimeout(autoHideTimer.value)
    autoHideTimer.value = null
  }
}

function scheduleAutoHide() {
  clearAutoHide()
  if (!props.reminder) return
  autoHideTimer.value = setTimeout(() => {
    if (props.reminder) emit('dismiss', props.reminder.todo.id)
    autoHideTimer.value = null
  }, AUTO_HIDE_MS)
}

function getPriorityClass(priority: string) {
  switch (priority) {
    case 'high':
      return 'bg-red-500/90 text-white'
    case 'medium':
      return 'bg-orange-500/90 text-white'
    case 'low':
      return 'bg-emerald-500/90 text-white'
    default:
      return 'bg-gray-500/90 text-white'
  }
}

function getPriorityLabel(priority: string) {
  return t(`pages.preference.todo.options.priority${priority.charAt(0).toUpperCase()}${priority.slice(1)}`)
}

watch(() => props.reminder, (val) => {
  if (val) scheduleAutoHide()
  else clearAutoHide()
}, { immediate: true })

onMounted(() => {
  if (props.reminder) scheduleAutoHide()
})

defineExpose({
  clearAutoHide,
})
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-2"
  >
    <div
      v-if="reminder"
      class="absolute left-1/2 top-4 z-50 -translate-x-1/2"
      @mouseenter="clearAutoHide"
      @mouseleave="scheduleAutoHide"
    >
      <div
        class="relative border border-white/20 rounded-2xl bg-white/95 px-4 py-3 shadow-xl backdrop-blur-sm dark:bg-black/85"
        style="filter: drop-shadow(0 4px 12px rgba(0,0,0,0.15))"
      >
        <div
          class="absolute left-1/2 h-3 w-3 rotate-45 border-b border-r border-white/20 bg-white/95 -bottom-2 -translate-x-1/2 dark:bg-black/85"
        />
        <div class="relative flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <span class="text-sm font-bold">
              {{ reminder.todo.title }}
            </span>
            <span
              class="rounded px-1.5 py-0.5 text-xs font-medium"
              :class="getPriorityClass(reminder.todo.priority)"
            >
              {{ getPriorityLabel(reminder.todo.priority) }}
            </span>
          </div>
          <div class="text-xs opacity-60">
            {{ reminder.message }}
          </div>
          <div class="flex gap-2 pt-1">
            <Button
              class="!text-xs"
              size="small"
              type="primary"
              @click="emit('done', reminder.todo.id)"
            >
              {{ $t('components.todoReminder.markDone') }}
            </Button>
            <Button
              class="!text-xs"
              size="small"
              @click="emit('dismiss', reminder.todo.id)"
            >
              {{ $t('components.todoReminder.dismissReminder') }}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
