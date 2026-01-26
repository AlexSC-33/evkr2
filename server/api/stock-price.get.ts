import { sanitizeInput, checkRateLimit } from '../utils/security'

export default defineEventHandler(async (event) => {
  // Rate limiting by IP
  const clientIp = getRequestHeader(event, 'x-forwarded-for') || 
                   getRequestHeader(event, 'x-real-ip') || 
                   'unknown'
  
  const rateLimit = checkRateLimit(`stock-price:${clientIp}`, 30, 60000)
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

  // Validate symbol format (letters, numbers, dots, hyphens only)
  if (!/^[A-Z0-9.\-]+$/.test(symbol)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid symbol format'
    })
  }

  if (symbol.length < 1 || symbol.length > 20) {
    throw createError({
      statusCode: 400,
      message: 'Symbol must be between 1 and 20 characters'
    })
  }

  try {
    // Fetch from Yahoo Finance
    const response = await $fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
      params: {
        interval: '1d',
        range: '1d'
      },
      timeout: 10000
    })

    if (response?.chart?.result?.[0]?.meta?.regularMarketPrice) {
      return {
        symbol: symbol,
        price: response.chart.result[0].meta.regularMarketPrice,
        currency: response.chart.result[0].meta.currency || 'USD'
      }
    }

    throw createError({
      statusCode: 404,
      message: 'Price not found for the given symbol'
    })
  } catch (error: any) {
    console.error(`Error fetching stock price for ${symbol}:`, error)
    
    if (error.statusCode === 404 || error.statusCode === 400) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch stock price'
    })
  }
})
