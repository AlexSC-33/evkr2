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
    
    // Try to fetch data for up to 7 days back (in case of holidays/weekends)
    for (let daysBack = 0; daysBack < 7; daysBack++) {
      const checkDate = new Date(targetDate)
      checkDate.setDate(targetDate.getDate() - daysBack)
      
      const period1 = Math.floor(checkDate.getTime() / 1000)
      const period2 = period1 + 86400 // Add 1 day (86400 seconds)

      try {
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
          const actualDate = checkDate.toISOString().split('T')[0]
          
          if (daysBack > 0) {
            console.log(`Historical price for ${symbol} on ${date} not available, using ${actualDate} instead`)
          }
          
          return {
            symbol: symbol,
            requestedDate: date,
            actualDate: actualDate,
            openPrice: openPrice,
            currency: response.chart.result[0].meta.currency || 'USD'
          }
        }
      } catch (fetchError) {
        // Continue to next day if this one fails
        continue
      }
    }

    throw createError({
      statusCode: 404,
      message: 'Historical price not found for any recent date'
    })
  } catch (error) {
    console.error(`Error fetching historical price for ${symbol} on ${date}:`, error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch historical price'
    })
  }
})
