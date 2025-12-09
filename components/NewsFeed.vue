<script setup>
import { ref, onMounted } from 'vue'

const news = ref([])
const isLoading = ref(false)
const currentRegion = ref('us')
const error = ref(null)

// Region configurations with languages
const regions = [
  { code: 'kr', name: 'Korea', lang: 'ko', color: '#ff00ff' },
  { code: 'us', name: 'USA', lang: 'en', color: '#00ffff' },
  { code: 'fr', name: 'Europe', lang: 'en', color: '#00ff88' }
]

// Get color based on region
const getRegionColor = (regionCode) => {
  const region = regions.find(r => r.code === regionCode)
  return region ? region.color : '#ffff00'
}

// Load news from API
const loadNews = async (region = currentRegion.value) => {
  isLoading.value = true
  error.value = null
  
  try {
    const regionConfig = regions.find(r => r.code === region) || regions[1]
    const response = await $fetch('/api/news', {
      params: {
        region: regionConfig.code,
        lang: regionConfig.lang,
        max: 10
      }
    })

    if (response.error) {
      error.value = response.message
      news.value = []
    } else if (response.articles) {
      news.value = response.articles.map((article, index) => ({
        id: index + 1,
        title: article.title,
        description: article.description || 'No description available',
        category: article.source.name,
        date: new Date(article.publishedAt).toLocaleDateString(),
        url: article.url,
        image: article.image,
        color: getRegionColor(region)
      }))
    }
  } catch (err) {
    console.error('Error loading news:', err)
    error.value = 'Failed to load news. Please check your API configuration.'
    news.value = []
  } finally {
    isLoading.value = false
  }
}

// Change region
const changeRegion = (regionCode) => {
  currentRegion.value = regionCode
  loadNews(regionCode)
}

// Load news on mount
onMounted(() => {
  loadNews()
})
</script>

<template>
  <div class="news-feed">
    <div class="feed-header">
      <h3>News Feed</h3>
      <button class="refresh-btn" @click="loadNews" :disabled="isLoading">
        <span class="refresh-icon" :class="{ spinning: isLoading }">↻</span>
      </button>
    </div>

    <!-- Region Selector -->
    <div class="region-selector">
      <button 
        v-for="region in regions" 
        :key="region.code"
        class="region-btn"
        :class="{ active: currentRegion === region.code }"
        :style="{ 
          '--region-color': region.color,
          borderColor: currentRegion === region.code ? region.color : 'transparent',
          color: currentRegion === region.code ? region.color : '#8b8b9f'
        }"
        @click="changeRegion(region.code)"
      >
        {{ region.name }}
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error-notice">
      <span class="notice-icon">⚠️</span>
      <div>
        <p class="error-title">{{ error }}</p>
        <p class="error-subtitle">Get your free API key at <a href="https://gnews.io/" target="_blank">gnews.io</a></p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && news.length === 0" class="loading-state">
      <div class="spinner"></div>
      <p>Loading news...</p>
    </div>

    <div class="news-list" v-else>
      <a 
        v-for="item in news" 
        :key="item.id" 
        :href="item.url"
        target="_blank"
        rel="noopener noreferrer"
        class="news-item"
        :style="{ '--item-color': item.color }"
      >
        <div class="news-image-container">
          <img v-if="item.image" :src="item.image" :alt="item.title" class="news-image" />
          <div v-else class="news-image-placeholder">
            <span>📰</span>
          </div>
        </div>
        <div class="news-content">
          <div class="news-header">
            <span class="news-category" :style="{ color: item.color }">{{ item.category }}</span>
            <span class="news-date">{{ item.date }}</span>
          </div>
          <h4 class="news-title">{{ item.title }}</h4>
          <p class="news-description">{{ item.description }}</p>
        </div>
      </a>

      <!-- Empty State -->
      <div v-if="!isLoading && news.length === 0 && !error" class="empty-state">
        <span class="empty-icon">📰</span>
        <p>No news available</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.news-feed {
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
  border: 2px solid #1e1e3f;
  border-radius: 16px;
  padding: 1.5rem;
  height: fit-content;
  transition: all 0.3s ease;
}

.news-feed:hover {
  border-color: #9d00ff;
  box-shadow: 0 0 30px rgba(157, 0, 255, 0.2);
}

.feed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.feed-header h3 {
  font-size: 1.3rem;
  color: #ffffff;
  font-weight: 600;
}

.refresh-btn {
  width: 36px;
  height: 36px;
  border: 2px solid #9d00ff;
  border-radius: 50%;
  background: rgba(157, 0, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(157, 0, 255, 0.3);
  transform: rotate(180deg);
  box-shadow: 0 0 15px rgba(157, 0, 255, 0.5);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-icon {
  font-size: 1.5rem;
  color: #9d00ff;
  display: block;
  transition: transform 0.3s ease;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.region-selector {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
}

.region-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.3);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.region-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-2px);
}

.region-btn.active {
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 15px var(--region-color);
  text-shadow: 0 0 10px var(--region-color);
}

.error-notice {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(255, 0, 85, 0.1);
  border: 1px solid rgba(255, 0, 85, 0.3);
  border-radius: 10px;
  margin-bottom: 1.5rem;
}

.notice-icon {
  font-size: 1.5rem;
}

.error-title {
  font-size: 0.9rem;
  color: #ff0055;
  margin: 0 0 0.25rem 0;
  font-weight: 600;
}

.error-subtitle {
  font-size: 0.8rem;
  color: #8b8b9f;
  margin: 0;
}

.error-subtitle a {
  color: #ff00ff;
  text-decoration: none;
  font-weight: 600;
}

.error-subtitle a:hover {
  text-decoration: underline;
}

.loading-state {
  text-align: center;
  padding: 3rem 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(157, 0, 255, 0.2);
  border-top-color: #9d00ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.loading-state p {
  color: #8b8b9f;
  font-size: 0.9rem;
}

.news-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
  max-height: 600px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.news-list::-webkit-scrollbar {
  width: 6px;
}

.news-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
}

.news-list::-webkit-scrollbar-thumb {
  background: #9d00ff;
  border-radius: 3px;
}

.news-item {
  display: flex;
  gap: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #1e1e3f;
  border-left: 3px solid var(--item-color);
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.3s ease;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}

.news-item:hover {
  background: rgba(0, 0, 0, 0.5);
  border-left-width: 5px;
  transform: translateX(5px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.news-item:hover .news-title {
  color: var(--item-color);
  text-shadow: 0 0 10px var(--item-color);
}

.news-image-container {
  flex-shrink: 0;
  width: 140px;
  height: 140px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
}

.news-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}

.news-item:hover .news-image {
  transform: scale(1.1);
}

.news-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  opacity: 0.3;
}

.news-content {
  flex: 1;
  padding: 1rem 1rem 1rem 0;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.news-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.news-category {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 0 0 10px currentColor;
}

.news-date {
  font-size: 0.75rem;
  color: #6b6b7f;
}

.news-title {
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.5rem;
  line-height: 1.3;
  transition: all 0.3s ease;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.news-description {
  font-size: 0.85rem;
  color: #8b8b9f;
  line-height: 1.4;
  flex: 1;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}



.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}

.empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state p {
  color: #8b8b9f;
  font-size: 0.9rem;
}
</style>
