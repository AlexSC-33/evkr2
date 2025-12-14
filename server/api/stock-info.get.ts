export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const symbol = query.symbol

  if (!symbol) {
    throw createError({
      statusCode: 400,
      message: 'Symbol is required'
    })
  }

  try {
    // Fetch from Yahoo Finance
    const response = await $fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
      params: {
        interval: '1d',
        range: '1d'
      }
    })

    const result = response?.chart?.result?.[0]
    
    if (result?.meta) {
      return {
        symbol: symbol,
        longName: result.meta.longName || result.meta.shortName || symbol,
        currency: result.meta.currency || 'USD',
        exchangeName: result.meta.exchangeName || '',
        instrumentType: result.meta.instrumentType || 'EQUITY'
      }
    }

    throw createError({
      statusCode: 404,
      message: 'Symbol information not found'
    })
  } catch (error) {
    console.error(`Error fetching stock info for ${symbol}:`, error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch stock information'
    })
  }
})
