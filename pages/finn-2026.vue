<script setup>
import { ref } from 'vue'

definePageMeta({
  middleware: 'auth'
})

const message = ref('Finn 2026 - Coming Soon')
</script>

<template>
  <div class="finn-2026-page">
    <div class="page-header">
      <h1>📊 Finn 2026</h1>
      <p class="subtitle">Financial Portfolio Tracker - 2026</p>
    </div>

    <div class="coming-soon-container">
      <div class="coming-soon-card">
        <div class="icon-large">🚧</div>
        <h2>{{ message }}</h2>
        <p>This section is currently under development and will be available soon.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.finn-2026-page {
  padding: 2rem;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 3rem;
}

.page-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #00ffff, #ff00ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1.2rem;
  color: #8b8b9f;
}

.coming-soon-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.coming-soon-card {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #1e1e3f;
  border-radius: 20px;
  padding: 4rem;
  text-align: center;
  max-width: 600px;
  box-shadow: 0 10px 40px rgba(0, 255, 255, 0.1);
}

.icon-large {
  font-size: 5rem;
  margin-bottom: 2rem;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.coming-soon-card h2 {
  font-size: 2rem;
  color: #00ffff;
  margin-bottom: 1rem;
}

.coming-soon-card p {
  font-size: 1.1rem;
  color: #8b8b9f;
  line-height: 1.6;
}
</style>
