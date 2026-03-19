<script setup lang="ts">
import type { Priority, Todo } from '@/types/todo'

import { DatePicker, Flex, Input, Modal, Select, Tag } from 'ant-design-vue'
import dayjs from 'dayjs'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { useTodoStore } from '@/stores/todo'

const props = defineProps<{
  open: boolean
  editingTodo: Todo | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const todoStore = useTodoStore()
const { t } = useI18n()

const todoForm = ref({
  title: '',
  description: '',
  priority: 'medium' as Priority,
  dueDate: null as dayjs.Dayjs | null,
  categoryId: null as string | null,
})
const formError = ref('')

const modalTitle = computed(() =>
  props.editingTodo ? t('pages.preference.todo.buttons.editTodo') : t('pages.preference.todo.buttons.addTodo'),
)

watch(() => [props.open, props.editingTodo] as const, ([open, todo]) => {
  if (open) {
    if (todo) {
      todoForm.value = {
        title: todo.title,
        description: todo.description || '',
        priority: todo.priority,
        dueDate: todo.dueDate ? dayjs(todo.dueDate) : null,
        categoryId: todo.categoryId,
      }
    } else {
      todoForm.value = {
        title: '',
        description: '',
        priority: 'medium',
        dueDate: null,
        categoryId: null,
      }
    }
    formError.value = ''
  }
}, { immediate: true })

const priorityOptions = [
  { value: 'high' as const, label: t('pages.preference.todo.options.priorityHigh') },
  { value: 'medium' as const, label: t('pages.preference.todo.options.priorityMedium') },
  { value: 'low' as const, label: t('pages.preference.todo.options.priorityLow') },
]

function handleOk() {
  const title = todoForm.value.title.trim()
  if (!title) {
    formError.value = t('pages.preference.todo.hints.titleRequired')
    return
  }
  const data = {
    title,
    description: todoForm.value.description.trim() || '',
    priority: todoForm.value.priority,
    dueDate: todoForm.value.dueDate ? todoForm.value.dueDate.format('YYYY-MM-DD') : null,
    categoryId: todoForm.value.categoryId,
  }
  if (props.editingTodo) {
    todoStore.updateTodo(props.editingTodo.id, data)
  } else {
    todoStore.addTodo({ ...data, completed: false, sortOrder: 0 })
  }
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :ok-text="$t('pages.preference.todo.buttons.saveTodo')"
    :open="open"
    :title="modalTitle"
    @ok="handleOk"
    @update:open="emit('update:open', $event)"
  >
    <Flex
      gap="middle"
      vertical
    >
      <div>
        <div class="mb-1 text-sm font-medium">
          {{ $t('pages.preference.todo.labels.title') }} *
        </div>
        <Input
          v-model:value="todoForm.title"
          :placeholder="$t('pages.preference.todo.labels.title')"
        />
        <div
          v-if="formError"
          class="mt-1 text-xs text-red-5"
        >
          {{ formError }}
        </div>
      </div>
      <div>
        <div class="mb-1 text-sm font-medium">
          {{ $t('pages.preference.todo.labels.description') }}
        </div>
        <Input.TextArea
          v-model:value="todoForm.description"
          :placeholder="$t('pages.preference.todo.labels.description')"
          :rows="3"
        />
      </div>
      <div>
        <div class="mb-1 text-sm font-medium">
          {{ $t('pages.preference.todo.labels.priority') }}
        </div>
        <Select
          v-model:value="todoForm.priority"
          style="width: 100%"
        >
          <Select.Option
            v-for="opt in priorityOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </Select.Option>
        </Select>
      </div>
      <div>
        <div class="mb-1 text-sm font-medium">
          {{ $t('pages.preference.todo.labels.dueDate') }}
        </div>
        <DatePicker
          v-model:value="todoForm.dueDate"
          style="width: 100%"
        />
      </div>
      <div>
        <div class="mb-1 text-sm font-medium">
          {{ $t('pages.preference.todo.labels.category') }}
        </div>
        <Select
          v-model:value="todoForm.categoryId"
          allow-clear
          :placeholder="$t('pages.preference.todo.labels.noCategory')"
          style="width: 100%"
        >
          <Select.Option
            v-for="cat in todoStore.categories"
            :key="cat.id"
            :value="cat.id"
          >
            <Tag :color="cat.color">
              {{ cat.name }}
            </Tag>
          </Select.Option>
        </Select>
      </div>
    </Flex>
  </Modal>
</template>
