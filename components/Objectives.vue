<script setup>
import { ref } from 'vue'

const objectives = ref([
  { 
    id: 1, 
    name: 'TOEIC', 
    icon: '📝', 
    color: '#00ffff',
    target: 'Score 920+'
  },
  { 
    id: 2, 
    name: 'Secondary Income', 
    icon: '💵', 
    color: '#00ff88',
    target: '$500/month'
  },
  { 
    id: 3, 
    name: 'Korean Departure', 
    icon: '✈️', 
    color: '#ff00ff',
    target: 'Move to Korea'
  },
  { 
    id: 4, 
    name: 'Black Boulder', 
    icon: '🧗', 
    color: '#ffff00',
    target: 'Climb V7'
  },
  { 
    id: 5, 
    name: 'Better Health', 
    icon: '❤️', 
    color: '#ff0055',
    target: '74kg / 12% BF'
  },
  { 
    id: 6, 
    name: 'Study Gold Territory', 
    icon: '🗺️', 
    color: '#ffa500',
    target: 'Find Gold Location'
  }
])
</script>

<template>
  <div class="objectives-card">
    <div class="card-header">
      <h3>Objectives</h3>
      <span class="objectives-count">{{ objectives.length }}</span>
    </div>

    <div class="objectives-list">
      <NuxtLink
        v-for="objective in objectives" 
        :key="objective.id" 
        to="/objectives"
        class="objective-item"
      >
        <span class="objective-icon" :style="{ color: objective.color }">{{ objective.icon }}</span>
        <div class="objective-info">
          <h4 class="objective-name" :style="{ color: objective.color }">{{ objective.name }}</h4>
          <p class="objective-target">{{ objective.target }}</p>
        </div>
        <span class="arrow">→</span>
      </NuxtLink>
    </div>

    <NuxtLink to="/objectives" class="view-all-button">
      View All Details →
    </NuxtLink>
  </div>
</template>

<style scoped>
.objectives-card {
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
  border: 2px solid #1e1e3f;
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.objectives-card:hover {
  border-color: #00ff88;
  box-shadow: 0 0 30px rgba(0, 255, 136, 0.2);
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

.objectives-count {
  font-size: 0.95rem;
  font-weight: 700;
  color: #00ff88;
  text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
}

.objectives-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
}

.objective-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  padding: 1rem;
  border: 1px solid #1e1e3f;
  transition: all 0.3s ease;
  text-decoration: none;
  position: relative;
}

.objective-item:hover {
  background: rgba(0, 255, 136, 0.05);
  transform: translateX(5px);
  border-color: currentColor;
}

.arrow {
  color: #00ff88;
  font-size: 1.2rem;
  opacity: 0;
  transition: all 0.3s ease;
}

.objective-item:hover .arrow {
  opacity: 1;
}

.objective-icon {
  font-size: 1.5rem;
  filter: drop-shadow(0 0 5px currentColor);
}

.objective-info {
  flex: 1;
  min-width: 0;
}

.objective-name {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: currentColor;
  text-shadow: 0 0 10px currentColor;
}

.objective-target {
  font-size: 0.85rem;
  color: #8b8b9f;
}

.view-all-button {
  display: block;
  margin-top: 1rem;
  padding: 0.75rem;
  text-align: center;
  background: linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 255, 255, 0.1));
  border: 2px solid #00ff88;
  border-radius: 10px;
  color: #00ff88;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
}

.view-all-button:hover {
  background: linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 255, 255, 0.2));
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(0, 255, 136, 0.3);
}
</style>
