<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

interface Task {
  id: number
  text: string
  completed: boolean
  url?: string
}

const tasks = ref<Task[]>([])
const newTaskText = ref('')
const newTaskUrl = ref('')
const showAddForm = ref(false)

// Load saved state from server
onMounted(async () => {
  try {
    const data = await $fetch('/api/user-data')
    const today = new Date().toDateString()
    
    if (data && data.englishTasksDate === today && data.englishTasks) {
      tasks.value = data.englishTasks
    } else {
      // New day, reset tasks
      resetTasks()
    }
  } catch (error) {
    console.error('Failed to load English tasks:', error)
  }
})

// Save state to server when changed
const saveTasks = async () => {
  try {
    const today = new Date().toDateString()
    const currentData = await $fetch('/api/user-data')
    await $fetch('/api/user-data', {
      method: 'POST',
      body: {
        ...currentData,
        englishTasks: tasks.value,
        englishTasksDate: today
      }
    })
  } catch (error) {
    console.error('Failed to save English tasks:', error)
  }
}

watch(tasks, () => {
  saveTasks()
}, { deep: true })

const addTask = () => {
  if (newTaskText.value.trim()) {
    tasks.value.push({
      id: Date.now(),
      text: newTaskText.value.trim(),
      completed: false,
      url: newTaskUrl.value.trim() || undefined
    })
    newTaskText.value = ''
    newTaskUrl.value = ''
    showAddForm.value = false
  }
}

const toggleTask = (taskId: number) => {
  const task = tasks.value.find(t => t.id === taskId)
  if (task) {
    task.completed = !task.completed
  }
}

const deleteTask = (taskId: number) => {
  tasks.value = tasks.value.filter(t => t.id !== taskId)
}

const resetTasks = () => {
  tasks.value = []
}

const completedCount = computed(() => {
  return tasks.value.filter(t => t.completed).length
})

const progressPercent = computed(() => {
  if (tasks.value.length === 0) return 0
  return (completedCount.value / tasks.value.length) * 100
})
</script>

<template>
  <div class="learning-page">
    <header class="page-header">
      <h1 class="title">🇬🇧 Learning English</h1>
      <p class="subtitle">Track your daily English learning tasks</p>
    </header>

    <div class="content-wrapper">
      <div class="stats-bar">
        <div class="stat">
          <span class="stat-label">Tasks Completed</span>
          <span class="stat-value">{{ completedCount }}/{{ tasks.length }}</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar-bg">
            <div 
              class="progress-bar-fill" 
              :style="{ width: progressPercent + '%' }"
            ></div>
          </div>
        </div>
      </div>

      <div class="tasks-section">
        <div class="section-header">
          <h2>Today's Tasks</h2>
          <button @click="showAddForm = !showAddForm" class="add-btn">
            <span>{{ showAddForm ? '✕' : '+' }}</span> {{ showAddForm ? 'Cancel' : 'Add Task' }}
          </button>
        </div>

        <transition name="slide-fade">
          <div v-if="showAddForm" class="add-task-form">
            <div class="form-group">
              <input 
                v-model="newTaskText" 
                type="text" 
                placeholder="Task description..."
                class="task-input"
                @keyup.enter="addTask"
              />
            </div>
            <div class="form-group">
              <input 
                v-model="newTaskUrl" 
                type="url" 
                placeholder="Optional link (http://...)"
                class="task-input"
              />
            </div>
            <button @click="addTask" class="submit-btn">Add Task</button>
          </div>
        </transition>

        <div v-if="tasks.length === 0" class="empty-state">
          <p>No tasks yet. Add your first English learning task!</p>
        </div>

        <div v-else class="tasks-list">
          <transition-group name="task-list">
            <div 
              v-for="task in tasks" 
              :key="task.id" 
              class="task-item"
              :class="{ completed: task.completed }"
            >
              <div class="task-checkbox" @click="toggleTask(task.id)">
                <input 
                  type="checkbox" 
                  :checked="task.completed"
                />
                <span class="checkmark">
                  <svg v-if="task.completed" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </span>
              </div>
              <div class="task-content">
                <span class="task-text">{{ task.text }}</span>
                <a 
                  v-if="task.url" 
                  :href="task.url" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="task-link"
                  @click.stop
                >
                  🔗 Open Link
                </a>
              </div>
              <button @click="deleteTask(task.id)" class="delete-btn">🗑️</button>
            </div>
          </transition-group>
        </div>

        <div class="reset-info">
          ⏰ Tasks reset daily at midnight
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.learning-page {
  animation: fadeIn 0.6s ease;
  min-height: 100vh;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-header {
  margin-bottom: 2rem;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #888;
  font-size: 1.1rem;
}

.content-wrapper {
  max-width: 900px;
}

.stats-bar {
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
  border: 2px solid #1e1e3f;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.stat-label {
  color: #888;
  font-size: 0.95rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #4ecdc4;
  text-shadow: 0 0 10px rgba(78, 205, 196, 0.5);
}

.progress-bar-container {
  margin-top: 1rem;
}

.progress-bar-bg {
  height: 10px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 5px;
  overflow: hidden;
  border: 1px solid #1e1e3f;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b6b, #4ecdc4);
  transition: width 0.5s ease;
  box-shadow: 0 0 15px rgba(78, 205, 196, 0.6);
}

.tasks-section {
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
  border: 2px solid #1e1e3f;
  border-radius: 12px;
  padding: 2rem;
  transition: all 0.3s ease;
}

.tasks-section:hover {
  border-color: #4ecdc4;
  box-shadow: 0 0 30px rgba(78, 205, 196, 0.2);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  font-size: 1.5rem;
  color: #ffffff;
}

.add-btn {
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%);
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(78, 205, 196, 0.3);
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(78, 205, 196, 0.5);
}

