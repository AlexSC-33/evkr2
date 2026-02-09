<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

interface Stock {
  symbol: string
  quantity: number
  purchasePrice: number
  purchaseDate: string
  currentPrice?: number
  totalValue?: number
  profitLoss?: number
  profitLossPercent?: number
}

const stocks = ref<Stock[]>([])
const isLoading = ref(true)
const isRefreshing = ref(false)
const expandedSymbols = ref<Set<string>>(new Set())

// Form for adding new stock
const showAddForm = ref(false)
const newStock = ref({
  symbol: '',
  quantity: null,
  purchasePrice: null,
  purchaseDate: new Date().toISOString().split('T')[0]
})

// Load stocks from server
onMounted(async () => {
  await loadStocks()
})

const loadStocks = async () => {
  try {
    isLoading.value = true
    const response = await $fetch('/api/user-data')
    
    if (response.portfolios && response.portfolios.length > 0) {
      const ctoPortfolio = response.portfolios.find((p: any) => p.type === 'cto')
      if (ctoPortfolio) {
        stocks.value = ctoPortfolio.stocks || []
        await refreshPrices()
      }
    }
  } catch (error) {
    console.error('Erreur chargement CTO:', error)
  } finally {
    isLoading.value = false
  }
}

const refreshPrices = async () => {
  isRefreshing.value = true
  console.log('🔄 Rafraîchissement des prix pour', stocks.value.length, 'actions...')
  
  for (const stock of stocks.value) {
    try {
      console.log(`📊 Récupération du prix pour ${stock.symbol}...`)
      const priceData = await $fetch(`/api/stock-price?symbol=${stock.symbol}`)
      console.log(`✅ ${stock.symbol}: $${priceData.price}`)
      stock.currentPrice = priceData.price
      stock.totalValue = stock.currentPrice * stock.quantity
      stock.profitLoss = stock.totalValue - (stock.purchasePrice * stock.quantity)
      stock.profitLossPercent = ((stock.currentPrice - stock.purchasePrice) / stock.purchasePrice) * 100
    } catch (error) {
      console.error(`❌ Erreur prix pour ${stock.symbol}:`, error)
      // Use purchase price as fallback instead of 0
      stock.currentPrice = stock.purchasePrice
      stock.totalValue = stock.currentPrice * stock.quantity
      stock.profitLoss = 0
      stock.profitLossPercent = 0
    }
  }
  isRefreshing.value = false
  console.log('✅ Rafraîchissement terminé')
}

const addStock = async () => {
  if (!newStock.value.symbol || newStock.value.quantity <= 0 || newStock.value.purchasePrice <= 0) {
    alert('Veuillez remplir tous les champs correctement')
    return
  }

  // Calculate unit price from total invested amount
  const unitPrice = newStock.value.purchasePrice / newStock.value.quantity

  stocks.value.push({
    symbol: newStock.value.symbol.toUpperCase(),
    quantity: newStock.value.quantity,
    purchasePrice: unitPrice, // Store unit price
    purchaseDate: newStock.value.purchaseDate
  })

  await saveStocks()
  await refreshPrices()

  // Reset form
  newStock.value = {
    symbol: '',
    quantity: null,
    purchasePrice: null,
    purchaseDate: new Date().toISOString().split('T')[0]
  }
  showAddForm.value = false
}

const deleteStock = async (index: number) => {
  if (confirm('Supprimer cette ligne ?')) {
    stocks.value.splice(index, 1)
    await saveStocks()
  }
}

const saveStocks = async () => {
  try {
    const currentData = await $fetch('/api/user-data')
    
    const portfoliosData = currentData.portfolios || []
    const ctoIndex = portfoliosData.findIndex((p: any) => p.type === 'cto')
    
    const ctoData = {
      id: 'cto',
      name: 'CTO (Stocks)',
      type: 'cto',
      stocks: stocks.value
    }
    
    if (ctoIndex >= 0) {
      portfoliosData[ctoIndex] = ctoData
    } else {
      portfoliosData.push(ctoData)
    }
    
    await $fetch('/api/user-data', {
      method: 'POST',
      body: {
        ...currentData,
        portfolios: portfoliosData
      }
    })
  } catch (error) {
    console.error('Erreur sauvegarde:', error)
    alert('Erreur lors de la sauvegarde')
  }
}

