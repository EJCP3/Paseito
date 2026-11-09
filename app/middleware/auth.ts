// Middleware con nombre: páginas que requieren sesión (/cuenta, /publicar/*)
// Sin sesión abre el modal de login (con redirect de vuelta) y no renderiza la página.
import { authClient } from '~/utils/auth-client'

export default defineNuxtRouteMiddleware(async (to, from) => {
  // SSR: la sesión viaja en la cookie de la petición; cliente: cookie del navegador
  let session: unknown
  if (import.meta.server) {
    session = await useRequestFetch()('/api/auth/get-session').catch(() => null)
  } else {
    // Atajo: la sesión reactiva solo si ya tiene usuario. Si no, se consulta al servidor:
    // justo después del login la reactiva aún no se ha refrescado y bloquearía la redirección.
    const reactive = useAuth().session.value
    session = reactive.data?.user ? reactive.data : (await authClient.getSession()).data
  }

  if ((session as { user?: unknown } | null)?.user) return

  // Navegación interna → se queda donde está y abre el modal.
  // Primera carga (SSR/recarga) → inicio con ?login=<ruta>; app.vue abre el modal al montar
  // (el estado de useState no sobrevive a la redirección del servidor).
  if (import.meta.client && from.matched.length) {
    useAuth().openLogin(to.fullPath)
    return abortNavigation()
  }
  return navigateTo({ path: '/', query: { login: to.fullPath } })
})
