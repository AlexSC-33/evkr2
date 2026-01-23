<script setup>
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  middleware: 'auth'
})

// Portfolio data
const portfolios = ref({
  cto: {
    name: 'CTO (Stocks)',
    assets: [],
    color: '#00ffff'
  },
  pea: {
    name: 'PEA (Actions)',
    assets: [],
    color: '#ffff00'
  },
  crypto: {
    name: 'Crypto',
    assets: [],
    color: '#ff00ff'
  }
})

// UI states
const isLoading = ref(false)
const showAddModal = ref(false)
const currentPortfolio = ref(null)
const newAsset = ref({
  symbol: '',
  name: '',
  quantity: 0,
  buyPrice: 0
})

// Load saved portfolios
onMounted(async () => {
  try {
    // Try to load from new storage key first
    let saved = localStorage.getItem('finn-portfolios')
    
    // If not found, try to migrate from old finn2025-portfolios
    if (!saved) {
      const oldSaved = localStorage.getItem('finn2025-portfolios')
      if (oldSaved) {
        console.log('Migrating data from finn2025-portfolios...')
        const oldData = JSON.parse(oldSaved)
        
        // Migrate only CTO and Crypto portfolios (exclude bot)
        portfolios.value.cto = oldData.cto || portfolios.value.cto
        portfolios.value.crypto = oldData.crypto || portfolios.value.crypto
        // PEA is already initialized in the ref
        
        // Save to new storage location
        savePortfolios()
        console.log('Migration completed successfully!')
      }
    } else {
      const loadedData = JSON.parse(saved)
      // Ensure all portfolios exist, merge with defaults
      portfolios.value.cto = loadedData.cto || portfolios.value.cto
      portfolios.value.pea = loadedData.pea || portfolios.value.pea
      portfolios.value.crypto = loadedData.crypto || portfolios.value.crypto
    }
  } catch (error) {
    console.error('Failed to load portfolios:', error)
  }
})

// Save portfolios
const savePortfolios = () => {
  localStorage.setItem('finn-portfolios', JSON.stringify(portfolios.value))
}

// Group assets by symbol for better display
const groupedCTOAssets = computed(() => {
  const assets = portfolios.value.cto.assets
  if (!assets || assets.length === 0) return []

  const grouped = {}
  
  assets.forEach((asset, index) => {
    if (!grouped[asset.symbol]) {
      grouped[asset.symbol] = {
        symbol: asset.symbol,
        name: asset.name,
        positions: [],
        totalQuantity: 0,
        totalInvested: 0,
        currentValue: 0,
        avgBuyPrice: 0,
        currentPrice: asset.currentPrice || asset.buyPrice
      }
    }
    
    const invested = asset.quantity * asset.buyPrice
    const currentVal = asset.quantity * (asset.currentPrice || asset.buyPrice)
    
    grouped[asset.symbol].positions.push({
      index: index,
      quantity: asset.quantity,
      buyPrice: asset.buyPrice,
      invested: invested,
      currentValue: currentVal
    })
    
    grouped[asset.symbol].totalQuantity += asset.quantity
    grouped[asset.symbol].totalInvested += invested
    grouped[asset.symbol].currentValue += currentVal
    grouped[asset.symbol].currentPrice = asset.currentPrice || asset.buyPrice
  })

  // Calculate average buy price
  Object.values(grouped).forEach(group => {
    group.avgBuyPrice = group.totalInvested / group.totalQuantity
    group.profit = group.currentValue - group.totalInvested
    group.profitPercent = (group.profit / group.totalInvested) * 100
  })

  return Object.values(grouped)
})

// Group PEA assets by symbol for better display
const groupedPEAAssets = computed(() => {
  const assets = portfolios.value.pea.assets
  if (!assets || assets.length === 0) return []

  const grouped = {}
  
  assets.forEach((asset, index) => {
    if (!grouped[asset.symbol]) {
      grouped[asset.symbol] = {
        symbol: asset.symbol,
        name: asset.name,
        positions: [],
        totalQuantity: 0,
        totalInvested: 0,
        currentValue: 0,
        avgBuyPrice: 0,
        currentPrice: asset.currentPrice || asset.buyPrice
      }
    }
    
    const invested = asset.quantity * asset.buyPrice
    const currentVal = asset.quantity * (asset.currentPrice || asset.buyPrice)
    
    grouped[asset.symbol].positions.push({
      index: index,
      quantity: asset.quantity,
      buyPrice: asset.buyPrice,
      invested: invested,
      currentValue: currentVal
    })
    
    grouped[asset.symbol].totalQuantity += asset.quantity
    grouped[asset.symbol].totalInvested += invested
    grouped[asset.symbol].currentValue += currentVal
    grouped[asset.symbol].currentPrice = asset.currentPrice || asset.buyPrice
  })

  // Calculate average buy price
  Object.values(grouped).forEach(group => {
    group.avgBuyPrice = group.totalInvested / group.totalQuantity
    group.profit = group.currentValue - group.totalInvested
    group.profitPercent = (group.profit / group.totalInvested) * 100
  })

  return Object.values(grouped)
})

