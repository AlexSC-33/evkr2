<script setup lang="ts">
const props = defineProps<{
  show: boolean
  redirectPath?: string
}>()

const emit = defineEmits<{
  close: []
  authenticated: []
}>()

const accessCode = ref('')
const error = ref('')
const isLoading = ref(false)

const handleSubmit = async () => {
  if (!accessCode.value.trim()) {
    error.value = 'Please enter an access code'
    return
  }
  
  isLoading.value = true
  error.value = ''
  
  try {
    // Appel à l'API d'authentification sécurisée
    const response = await $fetch('/api/auth', {
      method: 'POST',
      body: {
        accessCode: accessCode.value
      }
    })
    
    if (response.success) {
      // Authentication réussie
      emit('authenticated')
      emit('close')
      
      // Rediriger vers la page désirée si spécifiée
      if (props.redirectPath) {
        await navigateTo(props.redirectPath)
      }
    } else {
      error.value = response.message || 'Invalid access code'
      accessCode.value = ''
    }
  } catch (err: any) {
    console.error('Authentication error:', err)
    if (err.statusCode === 429) {
      error.value = 'Too many attempts. Please try again later.'
    } else {
      error.value = 'Authentication failed. Please try again.'
    }
    accessCode.value = ''
  } finally {
    isLoading.value = false
  }
}

const handleFreeAccess = () => {
  // Set free access cookie
  const authCookie = useCookie('auth_session', {
    maxAge: 60 * 60 * 24 // 24 hours
  })
  authCookie.value = 'free'
  
  emit('close')
  
  // Redirect to home if trying to access protected page
  if (props.redirectPath) {
    navigateTo('/')
  }
}

const handleClose = () => {
  accessCode.value = ''
  error.value = ''
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="handleClose">
        <div class="modal-container">
          <button class="close-btn" @click="handleClose">✕</button>
          
          <div class="modal-header">
            <div class="lock-icon">🔒</div>
            <h2 class="modal-title">Access Required</h2>
            <p class="modal-subtitle">Enter your access code to unlock premium features</p>
          </div>
          
          <form @submit.prevent="handleSubmit" class="modal-form">
            <div class="form-group">
              <label for="accessCode" class="form-label">Access Code</label>
              <input
                id="accessCode"
                v-model="accessCode"
                type="text"
                placeholder="Enter your access code"
                class="form-input"
                :disabled="isLoading"
                autocomplete="off"
              />
              <Transition name="error">
                <p v-if="error" class="error-message">{{ error }}</p>
              </Transition>
            </div>
            
            <button 
              type="submit" 
              class="submit-btn"
              :disabled="isLoading"
            >
              <span v-if="isLoading" class="spinner"></span>
              <span v-else>Unlock Access</span>
            </button>
            
            <button 
              type="button" 
              class="free-access-btn"
              @click="handleFreeAccess"
              :disabled="isLoading"
            >
              Continue with Free Access
            </button>
          </form>
          
          <div class="modal-footer">
            <p class="footer-text">
              <span class="lock-emoji">🌟</span>
              Premium features: Finn 2025 & Sanity Tracker
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.modal-container {
  position: relative;
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
  border: 2px solid #2d2d4f;
  border-radius: 20px;
  padding: 2.5rem;
  max-width: 450px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 
              0 0 40px rgba(0, 255, 255, 0.1);
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #8b8b9f;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 0, 0, 0.2);
  color: #ff0055;
  transform: rotate(90deg);
}

.modal-header {
  text-align: center;
  margin-bottom: 2rem;
}

.lock-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  animation: lockPulse 2s ease-in-out infinite;
}

@keyframes lockPulse {
  0%, 100% {
    transform: scale(1);
    filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.5));
  }
  50% {
    transform: scale(1.1);
    filter: drop-shadow(0 0 20px rgba(0, 255, 255, 0.8));
  }
}

.modal-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #00ffff;
  text-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
  margin-bottom: 0.5rem;
}

.modal-subtitle {
  font-size: 0.95rem;
  color: #8b8b9f;
  line-height: 1.5;
}

.modal-form {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #00ffff;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.form-input {
  width: 100%;
  padding: 0.875rem 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid #2d2d4f;
  border-radius: 10px;
  color: #ffffff;
  font-size: 1rem;
  transition: all 0.3s ease;
  outline: none;
}

.form-input:focus {
  border-color: #00ffff;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
}

.form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-input::placeholder {
  color: #4a4a5f;
}

.error-message {
  margin-top: 0.5rem;
  color: #ff0055;
  font-size: 0.85rem;
  text-shadow: 0 0 10px rgba(255, 0, 85, 0.5);
}

.submit-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #00ffff 0%, #00cccc 100%);
  border: none;
  border-radius: 10px;
  color: #0a0a0f;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 255, 255, 0.4);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 3px solid rgba(10, 10, 15, 0.3);
  border-top-color: #0a0a0f;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.free-access-btn {
  width: 100%;
  padding: 0.875rem;
  background: transparent;
  border: 2px solid #4a4a5f;
  border-radius: 10px;
  color: #8b8b9f;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.free-access-btn:hover:not(:disabled) {
  border-color: #00ffff;
  color: #00ffff;
  background: rgba(0, 255, 255, 0.1);
}

.free-access-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-footer {
  text-align: center;
  padding-top: 1.5rem;
  border-top: 1px solid #2d2d4f;
}

.footer-text {
  font-size: 0.85rem;
  color: #6b6b7f;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.lock-emoji {
  font-size: 1.2rem;
}

/* Transitions */
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9) translateY(-20px);
}

.error-enter-active, .error-leave-active {
  transition: all 0.3s ease;
}

.error-enter-from, .error-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

@media (max-width: 768px) {
  .modal-container {
    padding: 2rem 1.5rem;
  }
  
  .modal-title {
    font-size: 1.5rem;
  }
  
  .lock-icon {
    font-size: 2.5rem;
  }
}
</style>
