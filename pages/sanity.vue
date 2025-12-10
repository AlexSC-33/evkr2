<script setup>
import { ref, computed, onMounted, watch } from 'vue'

definePageMeta({
  middleware: 'auth'
})

const counters = ref({
  alcohol: {
    name: 'Alcohol Free',
    icon: '🚫🍺',
    days: 0,
    color: '#00ffff',
    milestone: 7,
    lastReset: null,
    unit: 'days'
  },
  addiction: {
    name: 'Clean Streak',
    icon: '🧠',
    days: 0,
    color: '#ff00ff',
    milestone: 3,
    lastReset: null,
    unit: 'days'
  },
  sports: {
    name: 'Sports Sessions',
    icon: '💪',
    days: 0,
    color: '#00ff88',
    milestone: 10,
    lastReset: null,
    unit: 'sessions'
  }
})

// Calculate progress percentage for each counter
const getProgress = (counter) => {
  return Math.min(100, (counter.days / counter.milestone) * 100)
}

// Get milestone level
const getMilestoneLevel = (days, milestone) => {
  return Math.floor(days / milestone)
}

// Load saved data
onMounted(() => {
  const saved = localStorage.getItem('sanityCounters')
  if (saved) {
    const savedData = JSON.parse(saved)
    Object.keys(counters.value).forEach(key => {
      if (savedData[key]) {
        counters.value[key].days = savedData[key].days || 0
        counters.value[key].lastReset = savedData[key].lastReset || null
      }
    })
  }
})

// Save data when changed
watch(counters, () => {
  localStorage.setItem('sanityCounters', JSON.stringify(counters.value))
}, { deep: true })

// Increment counter
const incrementDay = (counterKey) => {
  counters.value[counterKey].days++
  counters.value[counterKey].lastReset = new Date().toISOString()
}

// Decrement counter
const decrementDay = (counterKey) => {
  if (counters.value[counterKey].days > 0) {
    counters.value[counterKey].days--
  }
}

// Reset counter
const resetCounter = (counterKey) => {
  if (confirm(`Reset ${counters.value[counterKey].name} counter?`)) {
    counters.value[counterKey].days = 0
    counters.value[counterKey].lastReset = new Date().toISOString()
  }
}

// Format last reset date
const formatLastUpdate = (lastReset) => {
  if (!lastReset) return 'Never updated'
  const date = new Date(lastReset)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}
</script>

<template>
  <div class="sanity-page">
    <header class="page-header">
      <h1 class="page-title">Sanity Tracker</h1>
      <p class="page-subtitle">Track your journey to better habits</p>
    </header>

    <div class="counters-grid">
      <!-- Alcohol Counter -->
      <div class="counter-card" :style="{ '--card-color': counters.alcohol.color }">
        <div class="card-header">
          <span class="card-icon">{{ counters.alcohol.icon }}</span>
          <div class="card-info">
            <h2 class="card-title">{{ counters.alcohol.name }}</h2>
            <p class="last-update">{{ formatLastUpdate(counters.alcohol.lastReset) }}</p>
          </div>
        </div>

        <div class="counter-display">
          <div class="day-count">
            <span class="number">{{ counters.alcohol.days }}</span>
            <span class="label">{{ counters.alcohol.days === 1 ? 'Day' : 'Days' }}</span>
          </div>
          <div class="milestone-info">
            <span class="milestone-level">Level {{ getMilestoneLevel(counters.alcohol.days, counters.alcohol.milestone) }}</span>
          </div>
        </div>

        <div class="progress-section">
          <div class="progress-bar-container">
            <div class="progress-bar-bg">
              <div 
                class="progress-bar-fill" 
                :style="{ width: getProgress(counters.alcohol) + '%' }"
              >
                <div class="progress-glow"></div>
              </div>
            </div>
          </div>
          <div class="progress-labels">
            <span>{{ counters.alcohol.days % counters.alcohol.milestone }} / {{ counters.alcohol.milestone }} days</span>
            <span>{{ Math.round(getProgress(counters.alcohol)) }}%</span>
          </div>
        </div>

        <div class="card-actions">
          <button class="action-btn decrement" @click="decrementDay('alcohol')">-1</button>
          <button class="action-btn increment" @click="incrementDay('alcohol')">+1 Day</button>
          <button class="action-btn reset" @click="resetCounter('alcohol')">Reset</button>
        </div>
      </div>

      <!-- Addiction Counter -->
      <div class="counter-card" :style="{ '--card-color': counters.addiction.color }">
        <div class="card-header">
          <span class="card-icon">{{ counters.addiction.icon }}</span>
          <div class="card-info">
            <h2 class="card-title">{{ counters.addiction.name }}</h2>
            <p class="last-update">{{ formatLastUpdate(counters.addiction.lastReset) }}</p>
          </div>
        </div>

        <div class="counter-display">
          <div class="day-count">
            <span class="number">{{ counters.addiction.days }}</span>
            <span class="label">{{ counters.addiction.days === 1 ? 'Day' : 'Days' }}</span>
          </div>
          <div class="milestone-info">
            <span class="milestone-level">Level {{ getMilestoneLevel(counters.addiction.days, counters.addiction.milestone) }}</span>
          </div>
        </div>

        <div class="progress-section">
          <div class="progress-bar-container">
            <div class="progress-bar-bg">
              <div 
                class="progress-bar-fill" 
                :style="{ width: getProgress(counters.addiction) + '%' }"
              >
                <div class="progress-glow"></div>
              </div>
            </div>
          </div>
          <div class="progress-labels">
            <span>{{ counters.addiction.days % counters.addiction.milestone }} / {{ counters.addiction.milestone }} days</span>
            <span>{{ Math.round(getProgress(counters.addiction)) }}%</span>
          </div>
        </div>

        <div class="card-actions">
          <button class="action-btn decrement" @click="decrementDay('addiction')">-1</button>
          <button class="action-btn increment" @click="incrementDay('addiction')">+1 Day</button>
          <button class="action-btn reset" @click="resetCounter('addiction')">Reset</button>
        </div>
      </div>

      <!-- Sports Counter -->
      <div class="counter-card" :style="{ '--card-color': counters.sports.color }">
        <div class="card-header">
          <span class="card-icon">{{ counters.sports.icon }}</span>
          <div class="card-info">
            <h2 class="card-title">{{ counters.sports.name }}</h2>
            <p class="last-update">{{ formatLastUpdate(counters.sports.lastReset) }}</p>
          </div>
        </div>

        <div class="counter-display">
          <div class="day-count">
            <span class="number">{{ counters.sports.days }}</span>
            <span class="label">{{ counters.sports.days === 1 ? 'Session' : 'Sessions' }}</span>
          </div>
          <div class="milestone-info">
            <span class="milestone-level">Level {{ getMilestoneLevel(counters.sports.days, counters.sports.milestone) }}</span>
          </div>
        </div>

        <div class="progress-section">
          <div class="progress-bar-container">
            <div class="progress-bar-bg">
              <div 
                class="progress-bar-fill" 
                :style="{ width: getProgress(counters.sports) + '%' }"
              >
                <div class="progress-glow"></div>
              </div>
            </div>
          </div>
          <div class="progress-labels">
            <span>{{ counters.sports.days % counters.sports.milestone }} / {{ counters.sports.milestone }} sessions</span>
            <span>{{ Math.round(getProgress(counters.sports)) }}%</span>
          </div>
        </div>

        <div class="card-actions">
          <button class="action-btn decrement" @click="decrementDay('sports')">-1</button>
          <button class="action-btn increment" @click="incrementDay('sports')">+1 Session</button>
          <button class="action-btn reset" @click="resetCounter('sports')">Reset</button>
        </div>
      </div>
    </div>

    <!-- Motivational Section -->
    <div class="motivation-section">
      <div class="motivation-card">
        <h3>💎 Keep Going!</h3>
        <p>Every day is a victory. Stay strong and committed to your journey.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sanity-page {
  animation: fadeIn 0.6s ease;
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
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #1e1e3f;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #00ffff, #ff00ff, #00ff88);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  color: #8b8b9f;
  font-size: 1.1rem;
  font-weight: 300;
}