.add-task-form {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #1e1e3f;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.task-input {
  width: 100%;
  padding: 0.8rem;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid #1e1e3f;
  border-radius: 6px;
  color: #ffffff;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.task-input:focus {
  outline: none;
  border-color: #4ecdc4;
  box-shadow: 0 0 10px rgba(78, 205, 196, 0.3);
}

.submit-btn {
  padding: 0.6rem 1.5rem;
  background: linear-gradient(135deg, #66bb6a 0%, #4ecdc4 100%);
  border: none;
  border-radius: 6px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(78, 205, 196, 0.5);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
  font-size: 1.1rem;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #1e1e3f;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.task-item:hover {
  border-color: #4ecdc4;
  box-shadow: 0 0 15px rgba(78, 205, 196, 0.2);
}

.task-item.completed {
  opacity: 0.6;
}

.task-item.completed .task-text {
  text-decoration: line-through;
  color: #666;
}

.task-checkbox {
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
}

.task-checkbox input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.checkmark {
  display: block;
  width: 24px;
  height: 24px;
  border: 2px solid #4ecdc4;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;
}

.task-checkbox:hover .checkmark {
  border-color: #ff6b6b;
  box-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
}

.checkmark svg {
  width: 20px;
  height: 20px;
  color: #66bb6a;
}

.task-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.task-text {
  color: #ffffff;
  font-size: 1rem;
}

.task-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: #4ecdc4;
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.task-link:hover {
  color: #ff6b6b;
  text-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
}

.delete-btn {
  padding: 0.5rem;
  background: transparent;
  border: 1px solid #ff0000;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.delete-btn:hover {
  background: #ff0000;
  box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
}

.reset-info {
  margin-top: 1.5rem;
  text-align: center;
  color: #666;
  font-size: 0.9rem;
}

/* Transitions */
.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from {
  transform: translateY(-10px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

.task-list-enter-active, .task-list-leave-active {
  transition: all 0.4s ease;
}

.task-list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.task-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.task-list-move {
  transition: transform 0.4s ease;
}
</style>
