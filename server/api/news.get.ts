export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  
  const apiKey = config.gnewsApiKey
  if (!apiKey || apiKey === 'your_api_key_here') {
    return {
      error: 'API key not configured',
      message: 'Please set GNEWS_API_KEY in your .env file. Get your free key at https://gnews.io/'
    }
  }

  const { region = 'us', lang = 'en', max = 10 } = query

  try {
    const response = await $fetch(`https://gnews.io/api/v4/top-headlines`, {
      params: {
        apikey: apiKey,
        country: region,
        lang: lang,
        max: max
      }
    })

    return response
  } catch (error: any) {
    console.error('GNews API Error:', error)
    return {
      error: 'Failed to fetch news',
      message: error?.message || 'Unknown error'
    }
  }
})