// Computed totals
const totalInvested = computed(() => 
  stocks.value.reduce((sum, s) => sum + (s.purchasePrice * s.quantity), 0)
)

const totalCurrent = computed(() => 
  stocks.value.reduce((sum, s) => sum + (s.totalValue || 0), 0)
)

const totalProfitLoss = computed(() => totalCurrent.value - totalInvested.value)
const totalProfitLossPercent = computed(() => 
  totalInvested.value > 0 ? (totalProfitLoss.value / totalInvested.value) * 100 : 0
)

// Group stocks by symbol
const groupedStocks = computed(() => {
  const groups = new Map<string, Stock[]>()
  
  stocks.value.forEach(stock => {
    if (!groups.has(stock.symbol)) {
      groups.set(stock.symbol, [])
    }
    groups.get(stock.symbol)!.push(stock)
  })
  
  return Array.from(groups.entries()).map(([symbol, stockList]) => {
    const totalQty = stockList.reduce((sum, s) => sum + s.quantity, 0)
    const totalInvested = stockList.reduce((sum, s) => sum + (s.purchasePrice * s.quantity), 0)
    const totalValue = stockList.reduce((sum, s) => sum + (s.totalValue || 0), 0)
    const profitLoss = totalValue - totalInvested
    const profitLossPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0
    const avgPrice = totalInvested / totalQty
    // Calculate weighted average current price
    const currentPrice = totalQty > 0 ? totalValue / totalQty : 0
    
    return {
      symbol,
      stocks: stockList,
      totalQty,
      avgPrice,
      currentPrice,
      totalInvested,
      totalValue,
      profitLoss,
      profitLossPercent
    }
  })
})

const toggleSymbol = (symbol: string) => {
  if (expandedSymbols.value.has(symbol)) {
    expandedSymbols.value.delete(symbol)
  } else {
    expandedSymbols.value.add(symbol)
  }
}

const deleteStockFromGroup = async (symbol: string, index: number) => {
  if (confirm('Supprimer cette ligne ?')) {
    const allStockIndex = stocks.value.findIndex(s => 
      s.symbol === symbol && 
      s.quantity === groupedStocks.value.find(g => g.symbol === symbol)?.stocks[index].quantity &&
      s.purchaseDate === groupedStocks.value.find(g => g.symbol === symbol)?.stocks[index].purchaseDate
    )
    if (allStockIndex >= 0) {
      stocks.value.splice(allStockIndex, 1)
      await saveStocks()
    }
  }
}
</script>

