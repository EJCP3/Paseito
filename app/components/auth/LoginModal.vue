<script setup lang="ts">
/**
 * LoginModal — Correo/contraseña + Google, sobre AuthModalShell
 */
import { LoginSchema } from '~~/shared/schemas/auth.schema'
import { authClient } from '~/utils/auth-client'

const { showLogin, closeModals, openSignup, afterAuthSuccess, redirectAfterAuth } = useAuth()

const email = ref('')
const password = ref('')
const fieldErrors = ref<Record<string, string>>({})
const formError = ref('')
const loading = ref(false)

watch(showLogin, (open) => {
  if (open) {
    email.value = ''
    password.value = ''
    fieldErrors.value = {}
    formError.value = ''
    step.value = 'login'
    otp.value = ''
    newPassword.value = ''
    infoMessage.value = ''
  }
})

async function handleSubmit() {
  fieldErrors.value = {}
  formError.value = ''

  const result = LoginSchema.safeParse({ email: email.value, password: password.value })
  if (!result.success) {
    for (const issue of result.error.issues) {
      fieldErrors.value[issue.path[0] as string] = issue.message
    }
    return
  }

  loading.value = true
  await authClient.signIn.email(result.data, {
    onSuccess: () => afterAuthSuccess(),
    onError: (ctx) => {
      formError.value = ctx.error.message === 'Invalid email or password'
        ? 'Correo o contraseña incorrectos'
        : ctx.error.message
    },
  })
  loading.value = false
}

// Recuperar contraseña: código OTP por correo → contraseña nueva (mismo patrón que EditProfileModal)
const step = ref<'login' | 'reset'>('login')
const otp = ref('')
const newPassword = ref('')
const infoMessage = ref('')

async function handleForgotPassword() {
  fieldErrors.value = {}
  formError.value = ''
  if (!email.value) {
    fieldErrors.value.email = 'Ingresa tu correo para recuperar la contraseña'
    return
  }
  loading.value = true
  await authClient.emailOtp.sendVerificationOtp(
    { email: email.value, type: 'forget-password' },
    {
      onSuccess: () => {
        step.value = 'reset'
        infoMessage.value = 'Si el correo existe, te enviamos un código de 6 dígitos.'
      },
      onError: (ctx) => { formError.value = ctx.error.message },
    }
  )
  loading.value = false
}

async function handleResetPassword() {
  formError.value = ''
  if (otp.value.length !== 6) {
    formError.value = 'Ingresa el código de 6 dígitos'
    return
  }
  if (newPassword.value.length < 8) {
    formError.value = 'La nueva contraseña debe tener al menos 8 caracteres'
    return
  }
  loading.value = true
  await authClient.emailOtp.resetPassword(
    { email: email.value, otp: otp.value, password: newPassword.value },
    {
      onSuccess: () => {
        step.value = 'login'
        password.value = ''
        infoMessage.value = 'Contraseña actualizada. Ya puedes iniciar sesión.'
      },
      onError: (ctx) => { formError.value = ctx.error.message },
    }
  )
  loading.value = false
}

function switchToSignup() {
  openSignup(redirectAfterAuth.value ?? undefined)
}
</script>

<template>
  <AuthModalShell :show="showLogin" title="Iniciar sesión" @close="closeModals">
    <form v-if="step === 'reset'" class="flex flex-col gap-4" @submit.prevent="handleResetPassword">
      <p v-if="infoMessage" class="text-xs text-center" style="color: #a3a3a3;">{{ infoMessage }}</p>
      <input v-model="otp" type="text" inputmode="numeric" maxlength="6" class="auth-input" placeholder="Código de 6 dígitos" autocomplete="one-time-code">
      <input v-model="newPassword" type="password" class="auth-input" placeholder="Nueva contraseña (mín. 8)" autocomplete="new-password">
      <p v-if="formError" class="text-xs text-red-600 text-center">{{ formError }}</p>
      <button type="submit" class="btn btn-neon w-full h-14 text-base mt-1 !rounded-2xl" :disabled="loading">
        {{ loading ? 'Guardando…' : 'Cambiar contraseña' }}
      </button>
      <button type="button" class="text-xs underline" style="color: #a3a3a3;" @click="step = 'login'; formError = ''; infoMessage = ''">Volver</button>
    </form>

    <form v-else class="flex flex-col gap-4" @submit.prevent="handleSubmit">
      <p v-if="infoMessage" class="text-xs text-center" style="color: #a3a3a3;">{{ infoMessage }}</p>
      <div>
        <input
          v-model="email"
          type="email"
          class="auth-input"
          placeholder="Correo"
        >
        <p v-if="fieldErrors.email" class="text-xs text-red-600 mt-1">{{ fieldErrors.email }}</p>
      </div>

      <div>
        <input
          v-model="password"
          type="password"
          class="auth-input"
          placeholder="Contraseña"
        >
        <p v-if="fieldErrors.password" class="text-xs text-red-600 mt-1">{{ fieldErrors.password }}</p>
      </div>

      <p v-if="formError" class="text-xs text-red-600 text-center">{{ formError }}</p>

      <button type="submit" class="btn btn-neon w-full h-14 text-base mt-1 !rounded-2xl" :disabled="loading">
        {{ loading ? 'Ingresando…' : 'Iniciar sesión' }}
      </button>
    </form>

    <template #footer>
      <p v-if="step === 'login'" class="text-xs text-center mt-4" style="color: #a3a3a3;">
        <button type="button" class="underline" @click="handleForgotPassword">Olvidé mi contraseña</button>
      </p>
      <p class="text-sm text-center mt-5" style="color: #a3a3a3;">
        ¿No tienes cuenta?
        <button type="button" class="font-semibold underline" style="color: var(--color-neon);" @click="switchToSignup">Crear cuenta</button>
      </p>
    </template>
  </AuthModalShell>
</template>
