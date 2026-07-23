// Cliente de Better Auth — usado por useAuth() y los modales de login/signup
import { createAuthClient } from 'better-auth/vue'
import { emailOTPClient } from 'better-auth/client/plugins'
import { dashClient } from '@better-auth/infra/client'

// Debe ser una URL absoluta: better-auth la parsea con `new URL()` también en SSR
const baseURL = typeof window !== 'undefined'
  ? window.location.origin
  : (process.env.APP_URL || 'http://localhost:3000')

export const authClient = createAuthClient({
  baseURL,
  plugins: [dashClient(), emailOTPClient()],
})
