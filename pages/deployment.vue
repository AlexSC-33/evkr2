<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const activeNode = ref(0)
let animationInterval = null

const nodes = [
  { id: 1, name: 'GitHub', icon: '💻', section: 'source' },
  { id: 2, name: 'Commit/Tag', icon: '🏷️', section: 'trigger' },
  { id: 3, name: 'CI Actions', icon: '⚙️', section: 'ci' },
  { id: 4, name: 'Build', icon: '🔨', section: 'ci' },
  { id: 5, name: 'Test', icon: '✓', section: 'ci' },
  { id: 6, name: 'Version', icon: '📌', section: 'ci' },
  { id: 7, name: 'CD Actions', icon: '🚀', section: 'cd' },
  { id: 8, name: 'Docker', icon: '🐳', section: 'cd' },
  { id: 9, name: 'Registry', icon: '📦', section: 'cd' },
  { id: 10, name: 'Helm', icon: '⎈', section: 'cd' },
  { id: 11, name: 'EKS', icon: '☸️', section: 'cd' },
  { id: 12, name: 'Web App', icon: '🌐', section: 'live' }
]

const startAnimation = () => {
  let index = 0
  
  const animate = () => {
    activeNode.value = index
    index = (index + 1) % nodes.length
  }
  
  animate()
  animationInterval = setInterval(animate, 1800)
}

onMounted(() => {
  startAnimation()
})

onUnmounted(() => {
  if (animationInterval) {
    clearInterval(animationInterval)
  }
})
</script>

<template>
  <div class="deployment-page">
    <header class="page-header">
      <div>
        <h1 class="title">CI/CD Architecture</h1>
        <p class="subtitle">DevOps pipeline from code to production</p>
      </div>
      <NuxtLink to="/" class="back-button">
        <span>←</span> Back to Dashboard
      </NuxtLink>
    </header>

    <div class="architecture-container">
      <!-- Full Horizontal Flow -->
      <div class="full-horizontal-flow">
        <!-- Source Control -->
        <div class="arch-section">
          <div class="section-label">Source Control</div>
          <div class="node-box" :class="{ active: activeNode === 0 }">
            <div class="node-icon">💻</div>
            <div class="node-name">GitHub</div>
            <div class="node-desc">Repository</div>
          </div>
        </div>

        <div class="arrow-right">→</div>

        <!-- Trigger -->
        <div class="arch-section">
          <div class="section-label">Trigger</div>
          <div class="node-box" :class="{ active: activeNode === 1 }">
            <div class="node-icon">🏷️</div>
            <div class="node-name">Commit/Tag</div>
            <div class="node-desc">Push Event</div>
          </div>
        </div>

        <div class="arrow-right">→</div>

        <!-- CI Pipeline -->
        <div class="arch-section ci-section">
          <div class="section-label">CI Pipeline</div>
          <div class="section-box horizontal-box">
            <div class="node-box" :class="{ active: activeNode === 2 }">
              <div class="node-icon">⚙️</div>
              <div class="node-name">GitHub Actions</div>
              <div class="node-desc">CI Workflow</div>
            </div>
            
            <div class="horizontal-flow">
              <div class="node-box small" :class="{ active: activeNode === 3 }">
                <div class="node-icon">🔨</div>
                <div class="node-name">Build</div>
              </div>
              <div class="mini-arrow">→</div>
              <div class="node-box small" :class="{ active: activeNode === 4 }">
                <div class="node-icon">✓</div>
                <div class="node-name">Test</div>
              </div>
              <div class="mini-arrow">→</div>
              <div class="node-box small" :class="{ active: activeNode === 5 }">
                <div class="node-icon">📌</div>
                <div class="node-name">Version</div>
              </div>
            </div>
          </div>
        </div>

        <div class="arrow-right">→</div>

        <!-- CD Pipeline -->
        <div class="arch-section cd-section">
          <div class="section-label">CD Pipeline</div>
          <div class="section-box horizontal-box">
            <div class="node-box" :class="{ active: activeNode === 6 }">
              <div class="node-icon">🚀</div>
              <div class="node-name">GitHub Actions</div>
              <div class="node-desc">CD Workflow</div>
            </div>
            
            <div class="horizontal-flow">
              <div class="node-box small" :class="{ active: activeNode === 7 }">
                <div class="node-icon">🐳</div>
                <div class="node-name">Docker</div>
              </div>
              <div class="mini-arrow">→</div>
              <div class="node-box small" :class="{ active: activeNode === 8 }">
                <div class="node-icon">📦</div>
                <div class="node-name">Registry</div>
              </div>
              <div class="mini-arrow">→</div>
              <div class="node-box small" :class="{ active: activeNode === 9 }">
                <div class="node-icon">⎈</div>
                <div class="node-name">Helm</div>
              </div>
              <div class="mini-arrow">→</div>
              <div class="node-box small" :class="{ active: activeNode === 10 }">
                <div class="node-icon">☸️</div>
                <div class="node-name">EKS</div>
              </div>
            </div>
          </div>
        </div>

        <div class="arrow-right">→</div>

        <!-- Web App Live -->
        <div class="arch-section">
          <div class="section-label">Live</div>
          <div class="node-box" :class="{ active: activeNode === 11 }">
            <div class="node-icon">🌐</div>
            <div class="node-name">Web App</div>
            <div class="node-desc">Available</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="legend">
      <div class="legend-item">
        <div class="legend-icon active-box"></div>
        <span>Active Step</span>
      </div>
      <div class="legend-item">
        <div class="legend-icon dotted-box"></div>
        <span>Grouped Process</span>
      </div>
      <div class="legend-item">
        <div class="legend-icon flow-box"></div>
        <span>Workflow Direction</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.deployment-page {
  min-height: 100vh;
  padding: 2rem;
  background: radial-gradient(circle at top right, #1a1a2e 0%, #0f0f1a 50%, #16213e 100%);
  color: #e0e0e0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid rgba(0, 255, 255, 0.2);
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #00ffff 0%, #00ff88 50%, #ffff00 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.subtitle {
  color: #888;
  margin: 0.5rem 0 0 0;
  font-size: 1.1rem;
}

.back-button {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #00ffff 0%, #00ff88 100%);
  color: #0f0f1a;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.back-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 255, 255, 0.3);
}

.architecture-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 3rem;
  min-height: 400px;
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
  border: 2px solid #1e1e3f;
  border-radius: 16px;
  position: relative;
  overflow-x: auto;
  margin-bottom: 2rem;
}

