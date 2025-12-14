<script setup>
import { ref, onMounted } from 'vue'

const newsData = ref({
  us: [],
  europe: [],
  korea: []
})

const isLoading = ref({
  us: false,
  europe: false,
  korea: false
})

const errors = ref({
  us: null,
  europe: null,
  korea: null
})

const lastUpdated = ref({
  us: null,
  europe: null,
  korea: null
})

// Cache keys for localStorage
const CACHE_KEYS = {
  us: 'news_cache_us',
  europe: 'news_cache_europe',
  korea: 'news_cache_korea',
  timestamps: 'news_cache_timestamps'
}

// Load news from cache
const loadFromCache = () => {
  try {
    const timestamps = JSON.parse(localStorage.getItem(CACHE_KEYS.timestamps) || '{}')
    
    Object.keys(newsData.value).forEach(region => {
      const cached = localStorage.getItem(CACHE_KEYS[region])
      if (cached) {
        newsData.value[region] = JSON.parse(cached)
        lastUpdated.value[region] = timestamps[region] ? new Date(timestamps[region]) : null
      }
    })
  } catch (err) {
    console.error('Error loading cached news:', err)
  }
}

// Save news to cache
const saveToCache = (region, articles) => {
  try {
    localStorage.setItem(CACHE_KEYS[region], JSON.stringify(articles))
    
    const timestamps = JSON.parse(localStorage.getItem(CACHE_KEYS.timestamps) || '{}')
    timestamps[region] = new Date().toISOString()
    localStorage.setItem(CACHE_KEYS.timestamps, JSON.stringify(timestamps))
    
    lastUpdated.value[region] = new Date()
  } catch (err) {
    console.error('Error saving to cache:', err)
  }
}

// Load news from multiple European countries
const loadEuropeNews = async () => {
  isLoading.value.europe = true
  errors.value.europe = null
  
  try {
    const countries = ['gb', 'fr', 'de', 'it']
    const allArticles = []
    
    // Fetch news from each European country
    for (const country of countries) {
      try {
        const response = await $fetch('/api/news', {
          params: {
            region: country,
            lang: 'en',
            max: 3
          }
        })
        
        if (response.articles) {
          allArticles.push(...response.articles)
        }
      } catch (err) {
        console.error(`Error loading ${country} news:`, err)
      }
    }
    
    if (allArticles.length === 0) {
      errors.value.europe = 'No European news available'
      newsData.value.europe = []
    } else {
      // Shuffle and limit to 6 articles
      const shuffled = allArticles.sort(() => Math.random() - 0.5)
      newsData.value.europe = shuffled.slice(0, 6).map((article, index) => ({
        id: `europe-${index}`,
        title: article.title,
        description: article.description || 'No description available',
        category: article.source.name,
        date: new Date(article.publishedAt).toLocaleDateString(),
        url: article.url,
        image: article.image
      }))
      
      // Save to cache
      saveToCache('europe', newsData.value.europe)
    }
  } catch (err) {
    console.error('Error loading Europe news:', err)
    errors.value.europe = 'Failed to load European news'
    newsData.value.europe = []
  } finally {
    isLoading.value.europe = false
  }
}

// Note: Korean news now uses English-language sources (Korea Herald, Korea Times)
// No translation needed!

// Load news for a specific region
const loadRegionNews = async (region, regionCode, lang, searchQuery = null) => {
  isLoading.value[region] = true
  errors.value[region] = null
  
  try {
    // Build params object for API call
    const params = {
      lang: lang,
      max: 6
    }

    if (searchQuery) {
      params.search = searchQuery
    } else {
      params.region = regionCode
    }

    const response = await $fetch('/api/news', {
      params: params
    })

    if (response.error) {
      errors.value[region] = response.message
      newsData.value[region] = []
    } else if (response.articles) {
      // First, display articles without translation
      const initialArticles = response.articles.map((article, index) => ({
        id: `${region}-${index}`,
        title: article.title,
        description: article.description || 'No description available',
        category: article.source.name,
        date: new Date(article.publishedAt).toLocaleDateString(),
        url: article.url,
        image: article.image
      }))
      
      newsData.value[region] = initialArticles
      
      // Save to cache
      saveToCache(region, initialArticles)
    }
  } catch (err) {
    console.error(`Error loading ${region} news:`, err)
    errors.value[region] = 'Failed to load news'
    newsData.value[region] = []
  } finally {
    isLoading.value[region] = false
  }
}

// Load cached news on mount, no API calls
onMounted(() => {
  loadFromCache()
})

// Refresh news for a region
const refreshRegion = (region) => {
  if (region === 'us') {
    loadRegionNews('us', 'us', 'en')
  } else if (region === 'europe') {
    loadEuropeNews()
  } else if (region === 'korea') {
    // Korean news temporarily disabled - work in progress
    console.log('Korean news section is under development')
  }
}

