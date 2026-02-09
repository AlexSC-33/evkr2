<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

interface Crypto {
  symbol: string
  quantity: number
  purchasePrice: number
  purchaseDate: string
  currentPrice?: number
  totalValue?: number
  profitLoss?: number
  profitLossPercent?: number
}

const cryptos = ref<Crypto[]>([])
const isLoading = ref(true)
const isRefreshing = ref(false)

// Form for adding new crypto
const showAddForm = ref(false)
const newCrypto = ref({
  symbol: '',
  quantity: null,
  purchasePrice: null,
  purchaseDate: new Date().toISOString().split('T')[0]
})

// Load cryptos from server
onMounted(async () => {
  await loadCryptos()
})

const loadCryptos = async () => {
  try {
    isLoading.value = true
    const response = await $fetch('/api/user-data')
    
    if (response.portfolios && response.portfolios.length > 0) {
      const cryptoPortfolio = response.portfolios.find((p: any) => p.type === 'crypto')
      if (cryptoPortfolio) {
        cryptos.value = cryptoPortfolio.stocks || []
        await refreshPrices()
      }
    }
  } catch (error) {
    console.error('Erreur chargement Crypto:', error)
  } finally {
    isLoading.value = false
  }
}

const refreshPrices = async () => {
  isRefreshing.value = true
  for (const crypto of cryptos.value) {
    try {
      const priceData = await $fetch(`/api/crypto-price?symbol=${crypto.symbol}`)
      crypto.currentPrice = priceData.price
      crypto.totalValue = crypto.currentPrice * crypto.quantity
      crypto.profitLoss = crypto.totalValue - (crypto.purchasePrice * crypto.quantity)
      crypto.profitLossPercent = ((crypto.currentPrice - crypto.purchasePrice) / crypto.purchasePrice) * 100
    } catch (error) {
      console.error(`Erreur prix pour ${crypto.symbol}:`, error)
      crypto.currentPrice = 0
    }
  }
  isRefreshing.value = false
}

const addCrypto = async () => {
  if (!newCrypto.value.symbol || newCrypto.value.quantity <= 0 || newCrypto.value.purchasePrice <= 0) {
    alert('Veuillez remplir tous les champs correctement')
    return
  }

  // Calculate unit price from total invested amount
  const unitPrice = newCrypto.value.purchasePrice / newCrypto.value.quantity

  cryptos.value.push({
    symbol: newCrypto.value.symbol.toUpperCase(),
    quantity: newCrypto.value.quantity,
    purchasePrice: unitPrice, // Store unit price
    purchaseDate: newCrypto.value.purchaseDate
  })

  await saveCryptos()
  await refreshPrices()

  // Reset form
  newCrypto.value = {
    symbol: '',
    quantity: null,
    purchasePrice: null,
    purchaseDate: new Date().toISOString().split('T')[0]
  }
  showAddForm.value = false
}

const deleteCrypto = async (index: number) => {
  if (confirm('Supprimer cette ligne ?')) {
    cryptos.value.splice(index, 1)
    await saveCryptos()
  }
}

