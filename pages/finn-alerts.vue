<script setup>
import { ref, computed } from 'vue'

definePageMeta({
  middleware: 'auth'
})

// Alert types
const alertTypes = ['Price Target', 'Stop Loss', 'News Alert', 'Technical Indicator']

// Asset types
const assetTypes = ['Stock', 'ETF']

// Account types (French investment accounts)
const accountTypes = [
  { code: 'CTO', name: 'CTO - Compte-Titres Ordinaire', color: '#00ffff' },
  { code: 'PEA', name: 'PEA - Plan d\'Épargne en Actions', color: '#ff00ff' }
]

// Currencies
const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' }
]

// Refreshing state
const isRefreshing = ref(false)
const lastRefresh = ref(new Date())
const refreshErrors = ref([])

// Filtering state
const filterAssetType = ref('All')
const filterAccountType = ref('All')

// Helper function to get last Monday
const getLastMonday = () => {
  const today = new Date()
  const day = today.getDay()
  // If today is Monday (1), go back 7 days to get last Monday
  // Otherwise, calculate days back to this week's Monday
  const diff = day === 1 ? 7 : (day === 0 ? 6 : day - 1)
  const lastMonday = new Date(today)
  lastMonday.setDate(today.getDate() - diff)
  lastMonday.setHours(0, 0, 0, 0)
  return lastMonday
}

// Format date for API call (YYYY-MM-DD)
const formatDateForAPI = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Check if today is Monday
const isMonday = () => {
  return new Date().getDay() === 1
}

// Load alerts from localStorage
const loadAlerts = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('finn-alerts')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Convert date strings back to Date objects
        return parsed.map(alert => ({
          ...alert,
          createdAt: new Date(alert.createdAt)
        }))
      } catch (e) {
        console.error('Error loading alerts:', e)
      }
    }
  }
  return []
}

// Save alerts to localStorage
const saveAlerts = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('finn-alerts', JSON.stringify(alerts.value))
  }
}

// Alerts data
const alerts = ref(loadAlerts())

// UI states
const showAddModal = ref(false)
const isEditMode = ref(false)
const editingAlertId = ref(null)
const isFetchingInfo = ref(false)
const newAlert = ref({
  symbol: '',
  name: '',
  type: 'Price Target',
  condition: 'above',
  targetPrice: 0,
  currentPrice: 0,
  lastMondayPrice: 0,
  currency: 'USD',
  assetType: 'Stock',
  accountType: 'CTO',
  tags: ''
})

// Computed
const activeAlerts = computed(() => alerts.value.filter(a => a.active))
const triggeredAlerts = computed(() => {
  return alerts.value.filter(alert => {
    if (!alert.active) return false
    if (alert.condition === 'above') {
      return alert.currentPrice >= alert.targetPrice
    } else {
      return alert.currentPrice <= alert.targetPrice
    }
  })
})

// Filtered alerts based on selected filters
const filteredAlerts = computed(() => {
  return alerts.value.filter(alert => {
    const assetMatch = filterAssetType.value === 'All' || alert.assetType === filterAssetType.value
    const accountMatch = filterAccountType.value === 'All' || alert.accountType === filterAccountType.value
    return assetMatch && accountMatch
  })
})

// Stats by category
const statsByAssetType = computed(() => {
  const stats = {}
  assetTypes.forEach(type => {
    stats[type] = alerts.value.filter(a => a.assetType === type && a.active).length
  })
  return stats
})

const statsByAccountType = computed(() => {
  const stats = {}
  accountTypes.forEach(acc => {
    stats[acc.code] = alerts.value.filter(a => a.accountType === acc.code && a.active).length
  })
  return stats
})

// Calculate percentage change since last Monday
const getPercentageChange = (alert) => {
  if (!alert.lastMondayPrice || alert.lastMondayPrice === 0) return 0
  const change = ((alert.currentPrice - alert.lastMondayPrice) / alert.lastMondayPrice) * 100
  return change.toFixed(2)
}

// Get price change direction
const getPriceDirection = (alert) => {
  const change = getPercentageChange(alert)
  if (change > 0) return 'up'
  if (change < 0) return 'down'
  return 'neutral'
}

