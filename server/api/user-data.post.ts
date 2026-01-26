import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { validateUserId, sanitizeFilePath, generateSecureUserId, sanitizeInput, checkRateLimit } from '../utils/security'

export default defineEventHandler(async (event) => {
  try {
    // Rate limiting by IP
    const clientIp = getRequestHeader(event, 'x-forwarded-for') || 
                     getRequestHeader(event, 'x-real-ip') || 
                     'unknown'
    
    const rateLimit = checkRateLimit(`user-data-post:${clientIp}`, 20, 60000)
    if (!rateLimit.allowed) {
      throw createError({
        statusCode: 429,
        message: 'Too many requests. Please try again later.'
      })
    }

    setResponseHeader(event, 'X-RateLimit-Limit', '20')
    setResponseHeader(event, 'X-RateLimit-Remaining', rateLimit.remaining.toString())

    const body = await readBody(event)
    
    // Validate input data
    if (!body || typeof body !== 'object') {
      throw createError({
        statusCode: 400,
        message: 'Invalid request body'
      })
    }

    // Validate and sanitize XP
    const xp = typeof body.xp === 'number' && body.xp >= 0 && body.xp <= 1000000 
      ? Math.floor(body.xp) 
      : 0

    // Validate and sanitize arrays
    const quests = Array.isArray(body.quests) 
      ? body.quests.slice(0, 100).map((q: any) => ({
          id: sanitizeInput(String(q.id || ''), 100),
          title: sanitizeInput(String(q.title || ''), 200),
          xp: typeof q.xp === 'number' ? Math.floor(q.xp) : 0,
          completed: Boolean(q.completed)
        }))
      : []

    const objectives = Array.isArray(body.objectives)
      ? body.objectives.slice(0, 100).map((obj: any) => ({
          id: sanitizeInput(String(obj.id || ''), 100),
          title: sanitizeInput(String(obj.title || ''), 500),
          completed: Boolean(obj.completed),
          createdAt: obj.createdAt || new Date().toISOString()
        }))
      : []

    let userId = getCookie(event, 'userId')
    
    // Generate or validate user ID
    if (!userId || !validateUserId(userId)) {
      userId = generateSecureUserId()
      setCookie(event, 'userId', userId, {
        maxAge: 365 * 24 * 60 * 60, // 1 year
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      })
    }

    const safeFileName = sanitizeFilePath(`user-${userId}`)
    const dataDir = join(process.cwd(), 'data')
    const dataPath = join(dataDir, `${safeFileName}.json`)
    
    // Ensure the path is within the data directory
    if (!dataPath.startsWith(dataDir)) {
      throw createError({
        statusCode: 403,
        message: 'Access denied'
      })
    }

    // Ensure data directory exists
    try {
      await mkdir(dataDir, { recursive: true })
    } catch (err) {
      // Directory might already exist
    }

    // Save user data with validated and sanitized content
    await writeFile(dataPath, JSON.stringify({
      xp,
      quests,
      questsDate: body.questsDate || null,
      objectives,
      updatedAt: new Date().toISOString()
    }, null, 2))

    return { success: true, userId }
  } catch (error: any) {
    if (error.statusCode === 429 || error.statusCode === 400 || error.statusCode === 403) {
      throw error
    }
    console.error('Error saving user data:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to save user data'
    })
  }
})
