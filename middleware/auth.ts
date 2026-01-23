export default defineNuxtRouteMiddleware((to) => {
  // Check if user is authenticated
  const authCookie = useCookie('auth_session', {
    maxAge: 60 * 60 * 24 // 24 hours
  })
  
  // If not authenticated and not already on the home page (to prevent infinite redirects)
  if ((!authCookie.value || authCookie.value !== 'authenticated') && to.path !== '/') {
    // Redirect to home with access code prompt
    return navigateTo('/?showAuth=true&redirect=' + encodeURIComponent(to.path))
  }
})
