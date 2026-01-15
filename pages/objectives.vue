<script setup>
import { ref, onMounted } from 'vue'

const defaultObjectives = [
  { 
    id: 1, 
    name: 'TOEIC', 
    icon: '📝', 
    color: '#00ffff',
    target: 'Score 920+',
    notes: '',
    todos: []
  },
  { 
    id: 2, 
    name: 'Secondary Income', 
    icon: '💵', 
    color: '#00ff88',
    target: '$500/month',
    notes: '',
    todos: []
  },
  { 
    id: 3, 
    name: 'Korean Departure', 
    icon: '✈️', 
    color: '#ff00ff',
    target: 'Move to Korea',
    notes: '',
    todos: []
  },
  { 
    id: 4, 
    name: 'Black Boulder', 
    icon: '🧗', 
    color: '#ffff00',
    target: 'Climb V7',
    notes: '',
    todos: []
  },
  { 
    id: 5, 
    name: 'Better Health', 
    icon: '❤️', 
    color: '#ff0055',
    target: '74kg / 12% BF',
    notes: '',
    todos: []
  },
  { 
    id: 6, 
    name: 'Study Gold Territory', 
    icon: '🗺️', 
    color: '#ffa500',
    target: 'Find Gold Location',
    notes: '',
    todos: []
  }
]

const objectives = ref([...defaultObjectives])

const selectedObjective = ref(null)
const newTodoText = ref('')
const isLoading = ref(true)

// Modal states
const showAddModal = ref(false)
const showEditModal = ref(false)
const editingObjective = ref(null)

// Form data for new/edit objective
const objectiveForm = ref({
  name: '',
  icon: '',
  color: '#00ffff',
  target: ''
})

// Popular emoji options
const popularEmojis = ['📝', '💵', '✈️', '🧗', '❤️', '🗺️', '🎯', '💪', '📚', '🎨', '🎮', '🏃', '🎸', '🍕', '🌟', '🚀', '💼', '🏆', '🎓', '🌍']
const popularColors = ['#00ffff', '#00ff88', '#ff00ff', '#ffff00', '#ff0055', '#ffa500', '#00aaff', '#ff6b9d', '#a855f7', '#22c55e']

// Load objectives data
onMounted(async () => {
  try {
    const response = await fetch('/api/user-data')
    const data = await response.json()
    
    if (data.objectives && data.objectives.length > 0) {
      objectives.value = data.objectives
    }
  } catch (error) {
    console.error('Error loading objectives:', error)
  } finally {
    isLoading.value = false
  }
})

// Save objectives to server
const saveObjectives = async () => {
  try {
    const response = await fetch('/api/user-data')
    const currentData = await response.json()
    
    await fetch('/api/user-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...currentData,
        objectives: objectives.value
      })
    })
  } catch (error) {
    console.error('Error saving objectives:', error)
  }
}

// Select an objective to edit
const selectObjective = (objective) => {
  selectedObjective.value = objective
}

// Open add modal
const openAddModal = () => {
  objectiveForm.value = {
    name: '',
    icon: '🎯',
    color: '#00ffff',
    target: ''
  }
  showAddModal.value = true
}

// Open edit modal
const openEditModal = (objective) => {
  editingObjective.value = objective
  objectiveForm.value = {
    name: objective.name,
    icon: objective.icon,
    color: objective.color,
    target: objective.target
  }
  showEditModal.value = true
}

// Create new objective
const createObjective = () => {
  if (!objectiveForm.value.name.trim() || !objectiveForm.value.target.trim()) {
    alert('Please fill in name and target')
    return
  }
  
  const newObjective = {
    id: Date.now(),
    name: objectiveForm.value.name,
    icon: objectiveForm.value.icon || '🎯',
    color: objectiveForm.value.color,
    target: objectiveForm.value.target,
    notes: '',
    todos: []
  }
  
  objectives.value.push(newObjective)
  saveObjectives()
  showAddModal.value = false
}

