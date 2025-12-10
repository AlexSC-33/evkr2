// Simple in-memory cache for translations
const translationCache = new Map<string, { text: string, timestamp: number }>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

// Rate limiting
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1000 // 1 second between requests

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { text, targetLang = 'en' } = body

  if (!text) {
    return {
      error: 'No text provided',
      message: 'Text is required for translation'
    }
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
    // Rate limiting: wait if requests are too frequent
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest
      console.log(`⏱️ Rate limiting: waiting ${waitTime}ms`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    lastRequestTime = Date.now()

    // Using MyMemory Translation API (free, no API key required)
    const encodedText = encodeURIComponent(text)
    const apiUrl = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=ko|en`
    
    console.log('Calling MyMemory API...')
    const response: any = await $fetch(apiUrl, {
      timeout: 10000
    })
    
    console.log('MyMemory response:', {
      hasResponseData: !!response?.responseData,
      translatedText: response?.responseData?.translatedText?.substring(0, 50),
      fullResponse: response
    })

    if (response && response.responseData && response.responseData.translatedText) {
      return {
        translatedText: response.responseData.translatedText,
        originalText: text
      }
    } else {
      console.warn('Translation failed, returning original text')
      return {
        translatedText: text,
        originalText: text,
        error: 'Translation service unavailable'
      }
    }
  } catch (error: any) {
    console.error('Translation Error:', error)
    // Fallback: return original text if translation fails
    return {
      translatedText: text,
      originalText: text,
      error: 'Translation failed, showing original text'
    }
  }
})
