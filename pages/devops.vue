<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const isLoading = ref(false)
const lastUpdate = ref<string | null>(null)
const digest = ref<any>(null)
const error = ref<string | null>(null)

// Helper to sanitize and format text
const sanitizeText = (text: string | null | undefined) => {
  try {
    if (!text || typeof text !== 'string') return ''
    return text
      .replace(/<[^>]+>/g, '') // Remove any HTML tags
      .replace(/&[a-z]+;/gi, (entity) => {
        const entities: Record<string, string> = {
          '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', 
          '&quot;': '"', '&#39;': "'", '&apos;': "'"
        }
        return entities[entity.toLowerCase()] || entity
      })
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  } catch (e) {
    console.error('sanitizeText error:', e)
    return String(text || '')
  }
}

// Load cached digest from localStorage
onMounted(() => {
  try {
    const cached = localStorage.getItem('devopsDigest')
    if (cached) {
      console.log('📦 Loading cached digest...')
      const data = JSON.parse(cached)
      if (data && data.digest && data.timestamp) {
        digest.value = data.digest
        lastUpdate.value = data.timestamp
        console.log('✅ Cached digest loaded successfully')
      } else {
        console.warn('⚠️ Invalid cached data format, clearing cache')
        localStorage.removeItem('devopsDigest')
      }
    }
  } catch (e) {
    console.error('❌ Error loading cached digest:', e)
    // Clear corrupted cache
    try {
      localStorage.removeItem('devopsDigest')
    } catch (clearErr) {
      console.error('Failed to clear cache:', clearErr)
    }
  }
})

// Check if digest is stale (older than 7 days)
const isStale = computed(() => {
  try {
    if (!lastUpdate.value) return true
    const lastUpdateTime = new Date(lastUpdate.value).getTime()
    const now = new Date().getTime()
    const weekInMs = 7 * 24 * 60 * 60 * 1000
    return (now - lastUpdateTime) > weekInMs
  } catch (e) {
    console.error('isStale error:', e)
    return false
  }
})

const timeAgo = computed(() => {
  try {
    if (!lastUpdate.value) return 'Never'
    const lastUpdateTime = new Date(lastUpdate.value).getTime()
    const now = new Date().getTime()
    const diffInMs = now - lastUpdateTime
    
    const minutes = Math.floor(diffInMs / (1000 * 60))
    const hours = Math.floor(diffInMs / (1000 * 60 * 60))
    const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    return 'Just now'
  } catch (e) {
    console.error('timeAgo error:', e)
    return 'Unknown'
  }
})

const fetchDigest = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    console.log('🚀 Starting digest fetch...')
    const response = await $fetch('/api/devops-digest', {
      method: 'POST'
    })
    
    console.log('✅ Received response:', response)
    
    if (response.error) {
      error.value = response.message || 'Failed to generate digest'
    } else if (response.digest) {
      digest.value = response.digest
      lastUpdate.value = new Date().toISOString()
      
      // Cache the result
      try {
        localStorage.setItem('devopsDigest', JSON.stringify({
          digest: response.digest,
          timestamp: lastUpdate.value
        }))
      } catch (storageErr) {
        console.warn('Failed to cache digest:', storageErr)
      }
    } else {
      error.value = 'Invalid response format'
    }
  } catch (err: any) {
    console.error('❌ Error fetching digest:', err)
    error.value = err?.message || 'Failed to fetch DevOps digest'
  } finally {
    isLoading.value = false
    console.log('✨ Digest fetch complete')
  }
}

const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    'cloud': '☁️',
    'infrastructure': '🏗️',
    'containers': '📦',
    'cicd': '🔄',
    'security': '🔒',
    'monitoring': '📊',
    'general': '💡'
  }
  return icons[category.toLowerCase()] || '📌'
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'cloud': '#00ffff',
    'infrastructure': '#ff00ff',
    'containers': '#00ff88',
    'cicd': '#ffff00',
    'security': '#ff0055',
    'monitoring': '#9d00ff',
    'general': '#ffd700'
  }
  return colors[category.toLowerCase()] || '#8b8b9f'
}
</script>