// Update existing objective
const updateObjective = () => {
  if (!objectiveForm.value.name.trim() || !objectiveForm.value.target.trim()) {
    alert('Please fill in name and target')
    return
  }
  
  editingObjective.value.name = objectiveForm.value.name
  editingObjective.value.icon = objectiveForm.value.icon
  editingObjective.value.color = objectiveForm.value.color
  editingObjective.value.target = objectiveForm.value.target
  
  saveObjectives()
  showEditModal.value = false
  editingObjective.value = null
}

// Delete objective
const deleteObjective = (objective) => {
  if (!confirm(`Are you sure you want to delete "${objective.name}"? This will also delete all its notes and tasks.`)) {
    return
  }
  
  objectives.value = objectives.value.filter(obj => obj.id !== objective.id)
  
  if (selectedObjective.value?.id === objective.id) {
    selectedObjective.value = null
  }
  
  saveObjectives()
}

// Add a new todo item
const addTodo = () => {
  if (!newTodoText.value.trim() || !selectedObjective.value) return
  
  selectedObjective.value.todos.push({
    id: Date.now(),
    text: newTodoText.value,
    completed: false
  })
  
  newTodoText.value = ''
  saveObjectives()
}

// Toggle todo completion
const toggleTodo = (todo) => {
  todo.completed = !todo.completed
  saveObjectives()
}

// Delete a todo
const deleteTodo = (todoId) => {
  if (!selectedObjective.value) return
  
  selectedObjective.value.todos = selectedObjective.value.todos.filter(t => t.id !== todoId)
  saveObjectives()
}

// Update notes
const updateNotes = () => {
  saveObjectives()
}

// Close detail panel
const closeDetail = () => {
  selectedObjective.value = null
}

// Close modals
const closeModals = () => {
  showAddModal.value = false
  showEditModal.value = false
  editingObjective.value = null
}
</script>

