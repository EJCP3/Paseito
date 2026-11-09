// Cliente de Better Auth — usado por useAuth() y los modales de login/signup
import { createAuthClient } from 'better-auth/vue'
import { emailOTPClient, inferAdditionalFields } from 'better-auth/client/plugins'
import { dashClient } from '@better-auth/infra/client'

// Debe ser una URL absoluta: better-auth la parsea con `new URL()` también en SSR
const baseURL = typeof window !== 'undefined'
  ? window.location.origin
  : (process.env.APP_URL || 'http://localhost:3000')

export const authClient = createAuthClient({
  baseURL,
  plugins: [
    dashClient(),
    emailOTPClient(),
    // Debe reflejar user.additionalFields de server/utils/auth.ts
    inferAdditionalFields({
      user: {
        instagramUrl: { type: 'string', required: false },
        facebookUrl: { type: 'string', required: false },
        tiktokUrl: { type: 'string', required: false },
        websiteUrl: { type: 'string', required: false },
      },
    }),
  ],
})
