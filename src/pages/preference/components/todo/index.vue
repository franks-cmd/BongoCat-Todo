<script setup lang="ts">
import type { Priority, Todo } from '@/types/todo'

import { Button, Checkbox, Empty, Flex, Input, Popconfirm, Select, Switch, Tag } from 'ant-design-vue'
import dayjs from 'dayjs'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import TodoModal from './components/todo-modal.vue'

import ProList from '@/components/pro-list/index.vue'
import ProListItem from '@/components/pro-list-item/index.vue'
import { useTodoStore } from '@/stores/todo'

const todoStore = useTodoStore()
const { t } = useI18n()

// Category form
const showCategoryForm = ref(false)
const newCategoryName = ref('')
const newCategoryColor = ref('#1890ff')
const categoryFormError = ref('')

function openCategoryForm() {
  showCategoryForm.value = true
  newCategoryName.value = ''
  newCategoryColor.value = '#1890ff'
  categoryFormError.value = ''
}

function saveCategory() {
  const name = newCategoryName.value.trim()
  if (!name) {
    categoryFormError.value = t('pages.preference.todo.hints.categoryNameRequired')
    return
  }
  todoStore.addCategory({ name, color: newCategoryColor.value })
  showCategoryForm.value = false
}

// Todo modal
const todoModalOpen = ref(false)
const editingTodo = ref<Todo | null>(null)

function openAddTodoModal() {
  editingTodo.value = null
  todoModalOpen.value = true
}

function openEditTodoModal(todo: Todo) {
  editingTodo.value = todo
  todoModalOpen.value = true
}

// Helpers
const priorityColors: Record<Priority, string> = {
  high: 'red',
  medium: 'orange',
  low: 'green',
}

function getCategoryById(id: string | null) {
  if (!id) return null
  return todoStore.categories.find(c => c.id === id)
}

function isOverdue(dueDate: string | null) {
  if (!dueDate) return false
  return dayjs(dueDate).isBefore(dayjs(), 'day')
}

const statusOptions = [
  { value: null, label: t('pages.preference.todo.options.statusAll') },
  { value: false, label: t('pages.preference.todo.options.statusIncomplete') },
  { value: true, label: t('pages.preference.todo.options.statusCompleted') },
]

const priorityOptions = [
  { value: 'high', label: t('pages.preference.todo.options.priorityHigh') },
  { value: 'medium', label: t('pages.preference.todo.options.priorityMedium') },
  { value: 'low', label: t('pages.preference.todo.options.priorityLow') },
]
</script>

