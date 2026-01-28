// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  runtimeConfig: {
    // Private keys (only available on server-side)
    gnewsApiKey: process.env.GNEWS_API_KEY || '',
    authSecret: process.env.AUTH_SECRET || '',
    accessCode: process.env.ACCESS_CODE || '',
    authPasswordHash: process.env.AUTH_PASSWORD_HASH || '',
    premiumUserId: process.env.PREMIUM_USER_ID || '',
    
    // Public keys (exposed to client)
    public: {
      // Add public runtime config here if needed
    }
  },

  // Security headers
  routeRules: {
    '/**': {
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://query1.finance.yahoo.com https://gnews.io https://api.mymemory.translated.net https://aws.amazon.com https://azure.microsoft.com https://cloudblog.withgoogle.com https://www.hashicorp.com https://kubernetes.io https://www.docker.com https://www.cncf.io https://devops.com https://thenewstack.io; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
      }
    }
  },

  // Security configuration
  security: {
    headers: {
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: false,
      originAgentCluster: false,
      xXSSProtection: '1; mode=block',
    }
  }
})
