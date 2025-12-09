// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  runtimeConfig: {
    // Private keys (only available on server-side)
    gnewsApiKey: process.env.GNEWS_API_KEY || 'your_api_key_here',
    
    // Public keys (exposed to client)
    public: {
      // Add public runtime config here if needed
    }
  }
})
