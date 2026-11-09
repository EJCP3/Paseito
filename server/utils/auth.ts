// Server utility — Better Auth instance
// Auto-imported in all server/ files via Nuxt's server/utils convention
import { betterAuth, APIError } from 'better-auth'
import { emailOTP } from 'better-auth/plugins'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { dash } from '@better-auth/infra'
import { prisma } from './db'
import { sendEmail } from './email'
import { verificationEmailHtml, otpEmailHtml } from './emailTemplates'

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.APP_URL || 'http://localhost:3000',
  emailAndPassword: {
    enabled: true,
    revokeSessionsOnPasswordReset: true,
  },
  databaseHooks: {
    session: {
      create: {
        // Fuente de verdad única de la suspensión: nuestro campo `suspended` (no `banned` del
        // plugin dash()). Cuentas suspendidas o borradas no pueden abrir sesión por ningún método.
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { suspended: true, deletedAt: true },
          })
          if (user?.suspended || user?.deletedAt) {
            throw APIError.from('FORBIDDEN', { message: 'Cuenta no disponible', code: 'ACCOUNT_UNAVAILABLE' })
          }
        },
      },
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Confirma tu correo — Paseito',
        html: verificationEmailHtml({ name: user.name, url }),
      })
    },
  },
  user: {
    additionalFields: {
      instagramUrl: { type: 'string', required: false },
      facebookUrl: { type: 'string', required: false },
      tiktokUrl: { type: 'string', required: false },
      websiteUrl: { type: 'string', required: false },
      // Solo lectura desde el cliente: nadie se asigna rol ni se des-suspende
      role: { type: 'string', required: false, input: false },
      suspended: { type: 'boolean', required: false, input: false },
      deletedAt: { type: 'date', required: false, input: false },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
  },
  plugins: [
    dash(),
    // OTP por correo — usado como paso de verificación antes de cambiar la contraseña
    emailOTP({
      otpLength: 6,
      expiresIn: 300,
      sendVerificationOTP: async ({ email, otp, type }) => {
        if (type !== 'forget-password') return
        await sendEmail({
          to: email,
          subject: 'Código para cambiar tu contraseña — Paseito',
          html: otpEmailHtml({ otp }),
        })
      },
    }),
  ],
})
