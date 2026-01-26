import { readFile } from 'fs/promises'
import { join } from 'path'
import { validateUserId, sanitizeFilePath, checkRateLimit } from '../utils/security'

export default defineEventHandler(async (event) => {
  try {
    // Rate limiting by IP
    const clientIp = getRequestHeader(event, 'x-forwarded-for') || 
                     getRequestHeader(event, 'x-real-ip') || 
                     'unknown'
    
    const rateLimit = checkRateLimit(`user-data-get:${clientIp}`, 30, 60000)
    if (!rateLimit.allowed) {
      throw createError({
        statusCode: 429,
        message: 'Too many requests. Please try again later.'
      })
    }

    setResponseHeader(event, 'X-RateLimit-Limit', '30')
    setResponseHeader(event, 'X-RateLimit-Remaining', rateLimit.remaining.toString())
    
    let userId = getCookie(event, 'userId') || 'default'
    
    // Validate and sanitize user ID to prevent path traversal
    if (!validateUserId(userId)) {
      console.warn(`Invalid userId attempted: ${userId}`)
      userId = 'default'
    }
    
    const safeFileName = sanitizeFilePath(`user-${userId}`)
    const dataPath = join(process.cwd(), 'data', `${safeFileName}.json`)
    
    // Ensure the path is within the data directory
    const dataDir = join(process.cwd(), 'data')
    if (!dataPath.startsWith(dataDir)) {
      throw createError({
        statusCode: 403,
        message: 'Access denied'
      })
    }
    
    try {
      const data = await readFile(dataPath, 'utf-8')
      const parsed = JSON.parse(data)
      
      // Validate parsed data structure
      return {
        xp: typeof parsed.xp === 'number' ? parsed.xp : 0,
        quests: Array.isArray(parsed.quests) ? parsed.quests : [],
        questsDate: parsed.questsDate || null,
        objectives: Array.isArray(parsed.objectives) ? parsed.objectives : []
      }
    } catch (err) {
      // File doesn't exist yet
      return {
        xp: 0,
        quests: [],
        questsDate: null,
        objectives: []
      }
    }
  } catch (error: any) {
    if (error.statusCode === 429 || error.statusCode === 403) {
      throw error
    }
    console.error('Error reading user data:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to load user data'
    })
  }
})