// Format last updated time
const formatLastUpdated = (date) => {
  if (!date) return 'Never updated - Click refresh to load news'
  
  const now = new Date()
  const diff = Math.floor((now - date) / 1000) // seconds
  
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
  return `${Math.floor(diff / 86400)} days ago`
}
</script>

<template>
  <div class="news-page">
    <header class="page-header">
      <h1 class="page-title">World News</h1>
      <p class="page-subtitle">Stay updated with latest news from around the world</p>
    </header>

    <div class="news-sections">
      <!-- USA News Section -->
      <section class="news-section">
        <div class="section-header">
          <div class="section-title-group">
            <span class="section-icon">🇺🇸</span>
            <div>
              <h2 class="section-title" style="color: #00ffff;">USA News</h2>
              <span class="last-updated">{{ formatLastUpdated(lastUpdated.us) }}</span>
            </div>
          </div>
          <button 
            class="refresh-btn" 
            @click="refreshRegion('us')"
            :disabled="isLoading.us"
            style="border-color: #00ffff;"
          >
            <span class="refresh-icon" :class="{ spinning: isLoading.us }">↻</span>
          </button>
        </div>

        <div v-if="errors.us" class="error-message">
          <span>⚠️</span>
          <p>{{ errors.us }}</p>
        </div>

        <div v-if="isLoading.us && newsData.us.length === 0" class="loading-state">
          <div class="spinner" style="border-top-color: #00ffff;"></div>
          <p>Loading USA news...</p>
        </div>

        <div v-else class="news-grid">
          <a 
            v-for="article in newsData.us" 
            :key="article.id"
            :href="article.url"
            target="_blank"
            rel="noopener noreferrer"
            class="news-card"
            style="--card-color: #00ffff;"
          >
            <div class="card-image-container">
              <img v-if="article.image" :src="article.image" :alt="article.title" class="card-image" />
              <div v-else class="card-image-placeholder">
                <span>📰</span>
              </div>
            </div>
            <div class="card-content">
              <div class="card-meta">
                <span class="card-category">{{ article.category }}</span>
                <span class="card-date">{{ article.date }}</span>
              </div>
              <h3 class="card-title">
                {{ article.title }}
                <span v-if="article.translating" class="translating-badge">Translating...</span>
              </h3>
              <p class="card-description">{{ article.description }}</p>
            </div>
          </a>
        </div>
      </section>

      <!-- Europe News Section -->
      <section class="news-section">
        <div class="section-header">
          <div class="section-title-group">
            <span class="section-icon">🇪🇺</span>
            <div>
              <h2 class="section-title" style="color: #00ff88;">Europe News</h2>
              <span class="section-subtitle">UK • France • Germany • Italy</span>
              <span class="last-updated">{{ formatLastUpdated(lastUpdated.europe) }}</span>
            </div>
          </div>
          <button 
            class="refresh-btn" 
            @click="refreshRegion('europe')"
            :disabled="isLoading.europe"
            style="border-color: #00ff88;"
          >
            <span class="refresh-icon" :class="{ spinning: isLoading.europe }">↻</span>
          </button>
        </div>

        <div v-if="errors.europe" class="error-message">
          <span>⚠️</span>
          <p>{{ errors.europe }}</p>
        </div>

        <div v-if="isLoading.europe && newsData.europe.length === 0" class="loading-state">
          <div class="spinner" style="border-top-color: #00ff88;"></div>
          <p>Loading Europe news...</p>
        </div>

        <div v-else class="news-grid">
          <a 
            v-for="article in newsData.europe" 
            :key="article.id"
            :href="article.url"
            target="_blank"
            rel="noopener noreferrer"
            class="news-card"
            style="--card-color: #00ff88;"
          >
            <div class="card-image-container">
              <img v-if="article.image" :src="article.image" :alt="article.title" class="card-image" />
              <div v-else class="card-image-placeholder">
                <span>📰</span>
              </div>
            </div>
            <div class="card-content">
              <div class="card-meta">
                <span class="card-category">{{ article.category }}</span>
                <span class="card-date">{{ article.date }}</span>
              </div>
              <h3 class="card-title">
                {{ article.title }}
                <span v-if="article.translating" class="translating-badge">Translating...</span>
              </h3>
              <p class="card-description">{{ article.description }}</p>
            </div>
          </a>
        </div>
      </section>

      <!-- Korea News Section -->
      <section class="news-section">
        <div class="section-header">
          <div class="section-title-group">
            <span class="section-icon">🇰🇷</span>
            <h2 class="section-title" style="color: #ff00ff;">Korean News</h2>
            <span class="section-subtitle">English sources</span>
          </div>
          <!-- Refresh button temporarily hidden -->
          <button 
            v-if="false"
            class="refresh-btn" 
            @click="refreshRegion('korea')"
            :disabled="isLoading.korea"
            style="border-color: #ff00ff;"
          >
            <span class="refresh-icon" :class="{ spinning: isLoading.korea }">↻</span>
          </button>
        </div>

        <div v-if="errors.korea" class="error-message">
          <span>⚠️</span>
          <p>{{ errors.korea }}</p>
        </div>

        <div v-if="isLoading.korea && newsData.korea.length === 0" class="loading-state">
          <div class="spinner" style="border-top-color: #ff00ff;"></div>
          <p>Loading Korean news...</p>
        </div>

        <!-- Work in Progress Message -->
        <div class="wip-message" style="border-color: #ff00ff;">
          <div class="wip-icon">🚧</div>
          <h3>Work in Progress</h3>
          <p>Korean news section is currently under development. We're working on bringing you the latest news from Korea soon!</p>
        </div>

        <div v-if="false" class="news-grid">
          <a 
            v-for="article in newsData.korea" 
            :key="article.id"
            :href="article.url"
            target="_blank"
            rel="noopener noreferrer"
            class="news-card"
            style="--card-color: #ff00ff;"
          >
            <div class="card-image-container">
              <img v-if="article.image" :src="article.image" :alt="article.title" class="card-image" />
              <div v-else class="card-image-placeholder">
                <span>📰</span>
              </div>
            </div>
            <div class="card-content">
              <div class="card-meta">
                <span class="card-category">{{ article.category }}</span>
                <span class="card-date">{{ article.date }}</span>
              </div>
              <h3 class="card-title">
                {{ article.title }}
                <span v-if="article.translating" class="translating-badge">Translating...</span>
              </h3>
              <p class="card-description">{{ article.description }}</p>
            </div>
          </a>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.news-page {
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
  background: linear-gradient(135deg, #00ffff, #00ff88, #ff00ff);
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

.news-sections {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.news-section {
  animation: slideIn 0.6s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #1e1e3f;
}

.section-title-group {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.section-icon {
  font-size: 2rem;
  filter: drop-shadow(0 0 10px currentColor);
}

.section-title {
  font-size: 1.8rem;
  font-weight: 700;
  text-shadow: 0 0 20px currentColor;
}

.section-subtitle {
  font-size: 0.85rem;
  color: #8b8b9f;
  font-weight: 400;
  margin-left: 0.5rem;
}

.last-updated {
  display: block;
  font-size: 0.75rem;
  color: #6b6b7f;
  font-weight: 400;
  margin-top: 0.25rem;
  font-style: italic;
}

.refresh-btn {
  width: 40px;
  height: 40px;
  border: 2px solid;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  transform: rotate(180deg);
  box-shadow: 0 0 20px currentColor;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-icon {
  font-size: 1.5rem;
  color: inherit;
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

.error-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(255, 0, 85, 0.1);
  border: 1px solid rgba(255, 0, 85, 0.3);
  border-radius: 10px;
  margin-bottom: 1.5rem;
}

.error-message span {
  font-size: 1.5rem;
}

.error-message p {
  color: #ff0055;
  margin: 0;
}

.loading-state {
  text-align: center;
  padding: 3rem 1rem;
}

.wip-message {
  text-align: center;
  padding: 3rem 2rem;
  background: rgba(255, 0, 255, 0.05);
  border: 2px dashed;
  border-radius: 12px;
  margin: 1rem 0;
}

.wip-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.wip-message h3 {
  font-size: 1.5rem;
  color: #ff00ff;
  margin-bottom: 0.75rem;
}

.wip-message p {
  color: #b0b0c0;
  font-size: 1rem;
  max-width: 500px;
  margin: 0 auto;
  line-height: 1.6;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.loading-state p {
  color: #8b8b9f;
  font-size: 0.9rem;
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.news-card {
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
  border: 2px solid #1e1e3f;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.news-card:hover {
  border-color: var(--card-color);
  transform: translateY(-5px);
  box-shadow: 0 10px 30px var(--card-color);
}

.news-card:hover .card-title {
  color: var(--card-color);
  text-shadow: 0 0 10px var(--card-color);
}

.news-card:hover .card-image {
  transform: scale(1.1);
}

.card-image-container {
  width: 100%;
  height: 180px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.card-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  opacity: 0.3;
}

.card-content {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.card-category {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--card-color);
  text-shadow: 0 0 10px var(--card-color);
}

.card-date {
  font-size: 0.75rem;
  color: #6b6b7f;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.75rem;
  line-height: 1.4;
  transition: all 0.3s ease;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  position: relative;
}

.translating-badge {
  display: inline-block;
  font-size: 0.65rem;
  color: #ffcc00;
  background: rgba(255, 204, 0, 0.2);
  padding: 2px 8px;
  border-radius: 4px;
  margin-left: 8px;
  text-shadow: 0 0 5px rgba(255, 204, 0, 0.5);
  animation: pulse 1.5s ease-in-out infinite;
  vertical-align: middle;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.card-description {
  font-size: 0.9rem;
  color: #8b8b9f;
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }
  
  .section-title {
    font-size: 1.5rem;
  }
  
  .news-grid {
    grid-template-columns: 1fr;
  }
}
</style>
