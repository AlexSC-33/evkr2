import { validateApiKey, sanitizeInput, checkRateLimit } from '../utils/security'

export default defineEventHandler(async (event) => {
  // Rate limiting by IP
  const clientIp = getRequestHeader(event, 'x-forwarded-for') || 
                   getRequestHeader(event, 'x-real-ip') || 
                   'unknown'
  
  const rateLimit = checkRateLimit(`news:${clientIp}`, 30, 60000)
  if (!rateLimit.allowed) {
    throw createError({
      statusCode: 429,
      message: 'Too many requests. Please try again later.'
    })
  }

  setResponseHeader(event, 'X-RateLimit-Limit', '30')
  setResponseHeader(event, 'X-RateLimit-Remaining', rateLimit.remaining.toString())

  const config = useRuntimeConfig()
  const query = getQuery(event)
  
  const apiKey = config.gnewsApiKey
  if (!validateApiKey(apiKey)) {
    throw createError({
      statusCode: 500,
      message: 'API key not configured. Please set GNEWS_API_KEY environment variable.'
    })
  }

  // Validate and sanitize query parameters
  const region = sanitizeInput(String(query.region || 'us'), 10).toLowerCase()
  const lang = sanitizeInput(String(query.lang || 'en'), 10).toLowerCase()
  const maxResults = Math.min(Math.max(parseInt(String(query.max || '10')), 1), 100)
  const search = query.search ? sanitizeInput(String(query.search), 200) : null

  // Validate allowed values
  const allowedRegions = ['us', 'gb', 'ca', 'au', 'fr', 'de', 'it', 'es', 'in', 'cn', 'jp', 'kr']
  const allowedLangs = ['en', 'fr', 'de', 'it', 'es', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar']
  
  if (!allowedRegions.includes(region) && region !== 'us') {
    throw createError({
      statusCode: 400,
      message: 'Invalid region parameter'
    })
  }

  if (!allowedLangs.includes(lang) && lang !== 'en') {
    throw createError({
      statusCode: 400,
      message: 'Invalid language parameter'
    })
  }

  try {
    // If search query is provided, use search endpoint instead of top-headlines
    const endpoint = search ? 'search' : 'top-headlines'
    const params: any = {
      apikey: apiKey,
      lang: lang,
      max: maxResults
    }

    if (search) {
      params.q = search
    } else {
      params.country = region
    }

    const response = await $fetch(`https://gnews.io/api/v4/${endpoint}`, {
      params: params,
      timeout: 10000
    })

    return response
  } catch (error: any) {
    console.error('GNews API Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: 'Failed to fetch news'
    })
  }
})
