import { hashData } from '../utils/security'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    if (!body || !body.accessCode) {
      throw createError({
        statusCode: 400,
        message: 'Access code is required'
      })
    }

    // Rate limiting par IP
    const clientIp = getRequestHeader(event, 'x-forwarded-for') || 
                     getRequestHeader(event, 'x-real-ip') || 
                     'unknown'
    
    const { checkRateLimit } = await import('../utils/security')
    const rateLimit = checkRateLimit(`auth:${clientIp}`, 5, 60000) // 5 tentatives par minute
    
    if (!rateLimit.allowed) {
      throw createError({
        statusCode: 429,
        message: 'Too many authentication attempts. Please try again later.'
      })
    }

    // Récupérer le hash depuis les variables d'environnement
    const config = useRuntimeConfig()
    const validPasswordHash = config.authPasswordHash
    const premiumUserId = config.premiumUserId

    if (!validPasswordHash) {
      throw createError({
        statusCode: 500,
        message: 'Server configuration error'
      })
    }

    // Hasher le mot de passe fourni
    const providedHash = hashData(body.accessCode.trim().toUpperCase())

    // Comparer les hashes
    if (providedHash === validPasswordHash) {
      // Authentification réussie - définir les cookies
      setCookie(event, 'auth_session', 'authenticated', {
        maxAge: 60 * 60 * 24, // 24 heures
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      })

      // Définir le userId pour charger les bonnes données
      if (premiumUserId) {
        setCookie(event, 'userId', premiumUserId, {
          maxAge: 60 * 60 * 24 * 365, // 1 an
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        })
      }

      return {
        success: true,
        message: 'Authentication successful'
      }
    } else {
      // Mot de passe incorrect
      return {
        success: false,
        message: 'Invalid access code'
      }
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Authentication error:', error)
    throw createError({
      statusCode: 500,
      message: 'Authentication failed'
    })
  }
})
