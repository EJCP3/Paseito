// Middleware de /admin: sin sesión → flujo de login (igual que auth.ts); sesión no admin → 404.
// El servidor protege igual con requireAdmin: esto es solo UX.
import { authClient } from '~/utils/auth-client'

export default defineNuxtRouteMiddleware(async (to, from) => {
  let session: unknown
  if (import.meta.server) {
    session = await useRequestFetch()('/api/auth/get-session').catch(() => null)
  } else {
    // Atajo solo si la reactiva ya tiene usuario (tras el login aún no se ha refrescado)
    const reactive = useAuth().session.value
    session = reactive.data?.user ? reactive.data : (await authClient.getSession()).data
  }

  const user = (session as { user?: { role?: string | null } } | null)?.user
  if (user) {
    if (user.role === 'ADMIN') return
    throw createError({ statusCode: 404, statusMessage: 'Página no encontrada' })
  }

  if (import.meta.client && from.matched.length) {
    useAuth().openLogin(to.fullPath)
    return abortNavigation()
  }
  return navigateTo({ path: '/', query: { login: to.fullPath } })
})