// Calculate total stats for each portfolio
const calculateStats = (portfolio) => {
  if (!portfolio.assets || portfolio.assets.length === 0) {
    return {
      totalInvested: 0,
      currentValue: 0,
      profit: 0,
      profitPercent: 0
    }
  }

  const totalInvested = portfolio.assets.reduce((sum, asset) => {
    return sum + (asset.quantity * asset.buyPrice)
  }, 0)

  const currentValue = portfolio.assets.reduce((sum, asset) => {
    return sum + (asset.quantity * (asset.currentPrice || asset.buyPrice))
  }, 0)

  const profit = currentValue - totalInvested
  const profitPercent = totalInvested > 0 ? (profit / totalInvested) * 100 : 0

  return {
    totalInvested,
    currentValue,
    profit,
    profitPercent
  }
}

// Refresh prices from APIs
const refreshPrices = async () => {
  isLoading.value = true
  try {
    // Refresh crypto prices
    await refreshCryptoPrices()
    // Refresh stock prices
    await refreshStockPrices()
    
    savePortfolios()
  } catch (error) {
    console.error('Failed to refresh prices:', error)
  } finally {
    isLoading.value = false
  }
}

// Refresh crypto prices using CoinGecko API
const refreshCryptoPrices = async () => {
  const cryptoAssets = portfolios.value.crypto.assets
  if (cryptoAssets.length === 0) return

  const symbols = cryptoAssets.map(a => a.symbol.toLowerCase()).join(',')
  
  try {
    const response = await $fetch(`https://api.coingecko.com/api/v3/simple/price`, {
      params: {
        ids: symbols,
        vs_currencies: 'usd'
      }
    })

    cryptoAssets.forEach(asset => {
      const symbolLower = asset.symbol.toLowerCase()
      if (response[symbolLower]) {
        asset.currentPrice = response[symbolLower].usd
      }
    })
  } catch (error) {
    console.error('Failed to fetch crypto prices:', error)
  }
}

// Refresh stock prices using server proxy
const refreshStockPrices = async () => {
  const stockAssets = [...portfolios.value.cto.assets, ...portfolios.value.pea.assets]
  if (stockAssets.length === 0) return

  for (const asset of stockAssets) {
    try {
      console.log(`Fetching price for ${asset.symbol}...`)
      const response = await $fetch('/api/stock-price', {
        params: {
          symbol: asset.symbol
        }
      })

      if (response?.price) {
        const newPrice = response.price
        console.log(`${asset.symbol}: $${asset.currentPrice.toFixed(2)} → $${newPrice.toFixed(2)}`)
        asset.currentPrice = newPrice
      }
    } catch (error) {
      console.error(`Failed to fetch price for ${asset.symbol}:`, error)
      alert(`Could not fetch price for ${asset.symbol}. Please try again.`)
    }
  }
}

// Open add asset modal
const openAddModal = (portfolioKey) => {
  currentPortfolio.value = portfolioKey
  newAsset.value = {
    symbol: '',
    name: '',
    quantity: 0,
    buyPrice: 0
  }
  showAddModal.value = true
}

// Add asset to portfolio
const addAsset = () => {
  if (!newAsset.value.symbol || newAsset.value.quantity <= 0 || newAsset.value.buyPrice <= 0) {
    alert('Please fill all fields correctly')
    return
  }

  // Calculate price per share from total investment
  const pricePerShare = parseFloat(newAsset.value.buyPrice) / parseFloat(newAsset.value.quantity)

  const asset = {
    symbol: newAsset.value.symbol.toUpperCase(),
    name: newAsset.value.name || newAsset.value.symbol.toUpperCase(),
    quantity: parseFloat(newAsset.value.quantity),
    buyPrice: pricePerShare,
    currentPrice: pricePerShare,
    addedAt: new Date().toISOString()
  }

  portfolios.value[currentPortfolio.value].assets.push(asset)
  savePortfolios()
  showAddModal.value = false
}

