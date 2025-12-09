<script setup>
import { ref } from 'vue'
import RankCard from '~/components/RankCard.vue'
import DailyQuests from '~/components/DailyQuests.vue'
import Objectives from '~/components/Objectives.vue'

const rankCardRef = ref(null)

// Handle quest completion - add XP to rank system
const handleQuestCompleted = (xp) => {
  if (rankCardRef.value) {
    rankCardRef.value.addXP(xp)
  }
}
</script>

<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <h1 class="title">Dashboard</h1>
      <p class="subtitle">Track your progress and achieve your goals</p>
    </header>

    <div class="dashboard-layout">
      <!-- Top: Rank & XP System -->
      <div class="rank-section">
        <RankCard ref="rankCardRef" />
      </div>

      <!-- Bottom: Two columns -->
      <div class="bottom-section">
        <!-- Left: Daily Quests -->
        <div class="left-column">
          <DailyQuests @questCompleted="handleQuestCompleted" />
        </div>
        
        <!-- Right: Objectives -->
        <div class="right-column">
          <Objectives />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
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

.dashboard-header {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #1e1e3f;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #00ffff, #ff00ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
  text-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
}

.subtitle {
  color: #8b8b9f;
  font-size: 1.1rem;
  font-weight: 300;
}

.dashboard-layout {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.rank-section {
  width: 100%;
}

.bottom-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  align-items: start;
}

.left-column,
.right-column {
  min-width: 0;
}

@media (max-width: 1024px) {
  .bottom-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .title {
    font-size: 2rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
}
</style>