<template>
  <ProList :title="$t('pages.preference.todo.labels.reminderSettings')">
    <ProListItem :title="$t('pages.preference.todo.labels.enableReminders')">
      <Switch v-model:checked="todoStore.reminderSettings.enabled" />
    </ProListItem>
  </ProList>

  <ProList :title="$t('pages.preference.todo.labels.categoryManagement')">
    <Flex
      align="center"
      flex-wrap="wrap"
      gap="small"
    >
      <Tag
        v-for="cat in todoStore.categories"
        :key="cat.id"
        :color="cat.color"
      >
        {{ cat.name }}
        <Popconfirm
          :description="$t('pages.preference.todo.hints.deleteCategory')"
          placement="topRight"
          :title="$t('pages.preference.todo.labels.deleteCategory')"
          @confirm="todoStore.deleteCategory(cat.id)"
        >
          <i class="i-iconamoon:trash-simple-bold ml-1 cursor-pointer text-4" />
        </Popconfirm>
      </Tag>
      <template v-if="showCategoryForm">
        <Flex
          align="center"
          gap="small"
        >
          <Input
            v-model:value="newCategoryName"
            :placeholder="$t('pages.preference.todo.labels.categoryName')"
            size="small"
            style="width: 120px"
          />
          <input
            v-model="newCategoryColor"
            class="h-8 w-8 cursor-pointer b-1 b-color-2 rounded b-solid"
            type="color"
          >
          <Button
            size="small"
            type="primary"
            @click="saveCategory"
          >
            {{ $t('pages.preference.todo.buttons.saveCategory') }}
          </Button>
          <Button
            size="small"
            @click="showCategoryForm = false"
          >
            {{ $t('pages.preference.todo.buttons.cancel') }}
          </Button>
        </Flex>
      </template>
      <Button
        v-else
        size="small"
        @click="openCategoryForm"
      >
        {{ $t('pages.preference.todo.buttons.addCategory') }}
      </Button>
    </Flex>
  </ProList>

  <ProList :title="$t('pages.preference.todo.labels.todoList')">
    <Flex
      gap="middle"
      vertical
    >
      <Flex
        gap="small"
        wrap
      >
        <Input
          v-model:value="todoStore.filters.search"
          allow-clear
          :placeholder="$t('pages.preference.todo.labels.searchPlaceholder')"
          style="width: 180px"
        />
        <Select
          v-model:value="todoStore.filters.priority"
          allow-clear
          :placeholder="$t('pages.preference.todo.labels.priority')"
          style="width: 100px"
        >
          <Select.Option
            v-for="opt in priorityOptions"
            :key="String(opt.value)"
            :value="opt.value"
          >
            {{ opt.label }}
          </Select.Option>
        </Select>
        <Select
          v-model:value="todoStore.filters.completed"
          :placeholder="$t('pages.preference.todo.labels.status')"
          style="width: 110px"
        >
          <Select.Option
            v-for="opt in statusOptions"
            :key="String(opt.value)"
            :value="opt.value"
          >
            {{ opt.label }}
          </Select.Option>
        </Select>
        <Select
          v-model:value="todoStore.filters.category"
          allow-clear
          :placeholder="$t('pages.preference.todo.labels.category')"
          style="width: 120px"
        >
          <Select.Option
            v-for="cat in todoStore.categories"
            :key="cat.id"
            :value="cat.id"
          >
            {{ cat.name }}
          </Select.Option>
        </Select>
        <Button
          type="primary"
          @click="openAddTodoModal"
        >
          {{ $t('pages.preference.todo.buttons.addTodo') }}
        </Button>
      </Flex>

      <div
        v-if="todoStore.filteredTodos.length === 0"
        class="py-8"
      >
        <Empty :description="$t('pages.preference.todo.hints.emptyTodo')" />
      </div>

      <Flex
        v-else
        gap="small"
        vertical
      >
        <div
          v-for="todo in todoStore.filteredTodos"
          :key="todo.id"
          class="flex items-center gap-3 b b-color-2 rounded-lg b-solid bg-color-3 p-3"
        >
          <Checkbox
            :checked="todo.completed"
            @update:checked="() => todoStore.updateTodo(todo.id, { completed: !todo.completed })"
          />
          <div class="min-w-0 flex-1">
            <span
              class="font-medium"
              :class="{ 'line-through text-color-3': todo.completed }"
            >
              {{ todo.title }}
            </span>
            <Flex
              class="mt-1"
              gap="small"
              wrap
            >
              <Tag :color="priorityColors[todo.priority]">
                {{ priorityOptions.find(o => o.value === todo.priority)?.label }}
              </Tag>
              <span
                v-if="todo.dueDate"
                class="text-xs"
                :class="isOverdue(todo.dueDate) ? 'text-red-5' : 'text-color-3'"
              >
                {{ dayjs(todo.dueDate).format('YYYY-MM-DD') }}
              </span>
              <Tag
                v-if="getCategoryById(todo.categoryId)"
                :color="getCategoryById(todo.categoryId)!.color"
              >
                {{ getCategoryById(todo.categoryId)!.name }}
              </Tag>
            </Flex>
          </div>
          <Flex gap="small">
            <Button
              size="small"
              @click="openEditTodoModal(todo)"
            >
              {{ $t('pages.preference.todo.labels.editTodo') }}
            </Button>
            <Popconfirm
              :description="$t('pages.preference.todo.hints.deleteTodo')"
              placement="topRight"
              :title="$t('pages.preference.todo.labels.deleteTodo')"
              @confirm="todoStore.deleteTodo(todo.id)"
            >
              <Button
                danger
                size="small"
              >
                {{ $t('pages.preference.todo.labels.deleteTodo') }}
              </Button>
            </Popconfirm>
          </Flex>
        </div>
      </Flex>
    </Flex>
  </ProList>

  <TodoModal
    v-model:open="todoModalOpen"
    :editing-todo="editingTodo"
  />
</template>