// Remove asset
const removeAsset = (portfolioKey, index) => {
  if (confirm('Remove this asset?')) {
    // Ensure the portfolio exists and has assets
    if (portfolios.value[portfolioKey] && portfolios.value[portfolioKey].assets) {
      portfolios.value[portfolioKey].assets.splice(index, 1)
      savePortfolios()
      // Force refresh of computed properties
      nextTick()
    }
  }
}

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value)
}

// Format percentage
const formatPercent = (value) => {
  return (value >= 0 ? '+' : '') + value.toFixed(2) + '%'
}

// Calculate overall portfolio stats
const overallStats = computed(() => {
  let totalInvested = 0
  let currentValue = 0

  // Add CTO stats
  const ctoStats = calculateStats(portfolios.value.cto)
  totalInvested += ctoStats.totalInvested
  currentValue += ctoStats.currentValue

  // Add PEA stats
  const peaStats = calculateStats(portfolios.value.pea)
  totalInvested += peaStats.totalInvested
  currentValue += peaStats.currentValue

  // Add Crypto stats
  const cryptoStats = calculateStats(portfolios.value.crypto)
  totalInvested += cryptoStats.totalInvested
  currentValue += cryptoStats.currentValue

  const profit = currentValue - totalInvested
  const profitPercent = totalInvested > 0 ? (profit / totalInvested) * 100 : 0

  return {
    totalInvested,
    currentValue,
    profit,
    profitPercent
  }
})
</script>