.full-horizontal-flow {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
}

.arch-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.section-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.section-box {
  border: 2px dashed rgba(0, 255, 255, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.2);
}

.horizontal-box {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.ci-section .section-box {
  border-color: rgba(255, 0, 255, 0.3);
}

.cd-section .section-box {
  border-color: rgba(0, 255, 136, 0.3);
}

.node-box {
  background: linear-gradient(135deg, #1e1e3f 0%, #2a2a4a 100%);
  border: 2px solid #3a3a5a;
  border-radius: 12px;
  padding: 1.5rem;
  min-width: 150px;
  text-align: center;
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
}

.node-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.2), transparent);
  transition: left 0.6s ease;
}

.node-box.active {
  border-color: #00ffff;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.6), inset 0 0 20px rgba(0, 255, 255, 0.1);
  transform: scale(1.05);
}

.node-box.active::before {
  left: 100%;
}

.node-box.small {
  min-width: 100px;
  padding: 1rem;
}

.node-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.3));
}

.node-box.active .node-icon {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.node-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 0.25rem;
}

.node-desc {
  font-size: 0.85rem;
  color: #888;
}

.horizontal-flow {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
}

.vertical-arrow {
  font-size: 2rem;
  color: #00ff88;
  animation: arrowPulse 2s ease-in-out infinite;
}

@keyframes arrowPulse {
  0%, 100% { opacity: 0.4; transform: scaleY(1); }
  50% { opacity: 1; transform: scaleY(1.2); }
}

.arrow-right {
  font-size: 2rem;
  color: #00ffff;
  animation: arrowFlow 2s ease-in-out infinite;
}

@keyframes arrowFlow {
  0%, 100% { transform: translateX(0); opacity: 0.5; }
  50% { transform: translateX(5px); opacity: 1; }
}

.mini-arrow {
  color: #888;
  font-size: 1.2rem;
}

.legend {
  margin-top: 3rem;
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #3a3a5a;
  border-radius: 8px;
}

.legend-icon {
  width: 30px;
  height: 30px;
  border-radius: 6px;
}

.active-box {
  background: #00ffff;
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.6);
}

.dotted-box {
  border: 2px dashed #00ff88;
  background: transparent;
}

.flow-box {
  background: linear-gradient(90deg, #00ffff 0%, #00ff88 100%);
}

/* Responsive */
@media (max-width: 1400px) {
  .horizontal-section {
    flex-direction: column;
  }
  
  .arrow-right {
    transform: rotate(90deg);
  }
  
  .bottom-section {
    flex-direction: column;
  }
}

/* Responsive */
@media (max-width: 1600px) {
  .full-horizontal-flow {
    flex-direction: column;
  }
  
  .arrow-right {
    transform: rotate(90deg);
  }
}

@media (max-width: 768px) {
  .title {
    font-size: 2rem;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .architecture-container {
    padding: 1.5rem;
  }
  
  .node-box {
    min-width: 100px;
    padding: 1rem;
  }
  
  .node-icon {
    font-size: 2rem;
  }
  
  .legend {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>