.counters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
  align-items: stretch;
}

.counter-card {
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
  border: 2px solid #1e1e3f;
  border-radius: 16px;
  padding: 2rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.counter-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--card-color);
  box-shadow: 0 0 20px var(--card-color);
}

.counter-card:hover {
  border-color: var(--card-color);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  transform: translateY(-5px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.card-icon {
  font-size: 3rem;
  filter: drop-shadow(0 0 10px var(--card-color));
}

.card-info {
  flex: 1;
}

.card-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--card-color);
  text-shadow: 0 0 10px var(--card-color);
  margin-bottom: 0.25rem;
}

.last-update {
  font-size: 0.75rem;
  color: #6b6b7f;
}

.counter-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.day-count {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.day-count .number {
  font-size: 4rem;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 0 30px var(--card-color);
  line-height: 1;
}

.day-count .label {
  font-size: 1rem;
  color: #8b8b9f;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-top: 0.5rem;
}

.milestone-info {
  text-align: right;
}

.milestone-level {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--card-color);
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  border: 2px solid var(--card-color);
  box-shadow: 0 0 15px var(--card-color);
}

.progress-section {
  margin-bottom: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.progress-bar-container {
  margin-bottom: 0.5rem;
}

.progress-bar-bg {
  height: 20px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #1e1e3f;
}

.progress-bar-fill {
  height: 100%;
  background: var(--card-color);
  transition: width 0.5s ease;
  border-radius: 10px;
  position: relative;
  box-shadow: 0 0 20px var(--card-color);
}

.progress-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #8b8b9f;
}

.card-actions {
  display: flex;
  gap: 0.75rem;
}

.action-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.3);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn.increment {
  border-color: var(--card-color);
  color: var(--card-color);
}

.action-btn.increment:hover {
  background: var(--card-color);
  color: #0a0a0f;
  box-shadow: 0 0 20px var(--card-color);
  transform: translateY(-2px);
}

.action-btn.decrement {
  border-color: #ffff00;
  color: #ffff00;
}

.action-btn.decrement:hover {
  background: #ffff00;
  color: #0a0a0f;
  box-shadow: 0 0 20px #ffff00;
  transform: translateY(-2px);
}

.action-btn.reset {
  border-color: #ff0055;
  color: #ff0055;
}

.action-btn.reset:hover {
  background: #ff0055;
  color: #0a0a0f;
  box-shadow: 0 0 20px #ff0055;
  transform: translateY(-2px);
}

.motivation-section {
  margin-top: 3rem;
}

.motivation-card {
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(255, 0, 255, 0.1));
  border: 2px solid #1e1e3f;
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
}

.motivation-card h3 {
  font-size: 1.5rem;
  color: #ffffff;
  margin-bottom: 0.5rem;
}

.motivation-card p {
  font-size: 1.1rem;
  color: #8b8b9f;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }
  
  .counters-grid {
    grid-template-columns: 1fr;
  }
  
  .day-count .number {
    font-size: 3rem;
  }
}
</style>