<template>
  <div class="finn-page">
    <header class="page-header">
      <div class="header-content">
        <div>
          <h1 class="page-title">Finn</h1>
          <p class="page-subtitle">Your Financial Performance Tracker</p>
        </div>
        <button 
          class="refresh-btn" 
          @click="refreshPrices"
          :disabled="isLoading"
        >
          <span class="icon">{{ isLoading ? '⏳' : '🔄' }}</span>
          <span>{{ isLoading ? 'Updating...' : 'Refresh Prices' }}</span>
        </button>
      </div>

      <!-- Overall Stats -->
      <div class="overall-stats">
        <div class="stat-card">
          <span class="stat-label">Total Invested</span>
          <span class="stat-value">{{ formatCurrency(overallStats.totalInvested) }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Current Value</span>
          <span class="stat-value">{{ formatCurrency(overallStats.currentValue) }}</span>
        </div>
        <div class="stat-card" :class="{ profit: overallStats.profit >= 0, loss: overallStats.profit < 0 }">
          <span class="stat-label">Profit/Loss</span>
          <span class="stat-value">{{ formatCurrency(overallStats.profit) }}</span>
          <span class="stat-percent">{{ formatPercent(overallStats.profitPercent) }}</span>
        </div>
      </div>
    </header>

    <!-- Portfolios Grid -->
    <div class="portfolios-grid">
      <!-- CTO Portfolio -->
      <div class="portfolio-card" :style="{ '--card-color': portfolios.cto.color }">
        <div class="card-header">
          <h2>{{ portfolios.cto.name }}</h2>
          <button class="add-btn" @click="openAddModal('cto')">+ Add Stock</button>
        </div>

        <div class="portfolio-stats">
          <div class="stat">
            <span class="label">Invested:</span>
            <span class="value">{{ formatCurrency(calculateStats(portfolios.cto).totalInvested) }}</span>
          </div>
          <div class="stat">
            <span class="label">Current:</span>
            <span class="value">{{ formatCurrency(calculateStats(portfolios.cto).currentValue) }}</span>
          </div>
          <div class="stat" :class="{ profit: calculateStats(portfolios.cto).profit >= 0, loss: calculateStats(portfolios.cto).profit < 0 }">
            <span class="label">P&L:</span>
            <span class="value">{{ formatPercent(calculateStats(portfolios.cto).profitPercent) }}</span>
          </div>
        </div>

        <div class="assets-list">
          <div v-if="portfolios.cto.assets.length === 0" class="empty-state">
            No stocks added yet
          </div>
          
          <!-- Grouped Stock Display -->
          <div v-for="group in groupedCTOAssets" :key="group.symbol" class="stock-group">
            <div class="stock-group-header">
              <div class="stock-main-info">
                <span class="stock-symbol">{{ group.symbol }}</span>
                <span class="stock-name">{{ group.name }}</span>
              </div>
              <div class="stock-summary">
                <div class="summary-item">
                  <span class="summary-label">Total Shares</span>
                  <span class="summary-value">{{ group.totalQuantity.toFixed(4) }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Avg Buy Price</span>
                  <span class="summary-value">{{ formatCurrency(group.avgBuyPrice) }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Current Price</span>
                  <span class="summary-value">{{ formatCurrency(group.currentPrice) }}</span>
                </div>
              </div>
            </div>

            <div class="stock-totals">
              <div class="total-item">
                <span class="total-label">Total Invested</span>
                <span class="total-value">{{ formatCurrency(group.totalInvested) }}</span>
              </div>
              <div class="total-item">
                <span class="total-label">Current Value</span>
                <span class="total-value">{{ formatCurrency(group.currentValue) }}</span>
              </div>
              <div class="total-item highlight" :class="{ profit: group.profit >= 0, loss: group.profit < 0 }">
                <span class="total-label">Profit/Loss</span>
                <div class="pl-values">
                  <span class="pl-amount">{{ formatCurrency(group.profit) }}</span>
                  <span class="pl-percent">{{ formatPercent(group.profitPercent) }}</span>
                </div>
              </div>
            </div>

            <!-- Individual Positions -->
            <div v-if="group.positions.length > 1" class="positions-toggle">
              <details>
                <summary>{{ group.positions.length }} positions • Click to expand</summary>
                <div class="positions-list">
                  <div v-for="position in group.positions" :key="position.index" class="position-item">
                    <div class="position-info">
                      <span class="position-qty">{{ position.quantity.toFixed(4) }} shares @ {{ formatCurrency(position.buyPrice) }}</span>
                      <span class="position-invested">Invested: {{ formatCurrency(position.invested) }}</span>
                    </div>
                    <button class="remove-btn-small" @click="removeAsset('cto', position.index)">×</button>
                  </div>
                </div>
              </details>
            </div>
            <div v-else class="single-position-actions">
              <button class="remove-btn-inline" @click="removeAsset('cto', group.positions[0].index)">Remove Position</button>
            </div>
          </div>
        </div>
      </div>

      <!-- PEA Portfolio -->
      <div class="portfolio-card" :style="{ '--card-color': portfolios.pea.color }">
        <div class="card-header">
          <h2>{{ portfolios.pea.name }}</h2>
          <button class="add-btn" @click="openAddModal('pea')">+ Add Stock</button>
        </div>

        <div class="portfolio-stats">
          <div class="stat">
            <span class="label">Invested:</span>
            <span class="value">{{ formatCurrency(calculateStats(portfolios.pea).totalInvested) }}</span>
          </div>
          <div class="stat">
            <span class="label">Current:</span>
            <span class="value">{{ formatCurrency(calculateStats(portfolios.pea).currentValue) }}</span>
          </div>
          <div class="stat" :class="{ profit: calculateStats(portfolios.pea).profit >= 0, loss: calculateStats(portfolios.pea).profit < 0 }">
            <span class="label">P&L:</span>
            <span class="value">{{ formatPercent(calculateStats(portfolios.pea).profitPercent) }}</span>
          </div>
        </div>

        <div class="assets-list">
          <div v-if="portfolios.pea.assets.length === 0" class="empty-state">
            No stocks added yet
          </div>
          
          <!-- Grouped Stock Display -->
          <div v-for="group in groupedPEAAssets" :key="group.symbol" class="stock-group">
            <div class="stock-group-header">
              <div class="stock-main-info">
                <span class="stock-symbol">{{ group.symbol }}</span>
                <span class="stock-name">{{ group.name }}</span>
              </div>
              <div class="stock-summary">
                <div class="summary-item">
                  <span class="summary-label">Total Shares</span>
                  <span class="summary-value">{{ group.totalQuantity.toFixed(4) }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Avg Buy Price</span>
                  <span class="summary-value">{{ formatCurrency(group.avgBuyPrice) }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Current Price</span>
                  <span class="summary-value">{{ formatCurrency(group.currentPrice) }}</span>
                </div>
              </div>
            </div>

            <div class="stock-totals">
              <div class="total-item">
                <span class="total-label">Total Invested</span>
                <span class="total-value">{{ formatCurrency(group.totalInvested) }}</span>
              </div>
              <div class="total-item">
                <span class="total-label">Current Value</span>
                <span class="total-value">{{ formatCurrency(group.currentValue) }}</span>
              </div>
              <div class="total-item highlight" :class="{ profit: group.profit >= 0, loss: group.profit < 0 }">
                <span class="total-label">Profit/Loss</span>
                <div class="pl-values">
                  <span class="pl-amount">{{ formatCurrency(group.profit) }}</span>
                  <span class="pl-percent">{{ formatPercent(group.profitPercent) }}</span>
                </div>
              </div>
            </div>

            <!-- Individual Positions -->
            <div v-if="group.positions.length > 1" class="positions-toggle">
              <details>
                <summary>{{ group.positions.length }} positions • Click to expand</summary>
                <div class="positions-list">
                  <div v-for="position in group.positions" :key="position.index" class="position-item">
                    <div class="position-info">
                      <span class="position-qty">{{ position.quantity.toFixed(4) }} shares @ {{ formatCurrency(position.buyPrice) }}</span>
                      <span class="position-invested">Invested: {{ formatCurrency(position.invested) }}</span>
                    </div>
                    <button class="remove-btn-small" @click="removeAsset('pea', position.index)">×</button>
                  </div>
                </div>
              </details>
            </div>
            <div v-else class="single-position-actions">
              <button class="remove-btn-inline" @click="removeAsset('pea', group.positions[0].index)">Remove Position</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Crypto Portfolio -->
      <div class="portfolio-card" :style="{ '--card-color': portfolios.crypto.color }">
        <div class="card-header">
          <h2>{{ portfolios.crypto.name }}</h2>
          <button class="add-btn" @click="openAddModal('crypto')">+ Add Crypto</button>
        </div>

        <div class="portfolio-stats">
          <div class="stat">
            <span class="label">Invested:</span>
            <span class="value">{{ formatCurrency(calculateStats(portfolios.crypto).totalInvested) }}</span>
          </div>
          <div class="stat">
            <span class="label">Current:</span>
            <span class="value">{{ formatCurrency(calculateStats(portfolios.crypto).currentValue) }}</span>
          </div>
          <div class="stat" :class="{ profit: calculateStats(portfolios.crypto).profit >= 0, loss: calculateStats(portfolios.crypto).profit < 0 }">
            <span class="label">P&L:</span>
            <span class="value">{{ formatPercent(calculateStats(portfolios.crypto).profitPercent) }}</span>
          </div>
        </div>

        <div class="assets-list">
          <div v-if="portfolios.crypto.assets.length === 0" class="empty-state">
            No crypto added yet
          </div>
          <div v-for="(asset, index) in portfolios.crypto.assets" :key="index" class="asset-item">
            <div class="asset-info">
              <span class="asset-symbol">{{ asset.symbol }}</span>
              <span class="asset-name">{{ asset.name }}</span>
            </div>
            <div class="asset-details">
              <div class="detail-row">
                <span class="quantity">{{ asset.quantity }} coins for {{ formatCurrency(asset.quantity * asset.buyPrice) }}</span>
              </div>
              <div class="detail-row">
                <span class="current-price">Current: {{ formatCurrency(asset.currentPrice || asset.buyPrice) }}/coin</span>
                <span class="current-total">Value: {{ formatCurrency(asset.quantity * (asset.currentPrice || asset.buyPrice)) }}</span>
              </div>
              <div class="detail-row profit-row">
                <span 
                  class="asset-pl" 
                  :class="{ profit: (asset.quantity * (asset.currentPrice || asset.buyPrice)) >= (asset.quantity * asset.buyPrice), loss: (asset.quantity * (asset.currentPrice || asset.buyPrice)) < (asset.quantity * asset.buyPrice) }"
                >
                  {{ formatPercent(((asset.quantity * (asset.currentPrice || asset.buyPrice)) - (asset.quantity * asset.buyPrice)) / (asset.quantity * asset.buyPrice) * 100) }}
                </span>
                <span 
                  class="profit-amount"
                  :class="{ profit: (asset.quantity * (asset.currentPrice || asset.buyPrice)) >= (asset.quantity * asset.buyPrice), loss: (asset.quantity * (asset.currentPrice || asset.buyPrice)) < (asset.quantity * asset.buyPrice) }"
                >
                  {{ formatCurrency((asset.quantity * (asset.currentPrice || asset.buyPrice)) - (asset.quantity * asset.buyPrice)) }}
                </span>
              </div>
            </div>
            <button class="remove-btn" @click="removeAsset('crypto', index)">×</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Asset Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal">
        <h3>Add New Asset</h3>
        <form @submit.prevent="addAsset">
          <div class="form-group">
            <label>Symbol (e.g., AAPL, bitcoin)</label>
            <input v-model="newAsset.symbol" type="text" placeholder="BTC, AAPL, etc." required>
            <small v-if="currentPortfolio === 'crypto'">Use CoinGecko ID (e.g., bitcoin, ethereum, solana)</small>
          </div>
          <div class="form-group">
            <label>Name (optional)</label>
            <input v-model="newAsset.name" type="text" placeholder="Asset name">
          </div>
          <div class="form-group">
            <label>Quantity</label>
            <input v-model="newAsset.quantity" type="number" step="any" placeholder="1.992" required>
          </div>
          <div class="form-group">
            <label>Total Investment (USD)</label>
            <input v-model="newAsset.buyPrice" type="number" step="any" placeholder="437.00" required>
            <small>Enter the total amount you paid (e.g., $437 for 1.992 shares)</small>
          </div>
          <div class="modal-actions">
            <button type="button" class="cancel-btn" @click="showAddModal = false">Cancel</button>
            <button type="submit" class="submit-btn">Add Asset</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.finn-page {
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

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #00ffff, #ff00ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  color: #8b8b9f;
  font-size: 1.1rem;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.refresh-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.overall-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
  border: 2px solid #1e1e3f;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-card.profit {
  border-color: #00ff88;
}

.stat-card.loss {
  border-color: #ff0055;
}

.stat-label {
  color: #8b8b9f;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stat-value {
  color: #ffffff;
  font-size: 1.8rem;
  font-weight: 700;
}

.stat-percent {
  color: #00ff88;
  font-size: 1.2rem;
  font-weight: 600;
}

.stat-card.loss .stat-percent {
  color: #ff0055;
}

.portfolios-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}

.portfolio-card {
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
  border: 2px solid #1e1e3f;
  border-radius: 16px;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
}

.portfolio-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--card-color);
  box-shadow: 0 0 20px var(--card-color);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.card-header h2 {
  font-size: 1.5rem;
  color: var(--card-color);
  text-shadow: 0 0 10px var(--card-color);
}

.add-btn {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--card-color);
  border-radius: 6px;
  color: var(--card-color);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.add-btn:hover {
  background: var(--card-color);
  color: #0a0a0f;
  box-shadow: 0 0 15px var(--card-color);
}

.portfolio-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #1e1e3f;
}

.portfolio-stats .stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.portfolio-stats .label {
  color: #6b6b7f;
  font-size: 0.8rem;
}

.portfolio-stats .value {
  color: #ffffff;
  font-size: 1.1rem;
  font-weight: 600;
}

.portfolio-stats .stat.profit .value {
  color: #00ff88;
}

.portfolio-stats .stat.loss .value {
  color: #ff0055;
}

.assets-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 500px;
  overflow-y: auto;
}

.empty-state {
  text-align: center;
  color: #6b6b7f;
  padding: 2rem;
  font-style: italic;
}

/* Grouped Stock Display */
.stock-group {
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid #1e1e3f;
  border-radius: 12px;
  padding: 1.25rem;
  transition: all 0.3s ease;
}

.stock-group:hover {
  border-color: var(--card-color);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
}

.stock-group-header {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #1e1e3f;
}

.stock-main-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.stock-symbol {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 0 10px var(--card-color);
}

.stock-name {
  color: #8b8b9f;
  font-size: 1rem;
}

.stock-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.summary-label {
  color: #6b6b7f;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-value {
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
}

.stock-totals {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.total-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.total-item.highlight {
  padding: 0.5rem;
  border-radius: 6px;
}

.total-item.highlight.profit {
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid #00ff88;
}

.total-item.highlight.loss {
  background: rgba(255, 0, 85, 0.1);
  border: 1px solid #ff0055;
}

.total-label {
  color: #8b8b9f;
  font-size: 0.8rem;
  text-transform: uppercase;
}

.total-value {
  color: #ffffff;
  font-size: 1.1rem;
  font-weight: 600;
}

.pl-values {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.pl-amount {
  font-size: 1.2rem;
  font-weight: 700;
}

.profit .pl-amount,
.profit .pl-percent {
  color: #00ff88;
}

.loss .pl-amount,
.loss .pl-percent {
  color: #ff0055;
}

.pl-percent {
  font-size: 1rem;
  font-weight: 600;
}

.positions-toggle {
  margin-top: 0.75rem;
}

.positions-toggle details {
  cursor: pointer;
}

.positions-toggle summary {
  color: #8b8b9f;
  font-size: 0.85rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  list-style: none;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.positions-toggle summary:hover {
  background: rgba(0, 0, 0, 0.4);
  color: #ffffff;
}

.positions-toggle summary::before {
  content: '▶';
  margin-right: 0.5rem;
  transition: transform 0.3s ease;
}

.positions-toggle details[open] summary::before {
  transform: rotate(90deg);
}

.positions-list {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.position-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  font-size: 0.85rem;
}

.position-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.position-qty {
  color: #ffffff;
  font-weight: 500;
}

.position-invested {
  color: #8b8b9f;
  font-size: 0.8rem;
}

.remove-btn-small {
  width: 24px;
  height: 24px;
  background: rgba(255, 0, 85, 0.2);
  border: 1px solid #ff0055;
  border-radius: 50%;
  color: #ff0055;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  transition: all 0.3s ease;
}

.remove-btn-small:hover {
  background: #ff0055;
  color: white;
}

.single-position-actions {
  margin-top: 0.75rem;
}

.remove-btn-inline {
  width: 100%;
  padding: 0.5rem;
  background: rgba(255, 0, 85, 0.1);
  border: 1px solid #ff0055;
  border-radius: 6px;
  color: #ff0055;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.remove-btn-inline:hover {
  background: #ff0055;
  color: white;
}

/* Asset Item Styles */
.asset-item {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #1e1e3f;
  border-radius: 8px;
  padding: 1rem;
  position: relative;
  transition: all 0.3s ease;
}

.asset-item:hover {
  border-color: var(--card-color);
  transform: translateX(5px);
}

.asset-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.asset-symbol {
  font-size: 1.2rem;
  font-weight: 700;
  color: #ffffff;
}

.asset-name {
  color: #8b8b9f;
  font-size: 0.9rem;
}

.asset-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
}

.detail-row.profit-row {
  padding-top: 0.5rem;
  border-top: 1px solid #1e1e3f;
  margin-top: 0.25rem;
}

.asset-details span {
  color: #8b8b9f;
}

.invested-amount,
.current-total {
  font-weight: 600;
  color: #ffffff;
}

.asset-pl {
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.95rem;
}

.asset-pl.profit {
  color: #00ff88;
  background: rgba(0, 255, 136, 0.1);
}

.asset-pl.loss {
  color: #ff0055;
  background: rgba(255, 0, 85, 0.1);
}

.profit-amount {
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.95rem;
}

.profit-amount.profit {
  color: #00ff88;
  background: rgba(0, 255, 136, 0.1);
}

.profit-amount.loss {
  color: #ff0055;
  background: rgba(255, 0, 85, 0.1);
}

.remove-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 24px;
  height: 24px;
  background: rgba(255, 0, 85, 0.2);
  border: 1px solid #ff0055;
  border-radius: 50%;
  color: #ff0055;
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  transition: all 0.3s ease;
}

.remove-btn:hover {
  background: #ff0055;
  color: white;
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
  animation: fadeIn 0.3s ease;
}

.modal {
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
  border: 2px solid #1e1e3f;
  border-radius: 16px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal h3 {
  font-size: 1.5rem;
  color: #00ffff;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  color: #8b8b9f;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.form-group small {
  display: block;
  color: #6b6b7f;
  font-size: 0.8rem;
  margin-top: 0.25rem;
  font-style: italic;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #1e1e3f;
  border-radius: 8px;
  color: #ffffff;
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: #00ffff;
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.cancel-btn,
.submit-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.05);
  color: #8b8b9f;
  border: 1px solid #1e1e3f;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.submit-btn {
  background: linear-gradient(135deg, #00ffff 0%, #00cccc 100%);
  color: #0a0a0f;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 255, 255, 0.4);
}

@media (max-width: 768px) {
  .portfolios-grid {
    grid-template-columns: 1fr;
  }

  .asset-details {
    grid-template-columns: 1fr;
  }

  .asset-pl {
    grid-column: span 1;
  }
}
</style>
