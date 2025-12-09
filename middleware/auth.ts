export default defineNuxtRouteMiddleware((to) => {
  // Define protected routes
  const protectedRoutes = ['/finn-2025', '/sanity']
  
  // Check if the current route is protected
  const isProtected = protectedRoutes.includes(to.path)
  
  if (isProtected) {
    // Check if user is authenticated
    const authCookie = useCookie('auth_session', {
      maxAge: 60 * 60 * 24 // 24 hours
    })
    
    if (!authCookie.value || authCookie.value !== 'authenticated') {
      // Redirect to home with access code prompt
      return navigateTo('/?showAuth=true&redirect=' + encodeURIComponent(to.path))
    }
  }
})