<template>
  <div class="portfolio-page">
    <header class="page-header">
      <div>
        <h1 class="title">📊 CTO (Stocks)</h1>
        <p class="subtitle">Compte-Titres Ordinaire - Actions internationales</p>
      </div>
      <div class="header-actions">
        <button @click="refreshPrices" class="refresh-btn" :disabled="isRefreshing">
          <span>{{ isRefreshing ? '⏳' : '🔄' }}</span> Actualiser
        </button>
        <button @click="showAddForm = !showAddForm" class="add-btn">
          <span>+</span> Ajouter
        </button>
        <NuxtLink to="/finn" class="back-btn">← Retour</NuxtLink>
      </div>
    </header>

    <!-- Summary Cards -->
    <div class="summary-cards">
      <div class="summary-card">
        <div class="card-label">Investi Total</div>
        <div class="card-value">${{ totalInvested.toFixed(2) }}</div>
      </div>
      <div class="summary-card">
        <div class="card-label">Valeur Actuelle</div>
        <div class="card-value">${{ totalCurrent.toFixed(2) }}</div>
      </div>
      <div class="summary-card" :class="totalProfitLoss >= 0 ? 'profit' : 'loss'">
        <div class="card-label">Profit/Perte</div>
        <div class="card-value">
          ${{ totalProfitLoss.toFixed(2) }}
          <span class="percent">({{ totalProfitLossPercent >= 0 ? '+' : '' }}{{ totalProfitLossPercent.toFixed(2) }}%)</span>
        </div>
      </div>
    </div>

    <!-- Add Form -->
    <div v-if="showAddForm" class="add-form">
      <h3>Ajouter une action</h3>
      <div class="form-grid">
        <input v-model="newStock.symbol" type="text" placeholder="Symbol (ex: AAPL)" class="form-input" />
        <input v-model.number="newStock.quantity" type="number" step="0.00000001" placeholder="Quantité" class="form-input" />
        <input v-model.number="newStock.purchasePrice" type="number" step="0.01" placeholder="Montant total investi ($)" class="form-input" />
        <input v-model="newStock.purchaseDate" type="date" class="form-input" />
      </div>
      <div class="form-actions">
        <button @click="addStock" class="btn-primary">Ajouter</button>
        <button @click="showAddForm = false" class="btn-secondary">Annuler</button>
      </div>
    </div>

    <!-- Stocks Table -->
    <div v-if="isLoading" class="loading">Chargement...</div>
    
    <div v-else-if="stocks.length === 0" class="empty-state">
      <div class="empty-icon">📈</div>
      <p>Aucune action dans votre CTO</p>
      <button @click="showAddForm = true" class="btn-primary">Ajouter votre première action</button>
    </div>

    <div v-else class="stocks-table">
      <table>
        <thead>
          <tr>
            <th style="width: 40px;"></th>
            <th>Symbol</th>
            <th>Quantité</th>
            <th>Prix moyen</th>
            <th>Prix actuel</th>
            <th>Valeur totale</th>
            <th>Profit/Perte</th>
            <th>%</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="group in groupedStocks" :key="group.symbol">
            <!-- Ligne de résumé du groupe -->
            <tr class="group-row" @click="toggleSymbol(group.symbol)">
              <td class="expand-icon">
                {{ expandedSymbols.has(group.symbol) ? '▼' : '▶' }}
              </td>
              <td class="symbol">{{ group.symbol }} <span class="stock-count">({{ group.stocks.length }})</span></td>
              <td><strong>{{ group.totalQty.toFixed(8) }}</strong></td>
              <td>${{ group.avgPrice.toFixed(2) }}</td>
              <td>${{ group.currentPrice?.toFixed(2) || '-' }}</td>
              <td><strong>${{ group.totalValue?.toFixed(2) || '-' }}</strong></td>
              <td :class="(group.profitLoss || 0) >= 0 ? 'profit' : 'loss'">
                <strong>${{ group.profitLoss?.toFixed(2) || '-' }}</strong>
              </td>
              <td :class="(group.profitLossPercent || 0) >= 0 ? 'profit' : 'loss'">
                <strong>{{ group.profitLossPercent ? (group.profitLossPercent >= 0 ? '+' : '') + group.profitLossPercent.toFixed(2) + '%' : '-' }}</strong>
              </td>
              <td>
                <button class="btn-detail" @click.stop="toggleSymbol(group.symbol)" title="Voir les détails">
                  {{ expandedSymbols.has(group.symbol) ? 'Masquer' : 'Détails' }}
                </button>
              </td>
            </tr>
            
            <!-- Lignes détaillées (repliables) -->
            <template v-if="expandedSymbols.has(group.symbol)">
              <tr v-for="(stock, idx) in group.stocks" :key="idx" class="detail-row">
                <td></td>
                <td class="detail-symbol">└ Ligne {{ idx + 1 }}</td>
                <td>{{ stock.quantity }}</td>
                <td>${{ stock.purchasePrice.toFixed(2) }}</td>
                <td>${{ stock.currentPrice?.toFixed(2) || '-' }}</td>
                <td>${{ stock.totalValue?.toFixed(2) || '-' }}</td>
                <td :class="(stock.profitLoss || 0) >= 0 ? 'profit' : 'loss'">
                  ${{ stock.profitLoss?.toFixed(2) || '-' }}
                </td>
                <td :class="(stock.profitLossPercent || 0) >= 0 ? 'profit' : 'loss'">
                  {{ stock.profitLossPercent ? (stock.profitLossPercent >= 0 ? '+' : '') + stock.profitLossPercent.toFixed(2) + '%' : '-' }}
                </td>
                <td>
                  <span class="detail-date">{{ new Date(stock.purchaseDate).toLocaleDateString('fr-FR') }}</span>
                  <button @click.stop="deleteStockFromGroup(group.symbol, idx)" class="delete-btn" title="Supprimer">🗑️</button>
                </td>
              </tr>
            </template>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.portfolio-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.title {
  font-size: 2rem;
  font-weight: bold;
  color: #00ffff;
  margin: 0;
}

