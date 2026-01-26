import { hashData } from '../server/utils/security'

export default defineNuxtRouteMiddleware((to) => {
  const config = useRuntimeConfig()
  
  // Check if user is authenticated
  const authCookie = useCookie('auth_session', {
    maxAge: 60 * 60 * 24, // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  })
  
  // Get the expected auth value (hashed access code)
  const accessCode = config.accessCode || config.public.accessCode || ''
  const expectedAuth = accessCode ? hashData(accessCode) : 'authenticated'
  
  // If not authenticated and not already on the home page (to prevent infinite redirects)
  if ((!authCookie.value || authCookie.value !== expectedAuth) && to.path !== '/') {
    // Redirect to home with access code prompt
    return navigateTo('/?showAuth=true&redirect=' + encodeURIComponent(to.path))
  }
})
