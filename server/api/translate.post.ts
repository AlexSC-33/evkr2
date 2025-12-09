export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { text, targetLang = 'en' } = body

  console.log('Translation request:', {
    textLength: text?.length,
    textPreview: text?.substring(0, 50),
    targetLang
  })

  if (!text) {
    return {
      error: 'No text provided',
      message: 'Text is required for translation'
    }
  }

  try {
    // Using MyMemory Translation API (free, no API key required)
    const encodedText = encodeURIComponent(text)
    const apiUrl = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=ko|en`
    
    console.log('Calling MyMemory API...')
    const response: any = await $fetch(apiUrl)
    
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
