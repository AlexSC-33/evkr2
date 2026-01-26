import { sanitizeInput, checkRateLimit } from '../utils/security'

// Simple in-memory cache for translations
const translationCache = new Map<string, { text: string, timestamp: number }>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export default defineEventHandler(async (event) => {
  // Rate limiting by IP - more strict for translation
  const clientIp = getRequestHeader(event, 'x-forwarded-for') || 
                   getRequestHeader(event, 'x-real-ip') || 
                   'unknown'
  
  const rateLimit = checkRateLimit(`translate:${clientIp}`, 20, 60000)
  if (!rateLimit.allowed) {
    throw createError({
      statusCode: 429,
      message: 'Too many translation requests. Please try again later.'
    })
  }

  setResponseHeader(event, 'X-RateLimit-Limit', '20')
  setResponseHeader(event, 'X-RateLimit-Remaining', rateLimit.remaining.toString())

  const body = await readBody(event)
  
  // Validate input
  if (!body || typeof body !== 'object') {
    throw createError({
      statusCode: 400,
      message: 'Invalid request body'
    })
  }

  const text = sanitizeInput(String(body.text || ''), 5000)
  const targetLang = sanitizeInput(String(body.targetLang || 'en'), 10).toLowerCase()

  if (!text) {
    throw createError({
      statusCode: 400,
      message: 'Text is required for translation'
    })
  }

  if (text.length < 1 || text.length > 5000) {
    throw createError({
      statusCode: 400,
      message: 'Text must be between 1 and 5000 characters'
    })
  }

  // Validate target language
  const allowedLangs = ['en', 'fr', 'de', 'it', 'es', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar']
  if (!allowedLangs.includes(targetLang)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid target language'
    })
  }

  // Check cache first
  const cacheKey = `${text}-${targetLang}`
  const cached = translationCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('✅ Returning cached translation')
    return {
      translatedText: cached.text,
      originalText: text,
      cached: true
    }
  }

  try {
    // Using MyMemory Translation API (free, no API key required)
    const encodedText = encodeURIComponent(text)
    const apiUrl = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=ko|${targetLang}`
    
    console.log('Calling MyMemory API...')
    const response: any = await $fetch(apiUrl, {
      timeout: 10000
    })
    
    if (response && response.responseData && response.responseData.translatedText) {
      const translatedText = sanitizeInput(response.responseData.translatedText, 10000)
      
      // Cache the result
      translationCache.set(cacheKey, {
        text: translatedText,
        timestamp: Date.now()
      })

      // Limit cache size
      if (translationCache.size > 1000) {
        const oldestKey = translationCache.keys().next().value
        translationCache.delete(oldestKey)
      }

      return {
        translatedText,
        originalText: text
      }
    } else {
      console.warn('Translation failed, returning original text')
      return {
        translatedText: text,
        originalText: text,
        warning: 'Translation service unavailable'
      }
    }
  } catch (error: any) {
    console.error('Translation Error:', error)
    // Fallback: return original text if translation fails
    return {
      translatedText: text,
      originalText: text,
      warning: 'Translation failed, showing original text'
    }
  }
})

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of translationCache.entries()) {
    if (now - value.timestamp >= CACHE_DURATION) {
      translationCache.delete(key)
    }
  }
}, 3600000) // Clean every hour
