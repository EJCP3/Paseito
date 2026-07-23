// Composable — useAuth
// Sesión de Better Auth + estado de los modales de login/signup
import { authClient } from '~/utils/auth-client'

export function useAuth() {
  const session = authClient.useSession()

  const showLogin = useState('auth-show-login', () => false)
  const showSignup = useState('auth-show-signup', () => false)
  const redirectAfterAuth = useState<string | null>('auth-redirect-after', () => null)

  function openLogin(redirectTo?: string) {
    redirectAfterAuth.value = redirectTo ?? null
    showSignup.value = false
    showLogin.value = true
  }

  function openSignup(redirectTo?: string) {
    redirectAfterAuth.value = redirectTo ?? null
    showLogin.value = false
    showSignup.value = true
  }

  function closeModals() {
    showLogin.value = false
    showSignup.value = false
  }

  // Navega a `to` si ya hay sesión; si no, abre el login con `to` como redirect pendiente
  function goOrLogin(to: string) {
    if (session.value.data?.user) {
      return navigateTo(to)
    }
    openLogin(to)
  }

  async function afterAuthSuccess() {
    const target = redirectAfterAuth.value
    redirectAfterAuth.value = null
    closeModals()
    if (target) await navigateTo(target)
  }

  async function signOut() {
    await authClient.signOut()
    await navigateTo('/')
  }

  return {
    session,
    user: computed(() => session.value.data?.user ?? null),
    isAuthenticated: computed(() => !!session.value.data?.user),
    showLogin,
    showSignup,
    redirectAfterAuth,
    openLogin,
    openSignup,
    closeModals,
    goOrLogin,
    afterAuthSuccess,
    signOut,
  }
}