// Get currency symbol
const getCurrencySymbol = (currencyCode) => {
  const currency = currencies.find(c => c.code === currencyCode)
  return currency ? currency.symbol : '$'
}

// Get account type color
const getAccountColor = (accountCode) => {
  const account = accountTypes.find(a => a.code === accountCode)
  return account ? account.color : '#00ffff'
}

// Fetch symbol information
const fetchSymbolInfo = async () => {
  if (!newAlert.value.symbol) return
  
  isFetchingInfo.value = true
  try {
    const response = await $fetch('/api/stock-info', {
      params: { symbol: newAlert.value.symbol }
    })
    
    if (response?.longName) {
      newAlert.value.name = response.longName
    }
  } catch (error) {
    console.error('Failed to fetch symbol info:', error)
  } finally {
    isFetchingInfo.value = false
  }
}

// Refresh all prices (fetch real prices from API)
const refreshPrices = async () => {
  isRefreshing.value = true
  refreshErrors.value = []
  
  const lastMonday = getLastMonday()
  const mondayDateStr = formatDateForAPI(lastMonday)
  
  try {
    // Fetch prices for all alerts
    const pricePromises = alerts.value.map(async (alert) => {
      try {
        // Fetch current price
        const currentResponse = await $fetch('/api/stock-price', {
          params: { symbol: alert.symbol }
        }).catch((err) => {
          console.warn(`Current price unavailable for ${alert.symbol}:`, err.message)
          return null
        })
        
        // Fetch Monday opening price
        const mondayResponse = await $fetch('/api/stock-history', {
          params: { 
            symbol: alert.symbol,
            date: mondayDateStr
          }
        }).catch((err) => {
          console.warn(`Historical price unavailable for ${alert.symbol}:`, err.message)
          return null
        })
        
        if (currentResponse?.price) {
          alert.currentPrice = parseFloat(currentResponse.price.toFixed(2))
        }
        
        if (mondayResponse?.openPrice) {
          alert.lastMondayPrice = parseFloat(mondayResponse.openPrice.toFixed(2))
        }
        
        return { success: true, symbol: alert.symbol }
      } catch (error) {
        console.error(`Failed to fetch price for ${alert.symbol}:`, error)
        refreshErrors.value.push(alert.symbol)
        return { success: false, symbol: alert.symbol, error }
      }
    })
    
    await Promise.all(pricePromises)
    saveAlerts()
    lastRefresh.value = new Date()
  } catch (error) {
    console.error('Error refreshing prices:', error)
  } finally {
    isRefreshing.value = false
  }
}

// Methods
const addAlert = () => {
  if (!newAlert.value.symbol || newAlert.value.targetPrice === null || newAlert.value.targetPrice === undefined || newAlert.value.targetPrice === '') {
    return
  }
  
  if (isEditMode.value && editingAlertId.value) {
    // Update existing alert
    const index = alerts.value.findIndex(a => a.id === editingAlertId.value)
    if (index !== -1) {
      alerts.value[index] = {
        ...alerts.value[index],
        ...newAlert.value,
        currentPrice: parseFloat(newAlert.value.currentPrice || 0),
        lastMondayPrice: parseFloat(newAlert.value.lastMondayPrice || newAlert.value.currentPrice || 0),
      }
    }
  } else {
    // Add new alert
    alerts.value.push({
      id: Date.now(),
      ...newAlert.value,
      currentPrice: parseFloat(newAlert.value.currentPrice || 0),
      lastMondayPrice: parseFloat(newAlert.value.lastMondayPrice || newAlert.value.currentPrice || 0),
      active: true,
      createdAt: new Date()
    })
  }
  
  saveAlerts()
  showAddModal.value = false
  resetNewAlert()
}

const editAlert = (id) => {
  const alert = alerts.value.find(a => a.id === id)
  if (alert) {
    isEditMode.value = true
    editingAlertId.value = id
    newAlert.value = {
      symbol: alert.symbol,
      name: alert.name || '',
      type: alert.type,
      condition: alert.condition,
      targetPrice: alert.targetPrice,
      currentPrice: alert.currentPrice,
      lastMondayPrice: alert.lastMondayPrice,
      currency: alert.currency,
      assetType: alert.assetType,
      accountType: alert.accountType,
      tags: alert.tags || ''
    }
    showAddModal.value = true
  }
}