const saveCryptos = async () => {
  try {
    const currentData = await $fetch('/api/user-data')
    
    const portfoliosData = currentData.portfolios || []
    const cryptoIndex = portfoliosData.findIndex((p: any) => p.type === 'crypto')
    
    const cryptoData = {
      id: 'crypto',
      name: 'Crypto',
      type: 'crypto',
      stocks: cryptos.value
    }
    
    if (cryptoIndex >= 0) {
      portfoliosData[cryptoIndex] = cryptoData
    } else {
      portfoliosData.push(cryptoData)
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
  cryptos.value.reduce((sum, c) => sum + (c.purchasePrice * c.quantity), 0)
)

const totalCurrent = computed(() => 
  cryptos.value.reduce((sum, c) => sum + (c.totalValue || 0), 0)
)

const totalProfitLoss = computed(() => totalCurrent.value - totalInvested.value)
const totalProfitLossPercent = computed(() => 
  totalInvested.value > 0 ? (totalProfitLoss.value / totalInvested.value) * 100 : 0
)
</script>

<template>
  <div class="portfolio-page">
    <header class="page-header">
      <div>
        <h1 class="title">₿ Crypto</h1>
        <p class="subtitle">Portefeuille Crypto-monnaies</p>
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
      <h3>Ajouter une crypto</h3>
      <div class="form-grid">
        <input v-model="newCrypto.symbol" type="text" placeholder="Symbol (ex: BTC, ETH)" class="form-input" />
        <input v-model.number="newCrypto.quantity" type="number" step="0.00000001" placeholder="Quantité" class="form-input" />
        <input v-model.number="newCrypto.purchasePrice" type="number" step="0.01" placeholder="Montant total investi ($)" class="form-input" />
        <input v-model="newCrypto.purchaseDate" type="date" class="form-input" />
      </div>
      <div class="form-actions">
        <button @click="addCrypto" class="btn-primary">Ajouter</button>
        <button @click="showAddForm = false" class="btn-secondary">Annuler</button>
      </div>
    </div>

    <!-- Cryptos Table -->
    <div v-if="isLoading" class="loading">Chargement...</div>
    
    <div v-else-if="cryptos.length === 0" class="empty-state">
      <div class="empty-icon">₿</div>
      <p>Aucune crypto dans votre portefeuille</p>
      <button @click="showAddForm = true" class="btn-primary">Ajouter votre première crypto</button>
    </div>

    <div v-else class="stocks-table">
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Quantité</th>
            <th>Prix d'achat</th>
            <th>Prix actuel</th>
            <th>Valeur totale</th>
            <th>Profit/Perte</th>
            <th>%</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(crypto, index) in cryptos" :key="index">
            <td class="symbol">{{ crypto.symbol }}</td>
            <td>{{ crypto.quantity }}</td>
            <td>${{ crypto.purchasePrice.toFixed(2) }}</td>
            <td>${{ crypto.currentPrice?.toFixed(2) || '-' }}</td>
            <td>${{ crypto.totalValue?.toFixed(2) || '-' }}</td>
            <td :class="(crypto.profitLoss || 0) >= 0 ? 'profit' : 'loss'">
              ${{ crypto.profitLoss?.toFixed(2) || '-' }}
            </td>
            <td :class="(crypto.profitLossPercent || 0) >= 0 ? 'profit' : 'loss'">
              {{ crypto.profitLossPercent ? (crypto.profitLossPercent >= 0 ? '+' : '') + crypto.profitLossPercent.toFixed(2) + '%' : '-' }}
            </td>
            <td>{{ new Date(crypto.purchaseDate).toLocaleDateString('fr-FR') }}</td>
            <td>
              <button @click="deleteCrypto(index)" class="delete-btn" title="Supprimer">🗑️</button>
            </td>
          </tr>
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
  color: #ff00ff;
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
  background: linear-gradient(135deg, #ff00ff 0%, #cc00cc 100%);
  color: white;
}

.back-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.refresh-btn:hover, .add-btn:hover, .back-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 0, 255, 0.3);
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
  border: 2px solid #ff00ff;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.add-form h3 {
  color: #ff00ff;
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
  border-color: #ff00ff;
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
  background: linear-gradient(135deg, #ff00ff 0%, #cc00cc 100%);
  color: white;
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

thead {
  background: rgba(255, 0, 255, 0.1);
}

th {
  padding: 1rem;
  text-align: left;
  color: #ff00ff;
  font-weight: 600;
  border-bottom: 2px solid #2d2d4f;
}

td {
  padding: 1rem;
  color: white;
  border-bottom: 1px solid #2d2d4f;
}

tr:hover {
  background: rgba(255, 0, 255, 0.05);
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
</style>
