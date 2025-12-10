import { readFile } from 'fs/promises'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  try {
    const userId = getCookie(event, 'userId') || 'default'
    const dataPath = join(process.cwd(), 'data', `user-${userId}.json`)
    
    try {
      const data = await readFile(dataPath, 'utf-8')
      return JSON.parse(data)
    } catch (err) {
      // File doesn't exist yet
      return {
        xp: 0,
        quests: [],
        questsDate: null
      }
    }
  } catch (error) {
    console.error('Error reading user data:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to load user data'
    })
  }
})
