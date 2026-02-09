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
          name: sanitizeInput(String(obj.name || obj.title || ''), 200),
          icon: sanitizeInput(String(obj.icon || ''), 10),
          color: sanitizeInput(String(obj.color || '#00ffff'), 20),
          target: sanitizeInput(String(obj.target || ''), 500),
          notes: sanitizeInput(String(obj.notes || ''), 5000),
          todos: Array.isArray(obj.todos) 
            ? obj.todos.slice(0, 100).map((todo: any) => ({
                id: typeof todo.id === 'number' ? todo.id : Date.now(),
                text: sanitizeInput(String(todo.text || ''), 500),
                completed: Boolean(todo.completed)
              }))
            : []
        }))
      : []

    const portfolios = Array.isArray(body.portfolios)
      ? body.portfolios.slice(0, 10).map((portfolio: any) => ({
          id: sanitizeInput(String(portfolio.id || ''), 100),
          name: sanitizeInput(String(portfolio.name || ''), 200),
          type: sanitizeInput(String(portfolio.type || 'stocks'), 50),
          stocks: Array.isArray(portfolio.stocks)
            ? portfolio.stocks.slice(0, 100).map((stock: any) => ({
                symbol: sanitizeInput(String(stock.symbol || ''), 20),
                quantity: typeof stock.quantity === 'number' ? Math.max(0, stock.quantity) : 0,
                purchasePrice: typeof stock.purchasePrice === 'number' ? Math.max(0, stock.purchasePrice) : 0,
                purchaseDate: sanitizeInput(String(stock.purchaseDate || ''), 50)
              }))
            : []
        }))
      : []

    const koreanTasks = Array.isArray(body.koreanTasks)
      ? body.koreanTasks.slice(0, 100).map((task: any) => ({
          id: typeof task.id === 'number' ? task.id : Date.now(),
          text: sanitizeInput(String(task.text || ''), 500),
          completed: Boolean(task.completed),
          url: task.url ? sanitizeInput(String(task.url), 1000) : undefined
        }))
      : []

    const englishTasks = Array.isArray(body.englishTasks)
      ? body.englishTasks.slice(0, 100).map((task: any) => ({
          id: typeof task.id === 'number' ? task.id : Date.now(),
          text: sanitizeInput(String(task.text || ''), 500),
          completed: Boolean(task.completed),
          url: task.url ? sanitizeInput(String(task.url), 1000) : undefined
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
      portfolios,
      koreanTasks,
      koreanTasksDate: body.koreanTasksDate || null,
      englishTasks,
      englishTasksDate: body.englishTasksDate || null,
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
