export default defineNuxtRouteMiddleware((to) => {
  // Check if user is authenticated
  const authCookie = useCookie('auth_session')
  
  // Protected routes that require authentication
  const protectedRoutes = ['/finn', '/sanity']
  const isProtectedRoute = protectedRoutes.some(route => to.path.startsWith(route))
  
  // If trying to access a protected route without authentication
  if (isProtectedRoute && authCookie.value !== 'authenticated') {
    // Redirect to home with access code prompt
    return navigateTo('/?showAuth=true&redirect=' + encodeURIComponent(to.path))
  }
})