<template>
  <div class="objectives-page">
    <header class="page-header">
      <div>
        <h1 class="title">My Objectives</h1>
        <p class="subtitle">Track your goals, add notes, and manage tasks</p>
      </div>
      <div class="header-actions">
        <button @click="openAddModal" class="add-objective-button">
          <span>+</span> New Objective
        </button>
        <NuxtLink to="/" class="back-button">
          <span>←</span> Back
        </NuxtLink>
      </div>
    </header>

    <div class="objectives-layout">
      <!-- Left: Objectives Grid -->
      <div class="objectives-grid">
        <div 
          v-for="objective in objectives" 
          :key="objective.id" 
          class="objective-card"
          :class="{ active: selectedObjective?.id === objective.id }"
          :style="{ borderColor: objective.color }"
        >
          <div class="card-content" @click="selectObjective(objective)">
            <span class="objective-icon" :style="{ color: objective.color }">
              {{ objective.icon }}
            </span>
            <div class="objective-info">
              <h3 class="objective-name" :style="{ color: objective.color }">
                {{ objective.name }}
              </h3>
              <p class="objective-target">{{ objective.target }}</p>
              <div class="objective-stats">
                <span v-if="objective.notes" class="stat">📝 Notes</span>
                <span v-if="objective.todos?.length" class="stat">
                  ✓ {{ objective.todos.filter(t => t.completed).length }}/{{ objective.todos.length }}
                </span>
              </div>
            </div>
          </div>
          <div class="card-actions">
            <button @click.stop="openEditModal(objective)" class="edit-btn" title="Edit objective">✏️</button>
            <button @click.stop="deleteObjective(objective)" class="delete-btn" title="Delete objective">🗑️</button>
          </div>
        </div>
      </div>

      <!-- Right: Detail Panel -->
      <transition name="slide">
        <div v-if="selectedObjective" class="detail-panel">
          <div class="panel-header">
            <div class="header-content">
              <span class="detail-icon" :style="{ color: selectedObjective.color }">
                {{ selectedObjective.icon }}
              </span>
              <div>
                <h2 :style="{ color: selectedObjective.color }">{{ selectedObjective.name }}</h2>
                <p class="detail-target">{{ selectedObjective.target }}</p>
              </div>
            </div>
            <button @click="closeDetail" class="close-button">×</button>
          </div>

          <div class="panel-content">
            <!-- Notes Section -->
            <div class="section">
              <h3 class="section-title">📝 Notes & Research</h3>
              <textarea 
                v-model="selectedObjective.notes"
                @blur="updateNotes"
                placeholder="Write your research, ideas, and progress notes here..."
                class="notes-textarea"
              ></textarea>
            </div>

            <!-- Todo List Section -->
            <div class="section">
              <h3 class="section-title">✓ Action Items</h3>
              
              <div class="add-todo">
                <input 
                  v-model="newTodoText"
                  @keyup.enter="addTodo"
                  placeholder="Add a new task..."
                  class="todo-input"
                />
                <button @click="addTodo" class="add-button" :style="{ background: selectedObjective.color }">
                  Add
                </button>
              </div>

              <div class="todos-list">
                <div 
                  v-for="todo in selectedObjective.todos" 
                  :key="todo.id"
                  class="todo-item"
                  :class="{ completed: todo.completed }"
                >
                  <input 
                    type="checkbox" 
                    :checked="todo.completed"
                    @change="toggleTodo(todo)"
                    class="todo-checkbox"
                  />
                  <span class="todo-text">{{ todo.text }}</span>
                  <button @click="deleteTodo(todo.id)" class="delete-button">🗑️</button>
                </div>

                <div v-if="!selectedObjective.todos?.length" class="empty-state">
                  No tasks yet. Add your first action item above!
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- Add/Edit Modal -->
    <transition name="modal">
      <div v-if="showAddModal || showEditModal" class="modal-overlay" @click="closeModals">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>{{ showAddModal ? '➕ Create New Objective' : '✏️ Edit Objective' }}</h2>
            <button @click="closeModals" class="modal-close">×</button>
          </div>
          
          <div class="modal-body">
            <div class="form-group">
              <label>Objective Name *</label>
              <input 
                v-model="objectiveForm.name" 
                type="text" 
                placeholder="e.g., Learn Spanish"
                class="form-input"
                maxlength="50"
              />
            </div>

            <div class="form-group">
              <label>Target Goal *</label>
              <input 
                v-model="objectiveForm.target" 
                type="text" 
                placeholder="e.g., Conversational fluency"
                class="form-input"
                maxlength="100"
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Icon (Emoji)</label>
                <input 
                  v-model="objectiveForm.icon" 
                  type="text" 
                  placeholder="🎯"
                  class="form-input icon-input"
                  maxlength="2"
                />
                <div class="emoji-picker">
                  <button 
                    v-for="emoji in popularEmojis" 
                    :key="emoji"
                    @click="objectiveForm.icon = emoji"
                    class="emoji-option"
                    :class="{ selected: objectiveForm.icon === emoji }"
                  >
                    {{ emoji }}
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label>Color</label>
                <input 
                  v-model="objectiveForm.color" 
                  type="color" 
                  class="form-input color-input"
                />
                <div class="color-picker">
                  <button 
                    v-for="color in popularColors" 
                    :key="color"
                    @click="objectiveForm.color = color"
                    class="color-option"
                    :class="{ selected: objectiveForm.color === color }"
                    :style="{ background: color }"
                  ></button>
                </div>
              </div>
            </div>

            <div class="form-preview">
              <h4>Preview:</h4>
              <div class="preview-card" :style="{ borderColor: objectiveForm.color }">
                <span class="preview-icon" :style="{ color: objectiveForm.color }">
                  {{ objectiveForm.icon || '🎯' }}
                </span>
                <div>
                  <h5 :style="{ color: objectiveForm.color }">
                    {{ objectiveForm.name || 'Objective Name' }}
                  </h5>
                  <p>{{ objectiveForm.target || 'Target goal' }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button @click="closeModals" class="btn-cancel">Cancel</button>
            <button 
              @click="showAddModal ? createObjective() : updateObjective()" 
              class="btn-save"
              :style="{ background: objectiveForm.color }"
            >
              {{ showAddModal ? '➕ Create' : '💾 Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.objectives-page {
  padding: 2rem;
  min-height: 100vh;
  animation: fadeIn 0.6s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #1e1e3f;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.add-objective-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #00ff88, #00ffff);
  border: none;
  border-radius: 10px;
  color: #0f0f1a;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
}

.add-objective-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 30px rgba(0, 255, 136, 0.5);
}

.add-objective-button span {
  font-size: 1.5rem;
  font-weight: 700;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #00ffff, #ff00ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #8b8b9f;
  font-size: 1.1rem;
  font-weight: 300;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(0, 255, 255, 0.1);
  border: 2px solid #00ffff;
  border-radius: 10px;
  color: #00ffff;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
}

.back-button:hover {
  background: rgba(0, 255, 255, 0.2);
  transform: translateX(-5px);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
}

.objectives-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start;
}