<template>
  <div class="devops-page">
    <header class="page-header">
      <div class="header-top">
        <div class="title-group">
          <h1 class="page-title">DevOps Improvement</h1>
          <p class="page-subtitle">AI-curated insights from the DevOps ecosystem</p>
        </div>
      </div>
      
      <div v-if="digest" class="update-info">
        <span class="update-label">Last Updated:</span>
        <span class="update-time">{{ timeAgo }}</span>
        <button 
          class="refresh-btn-simple"
          @click="fetchDigest"
          :disabled="isLoading"
        >
          <span v-if="isLoading">⏳ Refreshing...</span>
          <span v-else>↻ Refresh</span>
        </button>
      </div>
    </header>

    <!-- Error State -->
    <div v-if="error" class="error-card">
      <span class="error-icon">⚠️</span>
      <div class="error-content">
        <h3>Error Loading Digest</h3>
        <p>{{ error }}</p>
        <button @click="fetchDigest" class="retry-btn">Try Again</button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && !digest" class="loading-state">
      <div class="spinner-large"></div>
      <h3>Analyzing DevOps Trends...</h3>
      <p>Fetching from multiple sources and filtering with AI</p>
      <div class="loading-steps">
        <div class="step">📡 Collecting RSS feeds...</div>
        <div class="step">🤖 AI analyzing content...</div>
        <div class="step">✨ Generating insights...</div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!digest && !isLoading && !error" class="empty-state">
      <div class="empty-icon">📚</div>
      <h2>No Digest Available</h2>
      <p>Generate your first DevOps digest to see curated insights from top sources</p>
      <button @click="fetchDigest" class="generate-btn">
        <span>🚀</span>
        <span>Generate Digest</span>
      </button>
      <div class="sources-preview">
        <p class="sources-title">Sources include:</p>
        <div class="sources-list">
          <span>AWS Blog</span>
          <span>Azure Updates</span>
          <span>GCP Blog</span>
          <span>HashiCorp</span>
          <span>Kubernetes</span>
          <span>DevOps.com</span>
        </div>
      </div>
    </div>

    <!-- Digest Content -->
    <div v-if="digest && !isLoading" class="digest-content">
      <!-- Summary Section -->
      <div v-if="digest.summary" class="summary-card">
        <div class="summary-header">
          <span class="summary-icon">📋</span>
          <h2>Executive Summary</h2>
        </div>
        <p class="summary-text">{{ digest.summary ? sanitizeText(digest.summary) : '' }}</p>
      </div>

      <!-- Categories -->
      <div v-if="digest.categories && Array.isArray(digest.categories)" class="categories-grid">
        <div 
          v-for="(category, index) in digest.categories" 
          :key="`category-${index}-${category.name || 'unknown'}`"
          class="category-card"
          :style="{ '--category-color': getCategoryColor(category?.name || 'general') }"
        >
          <div class="category-header">
            <span class="category-icon">{{ getCategoryIcon(category?.name || 'general') }}</span>
            <h3 class="category-title">{{ category.name }}</h3>
            <span class="category-count">{{ category.items?.length || 0 }} items</span>
          </div>
          
          <div v-if="category.items && Array.isArray(category.items) && category.items.length > 0" class="category-items">
            <div 
              v-for="(item, itemIndex) in category.items" 
              :key="`item-${index}-${itemIndex}-${item.url || itemIndex}`"
              class="item-card"
            >
              <h4 class="item-title">{{ item?.title ? sanitizeText(item.title) : 'No title' }}</h4>
              <p class="item-description">{{ item?.description ? sanitizeText(item.description) : '' }}</p>
              <div class="item-meta">
                <span v-if="item?.source" class="item-source">{{ item.source }}</span>
                <span v-if="item?.date" class="item-date">{{ item.date }}</span>
                <a v-if="item?.url" :href="item.url" target="_blank" class="item-link">
                  Read more →
                </a>
              </div>
            </div>
          </div>
          
          <p v-else class="no-items">No significant updates this week</p>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.devops-page {
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
  position: relative;
  z-index: 100;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  position: relative;
  z-index: 100;
}

.title-group {
  flex: 1;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #00ffff, #ff00ff, #ffff00);
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

.refresh-btn-simple {
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #00ffff 0%, #00cccc 100%);
  border: none;
  border-radius: 8px;
  color: #0a0a0f;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.refresh-btn-simple:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 255, 255, 0.4);
}

.refresh-btn-simple:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.update-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
}

.update-label {
  color: #6b6b7f;
}

.update-time {
  color: #00ffff;
  font-weight: 600;
}

.stale-badge {
  padding: 0.25rem 0.75rem;
  background: rgba(255, 153, 0, 0.2);
  border: 1px solid rgba(255, 153, 0, 0.4);
  border-radius: 6px;
  color: #ff9900;
  font-size: 0.8rem;
  font-weight: 600;
}

/* Error State */
.error-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  background: rgba(255, 0, 85, 0.1);
  border: 2px solid rgba(255, 0, 85, 0.3);
  border-radius: 12px;
  margin-bottom: 2rem;
}

.error-icon {
  font-size: 3rem;
}

.error-content h3 {
  color: #ff0055;
  margin-bottom: 0.5rem;
  font-size: 1.3rem;
}

.error-content p {
  color: #8b8b9f;
  margin-bottom: 1rem;
}

.retry-btn {
  padding: 0.5rem 1rem;
  background: rgba(255, 0, 85, 0.2);
  border: 1px solid #ff0055;
  border-radius: 6px;
  color: #ff0055;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: rgba(255, 0, 85, 0.3);
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 4rem 2rem;
}

.spinner-large {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(0, 255, 255, 0.2);
  border-top-color: #00ffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 2rem;
}

