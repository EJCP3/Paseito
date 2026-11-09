<script setup lang="ts">
/**
 * SignupModal — Correo/contraseña + Google, sobre AuthModalShell
 */
import { SignupSchema } from '~~/shared/schemas/auth.schema'
import { authClient } from '~/utils/auth-client'

const { showSignup, closeModals, openLogin, afterAuthSuccess, redirectAfterAuth } = useAuth()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const fieldErrors = ref<Record<string, string>>({})
const formError = ref('')
const loading = ref(false)

watch(showSignup, (open) => {
  if (open) {
    email.value = ''
    password.value = ''
    confirmPassword.value = ''
    fieldErrors.value = {}
    formError.value = ''
  }
})

async function handleSubmit() {
  fieldErrors.value = {}
  formError.value = ''

  const result = SignupSchema.safeParse({
    email: email.value,
    password: password.value,
    confirmPassword: confirmPassword.value,
  })
  if (!result.success) {
    for (const issue of result.error.issues) {
      fieldErrors.value[issue.path[0] as string] = issue.message
    }
    return
  }

  loading.value = true
  await authClient.signUp.email({
    email: result.data.email,
    password: result.data.password,
    name: result.data.email.split('@')[0] ?? result.data.email,
  }, {
    onSuccess: () => afterAuthSuccess(),
    onError: (ctx) => {
      formError.value = ctx.error.message === 'User already exists'
        ? 'Ya existe una cuenta con ese correo'
        : ctx.error.message
    },
  })
  loading.value = false
}

function switchToLogin() {
  openLogin(redirectAfterAuth.value ?? undefined)
}
</script>

<template>
  <AuthModalShell :show="showSignup" title="Crear cuenta" @close="closeModals">
    <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
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

      <div>
        <input
          v-model="confirmPassword"
          type="password"
          class="auth-input"
          placeholder="Repetir contraseña"
        >
        <p v-if="fieldErrors.confirmPassword" class="text-xs text-red-600 mt-1">{{ fieldErrors.confirmPassword }}</p>
      </div>

      <p v-if="formError" class="text-xs text-red-600 text-center">{{ formError }}</p>

      <button type="submit" class="btn btn-neon w-full h-14 text-base mt-1 !rounded-2xl" :disabled="loading">
        {{ loading ? 'Creando cuenta…' : 'Crear cuenta' }}
      </button>
    </form>

    <template #footer>
      <p class="text-sm text-center mt-5" style="color: #a3a3a3;">
        ¿Ya tienes cuenta?
        <button type="button" class="font-semibold underline" style="color: var(--color-neon);" @click="switchToLogin">Iniciar sesión</button>
      </p>
    </template>
  </AuthModalShell>
</template>
