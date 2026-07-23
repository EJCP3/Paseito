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

// ponytail: sin flujo de envío de correo real (no hay proveedor de email configurado)
async function handleForgotPassword() {
  if (!email.value) {
    fieldErrors.value.email = 'Ingresa tu correo para recuperar la contraseña'
    return
  }
  await authClient.forgetPassword({ email: email.value, redirectTo: '/' })
  formError.value = 'Si el correo existe, te enviamos un enlace para restablecer tu contraseña.'
}

function switchToSignup() {
  openSignup(redirectAfterAuth.value ?? undefined)
}
</script>

<template>
  <AuthModalShell :show="showLogin" title="Iniciar sesión" @close="closeModals">
    <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
      <div>
        <input
          v-model="email"
          type="email"
          class="auth-input"
          placeholder="Correo"
        />
        <p v-if="fieldErrors.email" class="text-xs text-red-600 mt-1">{{ fieldErrors.email }}</p>
      </div>

      <div>
        <input
          v-model="password"
          type="password"
          class="auth-input"
          placeholder="Contraseña"
        />
        <p v-if="fieldErrors.password" class="text-xs text-red-600 mt-1">{{ fieldErrors.password }}</p>
      </div>

      <p v-if="formError" class="text-xs text-red-600 text-center">{{ formError }}</p>

      <button type="submit" class="btn btn-neon w-full h-14 text-base mt-1 !rounded-2xl" :disabled="loading">
        {{ loading ? 'Ingresando…' : 'Iniciar sesión' }}
      </button>
    </form>

    <template #footer>
      <p class="text-xs text-center mt-4" style="color: #a3a3a3;">
        <button type="button" class="underline" @click="handleForgotPassword">Olvidé mi contraseña</button>
      </p>
      <p class="text-sm text-center mt-5" style="color: #a3a3a3;">
        ¿No tienes cuenta?
        <button type="button" class="font-semibold underline" style="color: var(--color-neon);" @click="switchToSignup">Crear cuenta</button>
      </p>
    </template>
  </AuthModalShell>
</template>
