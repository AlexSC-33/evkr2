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

    if (response?.chart?.result?.[0]?.meta?.regularMarketPrice) {
      return {
        symbol: symbol,
        price: response.chart.result[0].meta.regularMarketPrice,
        currency: response.chart.result[0].meta.currency || 'USD'
      }
    }

    throw createError({
      statusCode: 404,
      message: 'Price not found'
    })
  } catch (error) {
    console.error(`Error fetching stock price for ${symbol}:`, error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch stock price'
    })
  }
})