.loading-state h3 {
  font-size: 1.5rem;
  color: #00ffff;
  margin-bottom: 0.5rem;
}

.loading-state p {
  color: #8b8b9f;
  margin-bottom: 2rem;
}

.loading-steps {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 400px;
  margin: 0 auto;
}

.step {
  padding: 0.75rem 1rem;
  background: rgba(0, 255, 255, 0.1);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 8px;
  color: #8b8b9f;
  animation: fadeInOut 2s ease-in-out infinite;
}

.step:nth-child(2) {
  animation-delay: 0.5s;
}

.step:nth-child(3) {
  animation-delay: 1s;
}

@keyframes fadeInOut {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 1.5rem;
  opacity: 0.5;
}

.empty-state h2 {
  font-size: 2rem;
  color: #ffffff;
  margin-bottom: 1rem;
}

.empty-state p {
  color: #8b8b9f;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.generate-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #00ffff 0%, #00cccc 100%);
  border: none;
  border-radius: 10px;
  color: #0a0a0f;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 2rem;
}

.generate-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 40px rgba(0, 255, 255, 0.4);
}

.sources-preview {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #1e1e3f;
  border-radius: 12px;
}

.sources-title {
  color: #6b6b7f;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.sources-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
}

.sources-list span {
  padding: 0.5rem 1rem;
  background: rgba(0, 255, 255, 0.1);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 6px;
  color: #00ffff;
  font-size: 0.85rem;
}

/* Digest Content */
.digest-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Summary Card */
.summary-card {
  padding: 2rem;
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(255, 0, 255, 0.1) 100%);
  border: 2px solid #1e1e3f;
  border-radius: 12px;
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.summary-icon {
  font-size: 1.8rem;
}

.summary-header h2 {
  font-size: 1.5rem;
  color: #00ffff;
}

.summary-text {
  color: #e0e0e0;
  line-height: 1.8;
  font-size: 1.05rem;
}

/* Categories Grid */
.categories-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.category-card {
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
  border: 2px solid #1e1e3f;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.category-card:hover {
  border-color: var(--category-color);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.category-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #1e1e3f;
}

.category-icon {
  font-size: 1.8rem;
  filter: drop-shadow(0 0 10px var(--category-color));
}

.category-title {
  flex: 1;
  font-size: 1.3rem;
  color: var(--category-color);
  text-shadow: 0 0 10px var(--category-color);
}

.category-count {
  padding: 0.25rem 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 0.8rem;
  color: #8b8b9f;
}

.category-items {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 1rem;
  scroll-behavior: smooth;
}

.category-items::-webkit-scrollbar {
  height: 8px;
}

.category-items::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.category-items::-webkit-scrollbar-thumb {
  background: var(--category-color);
  border-radius: 4px;
}

.category-items::-webkit-scrollbar-thumb:hover {
  background: var(--category-color);
  opacity: 0.8;
}

.item-card {
  min-width: 350px;
  max-width: 400px;
  flex-shrink: 0;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-left: 3px solid var(--category-color);
  border-radius: 8px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.item-card:hover {
  background: rgba(0, 0, 0, 0.5);
  transform: translateY(-3px);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
}

.item-title {
  font-size: 1.05rem;
  color: #ffffff;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.item-description {
  color: #b0b0c0;
  line-height: 1.7;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: normal;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.85rem;
}

.item-source {
  color: var(--category-color);
  font-weight: 600;
}

.item-date {
  color: #6b6b7f;
}

.item-link {
  margin-left: auto;
  color: #00ffff;
  text-decoration: none;
  transition: all 0.3s ease;
}

.item-link:hover {
  color: #00cccc;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
}

.no-items {
  color: #6b6b7f;
  font-style: italic;
  text-align: center;
  padding: 1rem;
}

/* Key Takeaways */
.takeaways-section {
  padding: 2rem;
  background: linear-gradient(135deg, rgba(255, 255, 0, 0.05) 0%, rgba(255, 0, 255, 0.05) 100%);
  border: 2px solid #1e1e3f;
  border-radius: 12px;
}

.takeaways-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  color: #ffff00;
  margin-bottom: 1.5rem;
}

.takeaways-icon {
  font-size: 1.8rem;
}

.takeaways-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.takeaway-item {
  padding: 1rem 1rem 1rem 3rem;
  background: rgba(0, 0, 0, 0.3);
  border-left: 3px solid #ffff00;
  border-radius: 8px;
  color: #e0e0e0;
  line-height: 1.6;
  position: relative;
}

.takeaway-item::before {
  content: '✓';
  position: absolute;
  left: 1rem;
  color: #ffff00;
  font-weight: bold;
  font-size: 1.2rem;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }
  
  .header-top {
    flex-direction: column;
  }
  
  .refresh-btn {
    width: 100%;
    justify-content: center;
  }
  
  .categories-grid {
    grid-template-columns: 1fr;
  }
}
</style>
