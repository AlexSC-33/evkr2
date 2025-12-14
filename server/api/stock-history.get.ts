export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const symbol = query.symbol
  const date = query.date // Format: YYYY-MM-DD

  if (!symbol || !date) {
    throw createError({
      statusCode: 400,
      message: 'Symbol and date are required'
    })
  }

  try {
    // Convert date string to timestamp
    const targetDate = new Date(date as string)
    const period1 = Math.floor(targetDate.getTime() / 1000)
    const period2 = period1 + 86400 // Add 1 day (86400 seconds)

    // Fetch from Yahoo Finance
    const response = await $fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
      params: {
        period1,
        period2,
        interval: '1d'
      }
    })

    if (response?.chart?.result?.[0]?.indicators?.quote?.[0]?.open?.[0]) {
      const openPrice = response.chart.result[0].indicators.quote[0].open[0]
      return {
        symbol: symbol,
        date: date,
        openPrice: openPrice,
        currency: response.chart.result[0].meta.currency || 'USD'
      }
    }

    throw createError({
      statusCode: 404,
      message: 'Historical price not found'
    })
  } catch (error) {
    console.error(`Error fetching historical price for ${symbol} on ${date}:`, error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch historical price'
    })
  }
})
