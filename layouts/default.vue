<script setup lang="ts">
const route = useRoute()
const router = useRouter()

// Check authentication status
const authCookie = useCookie('auth_session')
const isAuthenticated = computed(() => authCookie.value === 'authenticated')
const isFreeAccess = computed(() => authCookie.value === 'free')

// Show auth modal
const showAuthModal = ref(false)
const redirectPath = ref('')

// Check if auth modal should be shown on mount
onMounted(() => {
  if (route.query.showAuth === 'true') {
    showAuthModal.value = true
    redirectPath.value = (route.query.redirect as string) || ''
  }
})

const handleLogout = () => {
  authCookie.value = null
  router.push('/')
}

const handleLogin = () => {
  showAuthModal.value = true
  redirectPath.value = ''
}

const handleAuthenticated = () => {
  // Cookie is already set in AuthModal component
}
</script>

<template>
  <div class="app-layout">
    <nav class="sidebar">
      <div class="sidebar-content">
        <div class="logo">
          <h1>EVKR2</h1>
        </div>
        <ul class="nav-links">
          <li>
            <NuxtLink to="/" class="nav-item" active-class="active">
              <span class="icon">🏠</span>
              <span>Home</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/news" class="nav-item" active-class="active">
              <span class="icon">📰</span>
              <span>News</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/devops" class="nav-item" active-class="active">
              <span class="icon">🚀</span>
              <span>DevOps</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/finn-2025" class="nav-item" active-class="active">
              <span class="icon">📊</span>
              <span>Finn 2025</span>
              <span v-if="!isAuthenticated" class="lock-badge">🔒</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/sanity" class="nav-item" active-class="active">
              <span class="icon">🔮</span>
              <span>Sanity</span>
              <span v-if="!isAuthenticated" class="lock-badge">🔒</span>
            </NuxtLink>
          </li>
        </ul>
      </div>
      
      <div class="sidebar-footer">
        <div v-if="isAuthenticated" class="auth-status authenticated">
          <span class="status-icon">✓</span>
          <span class="status-text">Premium Access</span>
        </div>
        <div v-else-if="isFreeAccess" class="auth-status free">
          <span class="status-icon">👤</span>
          <span class="status-text">Free Access</span>
        </div>
        
        <button 
          v-if="isAuthenticated || isFreeAccess"
          @click="handleLogout"
          class="auth-btn logout-btn"
        >
          <span class="btn-icon">🚪</span>
          <span>Disconnect</span>
        </button>
        <button 
          v-else
          @click="handleLogin"
          class="auth-btn login-btn"
        >
          <span class="btn-icon">🔑</span>
          <span>Connect</span>
        </button>
      </div>
    </nav>
    <main class="main-content">
      <slot />
    </main>
    
    <AuthModal 
      :show="showAuthModal" 
      :redirect-path="redirectPath"
      @close="showAuthModal = false"
      @authenticated="handleAuthenticated"
    />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: #0a0a0f;
}

.sidebar {
  width: 250px;
  background: linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%);
  border-right: 2px solid #1e1e3f;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
  box-shadow: 4px 0 20px rgba(0, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
}

.sidebar-content {
  flex: 1;
  padding: 2rem 0;
}

.sidebar-footer {
  padding: 1.5rem;
  border-top: 1px solid #1e1e3f;
  background: rgba(0, 0, 0, 0.3);
}

.logo {
  padding: 0 1.5rem;
  margin-bottom: 3rem;
}

.logo h1 {
  font-size: 1.8rem;
  font-weight: 700;
  background: linear-gradient(135deg, #00ffff, #ff00ff, #ffff00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 4px;
  text-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
}

.nav-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-links li {
  margin-bottom: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  color: #8b8b9f;
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
  font-size: 1rem;
  font-weight: 500;
}

.nav-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 3px;
  background: linear-gradient(180deg, #00ffff, #ff00ff);
  transform: scaleY(0);
  transition: transform 0.3s ease;
}

.nav-item:hover {
  color: #00ffff;
  background: rgba(0, 255, 255, 0.05);
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
}

.nav-item:hover::before {
  transform: scaleY(1);
}

.nav-item.active {
  color: #00ffff;
  background: rgba(0, 255, 255, 0.1);
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.7);
}

.nav-item.active::before {
  transform: scaleY(1);
}

.icon {
  font-size: 1.3rem;
  filter: drop-shadow(0 0 5px currentColor);
}

.lock-badge {
  margin-left: auto;
  font-size: 0.9rem;
  opacity: 0.6;
}

.auth-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  font-weight: 600;
}

.auth-status.authenticated {
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 136, 0.3);
  color: #00ff88;
}

.auth-status.free {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #8b8b9f;
}

.status-icon {
  font-size: 1rem;
}

.status-text {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.auth-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.login-btn {
  background: linear-gradient(135deg, #00ffff 0%, #00cccc 100%);
  color: #0a0a0f;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(0, 255, 255, 0.4);
}

.logout-btn {
  background: rgba(255, 0, 85, 0.1);
  border: 1px solid rgba(255, 0, 85, 0.3);
  color: #ff0055;
}

.logout-btn:hover {
  background: rgba(255, 0, 85, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(255, 0, 85, 0.3);
}

.btn-icon {
  font-size: 1rem;
}

.main-content {
  margin-left: 250px;
  flex: 1;
  padding: 2rem;
  background: #0a0a0f;
  min-height: 100vh;
}

/* Scrollbar styling */
.sidebar::-webkit-scrollbar {
  width: 8px;
}

.sidebar::-webkit-scrollbar-track {
  background: #0f0f1a;
}

.sidebar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #00ffff, #ff00ff);
  border-radius: 4px;
}

@media (max-width: 768px) {
  .sidebar {
    width: 80px;
  }
  
  .logo h1 {
    font-size: 1.2rem;
    writing-mode: vertical-rl;
  }
  
  .nav-item span:not(.icon) {
    display: none;
  }
  
  .lock-badge {
    display: none;
  }
  
  .sidebar-footer {
    padding: 1rem 0.5rem;
  }
  
  .auth-status {
    flex-direction: column;
    padding: 0.5rem;
    gap: 0.25rem;
  }
  
  .status-text {
    display: none;
  }
  
  .auth-btn span:not(.btn-icon) {
    display: none;
  }
  
  .auth-btn {
    padding: 0.75rem;
  }
  
  .main-content {
    margin-left: 80px;
  }
}
</style>