const deleteAlert = (id) => {
  alerts.value = alerts.value.filter(a => a.id !== id)
  saveAlerts()
}

const toggleAlert = (id) => {
  const alert = alerts.value.find(a => a.id === id)
  if (alert) {
    alert.active = !alert.active
    saveAlerts()
  }
}

const updateMondayPrice = (id) => {
  const alert = alerts.value.find(a => a.id === id)
  if (alert) {
    alert.lastMondayPrice = alert.currentPrice
    saveAlerts()
  }
}

const resetNewAlert = () => {
  isEditMode.value = false
  editingAlertId.value = null
  newAlert.value = {
    symbol: '',
    name: '',
    type: 'Price Target',
    condition: 'above',
    targetPrice: 0,
    currentPrice: 0,
    lastMondayPrice: 0,
    currency: 'USD',
    assetType: 'Stock',
    accountType: 'CTO',
    tags: ''
  }
}

// Format date
const formatDate = (date) => {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="finn-alerts-page">
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1>🔔 Finn Alerts</h1>
          <p class="subtitle">Monitor your investment alerts and notifications</p>
        </div>
        <div class="header-actions">
          <button @click="refreshPrices" class="btn-refresh" :disabled="isRefreshing">
            <span class="refresh-icon" :class="{ spinning: isRefreshing }">🔄</span>
            <span>{{ isRefreshing ? 'Refreshing...' : 'Refresh Prices' }}</span>
          </button>
          <div class="last-refresh">Last updated: {{ formatDate(lastRefresh) }}</div>
          <div v-if="refreshErrors.length > 0" class="refresh-errors">
            ⚠️ Failed to update: {{ refreshErrors.join(', ') }}
          </div>
        </div>
      </div>
    </div>

    <div class="alerts-stats">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-info">
          <div class="stat-value">{{ activeAlerts.length }}</div>
          <div class="stat-label">Active Alerts</div>
        </div>
      </div>
      <div class="stat-card triggered">
        <div class="stat-icon">🚨</div>
        <div class="stat-info">
          <div class="stat-value">{{ triggeredAlerts.length }}</div>
          <div class="stat-label">Triggered</div>
        </div>
      </div>
    </div>

    <div class="filters-bar">
      <div class="filter-group">
        <label>Asset Type:</label>
        <button 
          v-for="type in ['All', ...assetTypes]" 
          :key="type"
          @click="filterAssetType = type"
          class="filter-btn"
          :class="{ active: filterAssetType === type }"
        >
          {{ type }}
        </button>
      </div>
      <div class="filter-group">
        <label>Account:</label>
        <button 
          v-for="acc in ['All', ...accountTypes.map(a => a.code)]" 
          :key="acc"
          @click="filterAccountType = acc"
          class="filter-btn"
          :class="{ active: filterAccountType === acc }"
        >
          {{ acc }}
        </button>
      </div>
    </div>

    <div class="actions-bar">
      <button @click="showAddModal = true" class="btn-primary">
        <span>➕</span> Add New Alert
      </button>
    </div>

    <div class="alerts-grid">
      <div v-for="alert in filteredAlerts" :key="alert.id" class="alert-card" :class="{ inactive: !alert.active, triggered: alert.condition === 'above' ? alert.currentPrice >= alert.targetPrice : alert.currentPrice <= alert.targetPrice }">
        <div class="alert-header">
          <div class="alert-header-left">
            <div class="alert-symbol">{{ alert.symbol }}</div>
            <div v-if="alert.name" class="alert-name">{{ alert.name }}</div>
            <div class="category-badges">
              <span class="asset-badge">{{ alert.assetType }}</span>
              <span class="account-badge" :style="{ borderColor: getAccountColor(alert.accountType), color: getAccountColor(alert.accountType) }">
                {{ alert.accountType }}
              </span>
              <span v-if="alert.tags" class="tags-badge">🏷️ {{ alert.tags }}</span>
            </div>
          </div>
          <div class="alert-type-badge">{{ alert.type }}</div>
        </div>
        
        <div class="price-display">
          <div class="current-price">
            <span class="price-label">Current Price</span>
            <span class="price-value">{{ getCurrencySymbol(alert.currency) }}{{ alert.currentPrice.toFixed(2) }}</span>
          </div>
          <div class="price-change" :class="getPriceDirection(alert)">
            <span class="change-icon">
              {{ getPriceDirection(alert) === 'up' ? '📈' : getPriceDirection(alert) === 'down' ? '📉' : '➡️' }}
            </span>
            <span class="change-value">
              {{ getPercentageChange(alert) > 0 ? '+' : '' }}{{ getPercentageChange(alert) }}%
            </span>
            <span class="change-label">since Monday</span>
          </div>
        </div>
        
        <div class="alert-details">
          <div class="alert-condition">
            <span class="label">Trigger:</span>
            <span class="value">{{ alert.condition === 'above' ? '⬆️' : '⬇️' }} {{ getCurrencySymbol(alert.currency) }}{{ alert.targetPrice }}</span>
          </div>
          <div class="alert-monday">
            <span class="label">Monday Open:</span>
            <span class="value">{{ getCurrencySymbol(alert.currency) }}{{ alert.lastMondayPrice.toFixed(2) }}</span>
          </div>
        </div>

        <div class="alert-footer">
          <button @click="editAlert(alert.id)" class="btn-edit">
            ✏️ Edit
          </button>
          <button @click="toggleAlert(alert.id)" class="btn-toggle" :class="{ active: alert.active }">
            {{ alert.active ? '🔔 Active' : '🔕 Paused' }}
          </button>
          <button @click="deleteAlert(alert.id)" class="btn-delete">
            🗑️ Delete
          </button>
        </div>
      </div>

      <div v-if="alerts.length === 0" class="empty-state">
        <div class="empty-icon">🔔</div>
        <p>No alerts configured yet</p>
        <button @click="showAddModal = true" class="btn-primary">Create Your First Alert</button>
      </div>
    </div>

    <!-- Add Alert Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click="showAddModal = false; resetNewAlert()">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ isEditMode ? 'Edit Alert' : 'Add New Alert' }}</h2>
          <button @click="showAddModal = false; resetNewAlert()" class="btn-close">✕</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>Symbol</label>
            <div class="input-with-button">
              <input v-model="newAlert.symbol" type="text" placeholder="e.g., AAPL, CCJ, EXH1.PA" class="form-input">
              <button @click="fetchSymbolInfo" type="button" class="btn-fetch-info" :disabled="isFetchingInfo || !newAlert.symbol">
                {{ isFetchingInfo ? '⏳' : '🔍' }}
              </button>
            </div>
            <small class="form-hint">💡 Tip: For European stocks, add market suffix (e.g., .PA for Paris, .L for London). Click 🔍 to fetch name.</small>
          </div>
          
          <div v-if="newAlert.name" class="form-group">
            <label>Name (Auto-fetched)</label>
            <input v-model="newAlert.name" type="text" class="form-input" readonly>
          </div>
          
          <div class="form-group">
            <label>Tags / Notes (Optional)</label>
            <input v-model="newAlert.tags" type="text" placeholder="e.g., Tech, Mining, High Risk" class="form-input">
            <small class="form-hint">Add custom tags to organize your alerts</small>
          </div>
          
          <div class="form-group">
            <label>Alert Type</label>
            <select v-model="newAlert.type" class="form-select">
              <option v-for="type in alertTypes" :key="type" :value="type">{{ type }}</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Currency</label>
            <select v-model="newAlert.currency" class="form-select">
              <option v-for="curr in currencies" :key="curr.code" :value="curr.code">
                {{ curr.symbol }} {{ curr.name }} ({{ curr.code }})
              </option>
            </select>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Asset Type</label>
              <select v-model="newAlert.assetType" class="form-select">
                <option v-for="asset in assetTypes" :key="asset" :value="asset">{{ asset }}</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Account Type</label>
              <select v-model="newAlert.accountType" class="form-select">
                <option v-for="acc in accountTypes" :key="acc.code" :value="acc.code">{{ acc.code }}</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Condition</label>
              <select v-model="newAlert.condition" class="form-select">
                <option value="above">Above</option>
                <option value="below">Below</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Target Price</label>
              <input v-model.number="newAlert.targetPrice" type="number" step="0.01" placeholder="0.00" class="form-input">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Current Price</label>
              <input v-model.number="newAlert.currentPrice" type="number" step="0.01" placeholder="0.00" class="form-input">
            </div>
            
            <div class="form-group">
              <label>Monday Open Price (Optional)</label>
              <input v-model.number="newAlert.lastMondayPrice" type="number" step="0.01" placeholder="0.00" class="form-input">
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="showAddModal = false; resetNewAlert()" class="btn-secondary">Cancel</button>
          <button @click="addAlert" class="btn-primary">{{ isEditMode ? 'Update Alert' : 'Add Alert' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.finn-alerts-page {
  padding: 2rem;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 3rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  flex-wrap: wrap;
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

.header-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.btn-refresh {
  background: linear-gradient(135deg, #00ffff, #00cccc);
  color: #0a0a0f;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
}

.btn-refresh:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(0, 255, 255, 0.4);
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-icon {
  font-size: 1.2rem;
  display: inline-block;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.last-refresh {
  font-size: 0.85rem;
  color: #8b8b9f;
  font-style: italic;
}

.refresh-errors {
  font-size: 0.85rem;
  color: #ff0055;
  padding: 0.5rem;
  background: rgba(255, 0, 85, 0.1);
  border-radius: 5px;
  border: 1px solid rgba(255, 0, 85, 0.3);
}

.alerts-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #1e1e3f;
  border-radius: 15px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: all 0.3s ease;
}

.stat-card:hover {
  border-color: #00ffff;
  box-shadow: 0 5px 20px rgba(0, 255, 255, 0.2);
}

.stat-card.triggered {
  border-color: #ff00ff;
  background: linear-gradient(135deg, #2e1a1a 0%, #3e1621 100%);
}

.stat-icon {
  font-size: 3rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #00ffff;
}

.stat-label {
  color: #8b8b9f;
  font-size: 0.9rem;
}

.actions-bar {
  margin-bottom: 2rem;
}

.filters-bar {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  border: 1px solid #1e1e3f;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.filter-group label {
  color: #8b8b9f;
  font-weight: 600;
  font-size: 0.9rem;
}

.filter-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #1e1e3f;
  background: rgba(26, 26, 46, 0.5);
  color: #8b8b9f;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 0.9rem;
}

.filter-btn:hover {
  border-color: #00ffff;
  color: #00ffff;
}

.filter-btn.active {
  background: linear-gradient(135deg, #00ffff, #00cccc);
  color: #0a0a0f;
  border-color: #00ffff;
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
}

.alerts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.alert-card {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #1e1e3f;
  border-radius: 15px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.alert-card:hover {
  border-color: #00ffff;
  box-shadow: 0 5px 20px rgba(0, 255, 255, 0.2);
}

.alert-card.inactive {
  opacity: 0.6;
}

.alert-card.triggered {
  border-color: #ff00ff;
  box-shadow: 0 5px 20px rgba(255, 0, 255, 0.3);
  animation: pulse-alert 2s ease-in-out infinite;
}

@keyframes pulse-alert {
  0%, 100% {
    border-color: #ff00ff;
  }
  50% {
    border-color: #ffff00;
  }
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.alert-header-left {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.alert-symbol {
  font-size: 1.5rem;
  font-weight: 700;
  color: #00ffff;
}

.alert-name {
  font-size: 0.85rem;
  color: #8b8b9f;
  font-style: italic;
  margin-top: 0.25rem;
}

.category-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.asset-badge,
.account-badge,
.tags-badge {
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  border: 1px solid;
  text-transform: uppercase;
}

.asset-badge {
  background: rgba(255, 255, 0, 0.1);
  color: #ffff00;
  border-color: #ffff00;
}

.account-badge {
  background: rgba(0, 255, 255, 0.1);
}

.tags-badge {
  background: rgba(255, 0, 255, 0.1);
  color: #ff00ff;
  border-color: #ff00ff;
  text-transform: none;
}

.alert-type-badge {
  background: rgba(0, 255, 255, 0.1);
  color: #00ffff;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  border: 1px solid #00ffff;
}

.price-display {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid #1e1e3f;
}

.current-price {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.price-label {
  color: #8b8b9f;
  font-size: 0.9rem;
}

.price-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #00ffff;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
}

.price-change {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 8px;
  font-weight: 600;
}

.price-change.up {
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 136, 0.3);
  color: #00ff88;
}

.price-change.down {
  background: rgba(255, 0, 85, 0.1);
  border: 1px solid rgba(255, 0, 85, 0.3);
  color: #ff0055;
}

.price-change.neutral {
  background: rgba(139, 139, 159, 0.1);
  border: 1px solid rgba(139, 139, 159, 0.3);
  color: #8b8b9f;
}

.change-icon {
  font-size: 1rem;
}

.change-value {
  font-size: 1.1rem;
  font-weight: 700;
}

.change-label {
  font-size: 0.8rem;
  opacity: 0.8;
  margin-left: auto;
}

.alert-details {
  margin-bottom: 1rem;
}

.alert-condition,
.alert-monday {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.alert-details .label {
  color: #8b8b9f;
}

.alert-details .value {
  color: #fff;
  font-weight: 600;
}

.alert-footer {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #1e1e3f;
}

.btn-toggle,
.btn-delete,
.btn-edit {
  flex: 1;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-edit {
  background: rgba(0, 255, 255, 0.2);
  color: #00ffff;
}

.btn-edit:hover {
  background: rgba(0, 255, 255, 0.3);
}

.btn-toggle {
  background: rgba(139, 139, 159, 0.2);
  color: #8b8b9f;
}

.btn-toggle.active {
  background: rgba(0, 255, 255, 0.2);
  color: #00ffff;
}

.btn-delete {
  background: rgba(255, 0, 0, 0.1);
  color: #ff4444;
}

.btn-delete:hover {
  background: rgba(255, 0, 0, 0.2);
}

.btn-primary {
  background: linear-gradient(135deg, #00ffff, #00cccc);
  color: #0a0a0f;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(0, 255, 255, 0.4);
}

.btn-secondary {
  background: rgba(139, 139, 159, 0.2);
  color: #8b8b9f;
  border: 1px solid #1e1e3f;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: rgba(139, 139, 159, 0.3);
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state p {
  color: #8b8b9f;
  font-size: 1.2rem;
  margin-bottom: 2rem;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #1e1e3f;
  border-radius: 20px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 255, 255, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #1e1e3f;
}

.modal-header h2 {
  font-size: 1.5rem;
  color: #00ffff;
}

.btn-close {
  background: none;
  border: none;
  color: #8b8b9f;
  font-size: 1.5rem;
  cursor: pointer;
  transition: color 0.3s ease;
}

.btn-close:hover {
  color: #fff;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #8b8b9f;
  font-weight: 500;
}

.form-input,
.form-select {
  width: 100%;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #1e1e3f;
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #00ffff;
  box-shadow: 0 0 0 3px rgba(0, 255, 255, 0.1);
}

.form-hint {
  display: block;
  margin-top: 0.5rem;
  color: #8b8b9f;
  font-size: 0.8rem;
  font-style: italic;
}

.input-with-button {
  display: flex;
  gap: 0.5rem;
}

.input-with-button .form-input {
  flex: 1;
}

.btn-fetch-info {
  padding: 0.75rem 1rem;
  background: rgba(0, 255, 255, 0.2);
  border: 1px solid #00ffff;
  border-radius: 8px;
  color: #00ffff;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1.2rem;
}

.btn-fetch-info:hover:not(:disabled) {
  background: rgba(0, 255, 255, 0.3);
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
}

.btn-fetch-info:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #1e1e3f;
}

.modal-footer .btn-primary,
.modal-footer .btn-secondary {
  flex: 1;
}
</style>