.objectives-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.objective-card {
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
  border: 2px solid #1e1e3f;
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  position: relative;
}

.objective-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 255, 136, 0.2);
}

.objective-card.active {
  border-width: 3px;
}

.card-content {
  display: flex;
  gap: 1rem;
  cursor: pointer;
  margin-bottom: 0.75rem;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  padding-top: 0.75rem;
  border-top: 1px solid #1e1e3f;
}

.edit-btn,
.delete-btn {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #1e1e3f;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.edit-btn:hover {
  background: rgba(0, 255, 255, 0.1);
  border-color: #00ffff;
  transform: scale(1.1);
}

.delete-btn:hover {
  background: rgba(255, 0, 85, 0.1);
  border-color: #ff0055;
  transform: scale(1.1);
}

.objective-icon {
  font-size: 2rem;
  filter: drop-shadow(0 0 10px currentColor);
}

.objective-info {
  flex: 1;
}

.objective-name {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  text-shadow: 0 0 10px currentColor;
}

.objective-target {
  font-size: 0.9rem;
  color: #8b8b9f;
  margin-bottom: 0.75rem;
}

.objective-stats {
  display: flex;
  gap: 0.75rem;
  font-size: 0.8rem;
  color: #00ff88;
}

.stat {
  background: rgba(0, 255, 136, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

.detail-panel {
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
  border: 2px solid #1e1e3f;
  border-radius: 16px;
  padding: 2rem;
  position: sticky;
  top: 2rem;
  max-height: calc(100vh - 4rem);
  overflow-y: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #1e1e3f;
}

.header-content {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.detail-icon {
  font-size: 3rem;
  filter: drop-shadow(0 0 15px currentColor);
}

.detail-panel h2 {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  text-shadow: 0 0 15px currentColor;
}

.detail-target {
  color: #8b8b9f;
  font-size: 1rem;
}

.close-button {
  background: rgba(255, 0, 85, 0.1);
  border: 2px solid #ff0055;
  color: #ff0055;
  font-size: 2rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.close-button:hover {
  background: rgba(255, 0, 85, 0.2);
  transform: rotate(90deg);
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-title {
  font-size: 1.2rem;
  color: #ffffff;
  font-weight: 600;
}

.notes-textarea {
  width: 100%;
  min-height: 150px;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid #1e1e3f;
  border-radius: 10px;
  color: #ffffff;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
  transition: all 0.3s ease;
}

.notes-textarea:focus {
  outline: none;
  border-color: #00ff88;
  box-shadow: 0 0 15px rgba(0, 255, 136, 0.2);
}

.notes-textarea::placeholder {
  color: #5a5a6f;
}

.add-todo {
  display: flex;
  gap: 0.75rem;
}

.todo-input {
  flex: 1;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid #1e1e3f;
  border-radius: 10px;
  color: #ffffff;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.todo-input:focus {
  outline: none;
  border-color: #00ff88;
  box-shadow: 0 0 15px rgba(0, 255, 136, 0.2);
}

.add-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 10px;
  color: #0f0f1a;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(0, 255, 136, 0.3);
}

.todos-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid #1e1e3f;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.todo-item:hover {
  background: rgba(0, 255, 136, 0.05);
  border-color: #00ff88;
}

.todo-item.completed {
  opacity: 0.6;
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
}

.todo-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #00ff88;
}

.todo-text {
  flex: 1;
  color: #ffffff;
  font-size: 0.95rem;
}

.delete-button {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  opacity: 0.5;
  transition: all 0.3s ease;
}

.delete-button:hover {
  opacity: 1;
  transform: scale(1.2);
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #5a5a6f;
  font-style: italic;
}

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* Responsive */
@media (max-width: 1200px) {
  .objectives-layout {
    grid-template-columns: 1fr;
  }
  
  .detail-panel {
    position: relative;
    top: 0;
    max-height: none;
  }
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
  border: 2px solid #1e1e3f;
  border-radius: 20px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 255, 136, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  border-bottom: 2px solid #1e1e3f;
}

.modal-header h2 {
  font-size: 1.5rem;
  color: #00ff88;
  margin: 0;
}

.modal-close {
  background: rgba(255, 0, 85, 0.1);
  border: 2px solid #ff0055;
  color: #ff0055;
  font-size: 2rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.modal-close:hover {
  background: rgba(255, 0, 85, 0.2);
  transform: rotate(90deg);
}

.modal-body {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  color: #00ff88;
  font-weight: 600;
  font-size: 0.95rem;
}

.form-input {
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid #1e1e3f;
  border-radius: 10px;
  color: #ffffff;
  font-size: 1rem;
  transition: all 0.3s ease;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #00ff88;
  box-shadow: 0 0 15px rgba(0, 255, 136, 0.2);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.icon-input {
  text-align: center;
  font-size: 1.5rem;
}

.color-input {
  height: 50px;
  cursor: pointer;
}

.emoji-picker {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.emoji-option {
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid #1e1e3f;
  border-radius: 8px;
  padding: 0.5rem;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.emoji-option:hover,
.emoji-option.selected {
  border-color: #00ff88;
  background: rgba(0, 255, 136, 0.1);
  transform: scale(1.1);
}

.color-picker {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.color-option {
  width: 100%;
  height: 40px;
  border: 2px solid #1e1e3f;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.color-option:hover,
.color-option.selected {
  border-color: #ffffff;
  transform: scale(1.1);
  box-shadow: 0 0 15px currentColor;
}

.form-preview {
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid #1e1e3f;
  border-radius: 12px;
}

.form-preview h4 {
  color: #8b8b9f;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.preview-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid;
  border-radius: 12px;
}

.preview-icon {
  font-size: 2rem;
  filter: drop-shadow(0 0 10px currentColor);
}

.preview-card h5 {
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
  text-shadow: 0 0 10px currentColor;
}

.preview-card p {
  color: #8b8b9f;
  font-size: 0.9rem;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-top: 2px solid #1e1e3f;
  justify-content: flex-end;
}

.btn-cancel,
.btn-save {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel {
  background: rgba(255, 0, 85, 0.1);
  border: 2px solid #ff0055;
  color: #ff0055;
}

.btn-cancel:hover {
  background: rgba(255, 0, 85, 0.2);
  transform: translateY(-2px);
}

.btn-save {
  color: #0f0f1a;
  font-weight: 700;
}

.btn-save:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(0, 255, 136, 0.4);
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9) translateY(-20px);
}

</style>