.subtitle {
  color: #8b8b9f;
  margin: 0.5rem 0 0 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.refresh-btn, .add-btn, .back-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.refresh-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.add-btn {
  background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
  color: #0a0a1a;
}

.back-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.refresh-btn:hover, .add-btn:hover, .back-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 255, 136, 0.3);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #2d2d4f;
  border-radius: 12px;
  padding: 1.5rem;
}

.summary-card.profit {
  border-color: #00ff88;
}

.summary-card.loss {
  border-color: #ff0055;
}

.card-label {
  color: #8b8b9f;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.card-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: white;
}

.percent {
  font-size: 1rem;
  margin-left: 0.5rem;
}

.add-form {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #00ff88;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.add-form h3 {
  color: #00ff88;
  margin-top: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-input {
  padding: 0.75rem;
  border: 2px solid #2d2d4f;
  background: #0f0f1a;
  color: white;
  border-radius: 8px;
  font-size: 1rem;
}

.form-input:focus {
  outline: none;
  border-color: #00ff88;
}

.form-actions {
  display: flex;
  gap: 1rem;
}

.btn-primary, .btn-secondary {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
  color: #0a0a1a;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.loading, .empty-state {
  text-align: center;
  padding: 4rem;
  color: #8b8b9f;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.stocks-table {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #2d2d4f;
  border-radius: 12px;
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

tr:hover {
  background: rgba(0, 255, 136, 0.05);
}

.group-row {
  cursor: pointer;
  font-weight: 600;
  background: rgba(0, 255, 136, 0.03);
}

.group-row:hover {
  background: rgba(0, 255, 136, 0.08);
}

.expand-icon {
  color: #00ff88;
  font-size: 0.8rem;
  text-align: center;
  cursor: pointer;
}

.stock-count {
  font-size: 0.85rem;
  color: #8b8b9f;
  font-weight: normal;
  margin-left: 0.5rem;
}

.detail-row {
  background: rgba(0, 0, 0, 0.2);
  font-size: 0.9rem;
}

.detail-row:hover {
  background: rgba(0, 255, 136, 0.05);
}

.detail-symbol {
  color: #8b8b9f;
  padding-left: 2rem !important;
}

.detail-date {
  color: #8b8b9f;
  font-size: 0.85rem;
  margin-right: 1rem;
}

.symbol {
  color: #00ff88;
  font-weight: 600;
}

thead {
  background: rgba(0, 255, 136, 0.1);
}

th {
  padding: 1rem;
  text-align: left;
  color: #00ff88;
  font-weight: 600;
  border-bottom: 2px solid #2d2d4f;
}

td {
  padding: 1rem;
  color: white;
  border-bottom: 1px solid #2d2d4f;
}

tr:hover {
  background: rgba(0, 255, 136, 0.05);
}

.symbol {
  font-weight: bold;
  color: #00ffff;
}

.profit {
  color: #00ff88;
}

.loss {
  color: #ff0055;
}

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.delete-btn:hover {
  opacity: 1;
}

.btn-detail {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-detail:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
</style>
