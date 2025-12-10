<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const emit = defineEmits(['questCompleted'])

const quests = ref([
  { id: 1, name: 'Working', icon: '💼', completed: false, xp: 5 },
  { id: 2, name: 'Studying', icon: '📚', completed: false, xp: 5 },
  { id: 3, name: 'Reading', icon: '📖', completed: false, xp: 5 },
  { id: 4, name: 'Working-out', icon: '💪', completed: false, xp: 5 },
  { id: 5, name: 'Learning Korean', icon: '🇰🇷', completed: false, xp: 5 }
])

const completedCount = computed(() => {
  return quests.value.filter(q => q.completed).length
})

const totalXP = computed(() => {
  return completedCount.value * 5
})

const progressPercent = computed(() => {
  return (completedCount.value / quests.value.length) * 100
})

// Load saved state from server
onMounted(async () => {
  try {
    const data = await $fetch('/api/user-data')
    const today = new Date().toDateString()
    
    if (data && data.questsDate === today && data.quests) {
      quests.value.forEach((quest, index) => {
        quest.completed = data.quests[index]?.completed || false
      })
    } else {
      // New day, reset quests
      resetQuests()
    }
  } catch (error) {
    console.error('Failed to load quests:', error)
  }
})

// Save state to server when changed
const saveQuests = async () => {
  try {
    const today = new Date().toDateString()
    // Load current data first to preserve other fields
    const currentData = await $fetch('/api/user-data')
    await $fetch('/api/user-data', {
      method: 'POST',
      body: {
        ...currentData,
        quests: quests.value,
        questsDate: today
      }
    })
  } catch (error) {
    console.error('Failed to save quests:', error)
  }
}

watch(quests, () => {
  saveQuests()
}, { deep: true })

const toggleQuest = (questId) => {
  const quest = quests.value.find(q => q.id === questId)
  if (quest) {
    quest.completed = !quest.completed
    if (quest.completed) {
      emit('questCompleted', quest.xp)
    } else {
      emit('questCompleted', -quest.xp)
    }
  }
}

const resetQuests = () => {
  quests.value.forEach(q => q.completed = false)
  localStorage.setItem('questsDate', new Date().toDateString())
  localStorage.setItem('dailyQuests', JSON.stringify(quests.value))
}
</script>

<template>
  <div class="daily-quests-card">
    <div class="card-header">
      <h3>Daily Quests</h3>
      <div class="quest-summary">
        <span class="completed-count">{{ completedCount }}/{{ quests.length }}</span>
        <span class="xp-earned">+{{ totalXP }} XP</span>
      </div>
    </div>

    <div class="progress-bar-container">
      <div class="progress-bar-bg">
        <div 
          class="progress-bar-fill" 
          :style="{ width: progressPercent + '%' }"
        ></div>
      </div>
    </div>

    <div class="quests-list">
      <div 
        v-for="quest in quests" 
        :key="quest.id" 
        class="quest-item"
        :class="{ completed: quest.completed }"
        @click="toggleQuest(quest.id)"
      >
        <div class="quest-checkbox">
          <input 
            type="checkbox" 
            :checked="quest.completed"
            @change="toggleQuest(quest.id)"
          />
          <span class="checkmark">
            <svg v-if="quest.completed" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </span>
        </div>
        <span class="quest-icon">{{ quest.icon }}</span>
        <span class="quest-name">{{ quest.name }}</span>
        <span class="quest-xp">+{{ quest.xp }} XP</span>
      </div>
    </div>

    <div class="reset-info">
      Resets daily at midnight
    </div>
  </div>
</template>

<style scoped>
.daily-quests-card {
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
  border: 2px solid #1e1e3f;
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.daily-quests-card:hover {
  border-color: #ff00ff;
  box-shadow: 0 0 30px rgba(255, 0, 255, 0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-header h3 {
  font-size: 1.3rem;
  color: #ffffff;
  font-weight: 600;
}

.quest-summary {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.completed-count {
  font-size: 1.1rem;
  font-weight: 700;
  color: #ff00ff;
  text-shadow: 0 0 10px rgba(255, 0, 255, 0.5);
}

.xp-earned {
  font-size: 0.95rem;
  font-weight: 600;
  color: #ffff00;
  text-shadow: 0 0 10px rgba(255, 255, 0, 0.5);
}

.progress-bar-container {
  margin-bottom: 1.5rem;
}

.progress-bar-bg {
  height: 8px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #1e1e3f;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff00ff, #ffff00);
  transition: width 0.5s ease;
  border-radius: 4px;
  box-shadow: 0 0 10px rgba(255, 0, 255, 0.5);
}

.quests-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.quest-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  border: 1px solid #1e1e3f;
  cursor: pointer;
  transition: all 0.3s ease;
}

.quest-item:hover {
  background: rgba(255, 0, 255, 0.1);
  border-color: #ff00ff;
  transform: translateX(5px);
}

.quest-item.completed {
  background: rgba(0, 255, 136, 0.1);
  border-color: #00ff88;
}

.quest-item.completed .quest-name {
  text-decoration: line-through;
  color: #6b6b7f;
}

.quest-checkbox {
  position: relative;
  width: 24px;
  height: 24px;
}

.quest-checkbox input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  height: 24px;
  width: 24px;
  background-color: rgba(0, 0, 0, 0.5);
  border: 2px solid #ff00ff;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.quest-item.completed .checkmark {
  background-color: #00ff88;
  border-color: #00ff88;
  box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
}

.checkmark svg {
  width: 16px;
  height: 16px;
  color: #0a0a0f;
}

.quest-icon {
  font-size: 1.5rem;
  filter: drop-shadow(0 0 5px currentColor);
}

.quest-name {
  flex: 1;
  font-size: 1rem;
  font-weight: 500;
  color: #ffffff;
}

.quest-xp {
  font-size: 0.85rem;
  font-weight: 600;
  color: #ffff00;
  padding: 0.25rem 0.75rem;
  background: rgba(255, 255, 0, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 0, 0.3);
}

.reset-info {
  text-align: center;
  font-size: 0.85rem;
  color: #6b6b7f;
  font-style: italic;
  padding: 0.5rem;
}
</style>
