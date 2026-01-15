import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    let userId = getCookie(event, 'userId')
    
    // Use fixed user ID for single-user site
    if (!userId) {
      userId = 'user_1765360632102_j8nnt1x8x'
      setCookie(event, 'userId', userId, {
        maxAge: 365 * 24 * 60 * 60, // 1 year
        httpOnly: true,
        sameSite: 'lax'
      })
    }

    const dataDir = join(process.cwd(), 'data')
    const dataPath = join(dataDir, `user-${userId}.json`)
    
    // Ensure data directory exists
    try {
      await mkdir(dataDir, { recursive: true })
    } catch (err) {
      // Directory might already exist
    }

    // Save user data
    await writeFile(dataPath, JSON.stringify({
      xp: body.xp || 0,
      quests: body.quests || [],
      questsDate: body.questsDate || null,
      objectives: body.objectives || [],
      updatedAt: new Date().toISOString()
    }, null, 2))

    return { success: true, userId }
  } catch (error) {
    console.error('Error saving user data:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to save user data'
    })
  }
})
