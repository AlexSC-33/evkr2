import { sanitizeInput, checkRateLimit } from '../utils/security'

export default defineEventHandler(async (event) => {
  // Rate limiting by IP
  const clientIp = getRequestHeader(event, 'x-forwarded-for') || 
                   getRequestHeader(event, 'x-real-ip') || 
                   'unknown'
  
  const rateLimit = checkRateLimit(`crypto-price:${clientIp}`, 30, 60000)
  if (!rateLimit.allowed) {
    throw createError({
      statusCode: 429,
      message: 'Too many requests. Please try again later.'
    })
  }

  setResponseHeader(event, 'X-RateLimit-Limit', '30')
  setResponseHeader(event, 'X-RateLimit-Remaining', rateLimit.remaining.toString())

  const query = getQuery(event)
  const symbol = query.symbol ? sanitizeInput(String(query.symbol), 20).toUpperCase() : null

  if (!symbol) {
    throw createError({
      statusCode: 400,
      message: 'Symbol is required'
    })
  }

  // Validate symbol format (letters and numbers only)
  if (!/^[A-Z0-9]+$/.test(symbol)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid symbol format'
    })
  }

  try {
    // Binance uses USDT pairs by default
    const tradingPair = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`
    
    // Fetch from Binance API
    const response = await $fetch(`https://api.binance.com/api/v3/ticker/price`, {
      params: {
        symbol: tradingPair
      }
    })

    if (!response || !response.price) {
      throw createError({
        statusCode: 404,
        message: 'Crypto not found'
      })
    }

    return {
      symbol: symbol,
      price: parseFloat(response.price),
      currency: 'USD',
      source: 'binance'
    }
  } catch (error: any) {
    console.error(`Error fetching crypto price for ${symbol}:`, error)
    
    if (error.statusCode === 404 || error.status === 400) {
      throw createError({
        statusCode: 404,
        message: `Crypto ${symbol} not found`
      })
    }
    
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch crypto price'
    })
  }
})
