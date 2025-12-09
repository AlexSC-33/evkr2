<script setup>
import { ref, computed, onMounted } from 'vue'
import rankData from '../rank_point.json'

const currentXP = ref(0)
const ranks = rankData.ranks

// Find current rank based on XP
const currentRank = computed(() => {
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (currentXP.value >= ranks[i].min_points) {
      return ranks[i]
    }
  }
  return ranks[0]
})

// Find next rank
const nextRank = computed(() => {
  const currentIndex = currentRank.value.order_index
  if (currentIndex < ranks.length - 1) {
    return ranks[currentIndex + 1]
  }
  return null
})

// Calculate progress to next rank
const progressPercent = computed(() => {
  if (!nextRank.value) return 100
  const current = currentRank.value.min_points
  const next = nextRank.value.min_points
  const progress = ((currentXP.value - current) / (next - current)) * 100
  return Math.min(100, Math.max(0, progress))
})

// Get rank color based on family
const getRankColor = (family) => {
  const colors = {
    'H': '#8b5a3c',
    'G': '#6b6b6b',
    'F': '#4a90a4',
    'E': '#4caf50',
    'D': '#ffd700',
    'C': '#ff9800',
    'B': '#9c27b0',
    'A': '#e91e63',
    'S': '#f44336',
    'X': '#ff00ff'
  }
  return colors[family] || '#00ffff'
}

// Load saved XP from localStorage
onMounted(() => {
  const saved = localStorage.getItem('userXP')
  if (saved) {
    currentXP.value = parseInt(saved)
  }
})

// Add XP (called from parent)
const addXP = (amount) => {
  currentXP.value += amount
  localStorage.setItem('userXP', currentXP.value.toString())
}

// Expose method to parent
defineExpose({ addXP })
</script>

<template>
  <div class="rank-card">
    <div class="rank-header">
      <div class="rank-badge" :style="{ borderColor: getRankColor(currentRank.family), color: getRankColor(currentRank.family) }">
        <span class="rank-text">{{ currentRank.display_name }}</span>
      </div>
      <div class="rank-info">
        <h3>Current Rank</h3>
        <p class="xp-count">{{ currentXP }} XP</p>
      </div>
    </div>

    <div class="xp-bar-container">
      <div class="xp-bar-bg">
        <div 
          class="xp-bar-fill" 
          :style="{ 
            width: progressPercent + '%',
            background: `linear-gradient(90deg, ${getRankColor(currentRank.family)}, ${nextRank ? getRankColor(nextRank.family) : getRankColor(currentRank.family)})`
          }"
        >
          <div class="xp-bar-glow"></div>
        </div>
      </div>
      <div class="xp-labels">
        <span>{{ currentRank.min_points }} XP</span>
        <span v-if="nextRank">{{ nextRank.min_points }} XP</span>
        <span v-else>MAX</span>
      </div>
    </div>

    <div v-if="nextRank" class="next-rank">
      <span>Next: </span>
      <span class="next-rank-name" :style="{ color: getRankColor(nextRank.family) }">
        {{ nextRank.display_name }}
      </span>
      <span class="xp-needed">({{ nextRank.min_points - currentXP }} XP needed)</span>
    </div>
    <div v-else class="max-rank">
      <span>🏆 MAX RANK ACHIEVED! 🏆</span>
    </div>
  </div>
</template>

<style scoped>
.rank-card {
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
  border: 2px solid #1e1e3f;
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.rank-card:hover {
  border-color: #00ffff;
  box-shadow: 0 0 30px rgba(0, 255, 255, 0.2);
}

.rank-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.rank-badge {
  width: 80px;
  height: 80px;
  border: 3px solid;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  box-shadow: 0 0 20px currentColor;
  position: relative;
}

.rank-badge::before {
  content: '';
  position: absolute;
  inset: -5px;
  border-radius: 50%;
  padding: 2px;
  background: linear-gradient(45deg, currentColor, transparent);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.5;
  animation: rotate 3s linear infinite;
}

@keyframes rotate {
  to {
    transform: rotate(360deg);
  }
}

.rank-text {
  font-size: 2rem;
  font-weight: 700;
  text-shadow: 0 0 10px currentColor;
}

.rank-info h3 {
  font-size: 1.1rem;
  color: #8b8b9f;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.xp-count {
  font-size: 1.8rem;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
}

.xp-bar-container {
  margin-bottom: 1rem;
}

.xp-bar-bg {
  height: 20px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  border: 1px solid #1e1e3f;
}

.xp-bar-fill {
  height: 100%;
  transition: width 0.5s ease;
  position: relative;
  border-radius: 10px;
  overflow: hidden;
}

.xp-bar-glow {
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

.xp-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #8b8b9f;
}

.next-rank {
  text-align: center;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  font-size: 0.95rem;
  color: #8b8b9f;
}

.next-rank-name {
  font-weight: 700;
  font-size: 1.1rem;
  text-shadow: 0 0 10px currentColor;
}

.xp-needed {
  color: #6b6b7f;
  font-size: 0.85rem;
}

.max-rank {
  text-align: center;
  padding: 0.75rem;
  background: linear-gradient(135deg, rgba(255, 0, 255, 0.2), rgba(255, 255, 0, 0.2));
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 700;
  color: #ffff00;
  text-shadow: 0 0 10px #ffff00;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
