<script setup lang="ts">
/**
 * EditProfileModal — Perfil, contraseña y redes sociales, en tabs
 * Mismo lenguaje visual que los modales de auth (tarjeta oscura centrada)
 */
import { authClient } from '~/utils/auth-client'

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const { user } = useAuth()

const tabs = [
  { id: 'perfil', label: 'Perfil' },
  { id: 'password', label: 'Contraseña' },
  { id: 'social', label: 'Redes sociales' },
]
const activeTab = ref<string>('perfil')

// --- Perfil ---
const name = ref('')
const image = ref('')
const saving = ref(false)
const saveMessage = ref('')
const saveError = ref('')

// --- Contraseña (paso 1: pedir código OTP por correo; paso 2: código + nueva contraseña) ---
const passwordStep = ref<'request' | 'reset'>('request')
const otp = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const sendingOtp = ref(false)
const changingPassword = ref(false)
const passwordMessage = ref('')
const passwordError = ref('')

// --- Redes sociales ---
const instagramUrl = ref('')
const facebookUrl = ref('')
const tiktokUrl = ref('')
const websiteUrl = ref('')
const savingSocial = ref(false)
const socialMessage = ref('')
const socialError = ref('')

watch(() => props.show, (open) => {
  if (open) {
    activeTab.value = 'perfil'
    name.value = user.value?.name || ''
    image.value = user.value?.image || ''
    saveMessage.value = ''
    saveError.value = ''

    passwordStep.value = 'request'
    otp.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    passwordMessage.value = ''
    passwordError.value = ''

    instagramUrl.value = (user.value as any)?.instagramUrl || ''
    facebookUrl.value = (user.value as any)?.facebookUrl || ''
    tiktokUrl.value = (user.value as any)?.tiktokUrl || ''
    websiteUrl.value = (user.value as any)?.websiteUrl || ''
    socialMessage.value = ''
    socialError.value = ''
  }
})

async function handleSaveProfile() {
  saving.value = true
  saveMessage.value = ''
  saveError.value = ''
  await authClient.updateUser(
    { name: name.value, image: image.value || null },
    {
      onSuccess: () => { saveMessage.value = 'Perfil actualizado.' },
      onError: (ctx) => { saveError.value = ctx.error.message },
    }
  )
  saving.value = false
}

// Paso 1 — envía un código de un solo uso al correo del usuario (identidad
// confirmada por dueño de la bandeja de entrada, en vez de pedir la contraseña actual).
async function handleSendOtp() {
  passwordError.value = ''
  passwordMessage.value = ''
  sendingOtp.value = true
  await authClient.emailOtp.sendVerificationOtp(
    { email: user.value?.email || '', type: 'forget-password' },
    {
      onSuccess: () => {
        passwordStep.value = 'reset'
        passwordMessage.value = 'Te enviamos un código a tu correo.'
      },
      onError: (ctx) => { passwordError.value = ctx.error.message },
    }
  )
  sendingOtp.value = false
}

// Paso 2 — valida el código y fija la nueva contraseña en un solo paso.
async function handleChangePassword() {
  passwordError.value = ''
  passwordMessage.value = ''

  if (otp.value.length !== 6) {
    passwordError.value = 'Ingresa el código de 6 dígitos'
    return
  }
  if (newPassword.value.length < 8) {
    passwordError.value = 'La nueva contraseña debe tener al menos 8 caracteres'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'Las contraseñas no coinciden'
    return
  }

  changingPassword.value = true
  await authClient.emailOtp.resetPassword(
    { email: user.value?.email || '', otp: otp.value, password: newPassword.value },
    {
      onSuccess: () => {
        passwordMessage.value = 'Contraseña actualizada.'
        passwordStep.value = 'request'
        otp.value = ''
        newPassword.value = ''
        confirmPassword.value = ''
      },
      onError: (ctx) => { passwordError.value = ctx.error.message },
    }
  )
  changingPassword.value = false
}

async function handleSaveSocial() {
  savingSocial.value = true
  socialMessage.value = ''
  socialError.value = ''
  await authClient.updateUser(
    {
      instagramUrl: instagramUrl.value || null,
      facebookUrl: facebookUrl.value || null,
      tiktokUrl: tiktokUrl.value || null,
      websiteUrl: websiteUrl.value || null,
    },
    {
      onSuccess: () => { socialMessage.value = 'Redes sociales actualizadas.' },
      onError: (ctx) => { socialError.value = ctx.error.message },
    }
  )
  savingSocial.value = false
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-[3000] overflow-y-auto flex items-center justify-center p-4"
        id="edit-profile-modal"
        @click.self="emit('close')"
      >
        <div class="relative w-full max-w-lg rounded-3xl px-8 py-10" style="background: #0a0f0b; border: 1px solid var(--color-border-dark);">
          <button
            class="w-10 h-10 rounded-full flex items-center justify-center absolute top-4 left-4 z-10"
            style="background: var(--color-surface-elevated-dark); color: #e5e5e5;"
            aria-label="Cerrar"
            @click="emit('close')"
          >
            <Icon name="close" class="h-5 w-5" />
          </button>

          <div class="w-full pt-8">
            <h2 class="text-3xl font-black tracking-tight mb-6" style="font-family: var(--font-heading); color: #f5f5f5;">
              Editar cuenta
            </h2>

            <!-- Tabs -->
            <div class="flex gap-1 mb-6 p-1 rounded-full" style="background: var(--color-surface-elevated-dark);">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                type="button"
                class="flex-1 text-sm font-semibold py-2 rounded-full transition-colors"
                :style="activeTab === tab.id
                  ? 'background: var(--color-neon); color: #0D0D0D;'
                  : 'color: #a3a3a3;'"
                @click="activeTab = tab.id"
              >
                {{ tab.label }}
              </button>
            </div>

            <!-- Perfil -->
            <div v-if="activeTab === 'perfil'">
              <form class="flex flex-col gap-4" @submit.prevent="handleSaveProfile">
                <div>
                  <label class="text-xs font-semibold block mb-1.5" style="color: #a3a3a3;">Nombre</label>
                  <input v-model="name" type="text" class="auth-input" placeholder="Tu nombre" />
                </div>

                <div>
                  <label class="text-xs font-semibold block mb-1.5" style="color: #a3a3a3;">URL de foto de perfil</label>
                  <input v-model="image" type="url" class="auth-input" placeholder="https://..." />
                </div>

                <p v-if="saveError" class="text-xs text-red-500">{{ saveError }}</p>
                <p v-if="saveMessage" class="text-xs" style="color: var(--color-neon);">{{ saveMessage }}</p>

                <button type="submit" class="btn btn-neon w-full h-12" :disabled="saving">
                  {{ saving ? 'Guardando…' : 'Guardar cambios' }}
                </button>
              </form>
            </div>

            <!-- Contraseña -->
            <div v-else-if="activeTab === 'password'">
              <!-- Paso 1: pedir código -->
              <form v-if="passwordStep === 'request'" class="flex flex-col gap-4" @submit.prevent="handleSendOtp">
                <p class="text-sm" style="color: #a3a3a3;">
                  Por seguridad, te enviaremos un código a <span style="color: #e5e5e5;">{{ user?.email }}</span> para confirmar que eres tú antes de cambiar la contraseña.
                </p>

                <p v-if="passwordError" class="text-xs text-red-500">{{ passwordError }}</p>

                <button type="submit" class="btn btn-neon w-full h-12" :disabled="sendingOtp">
                  {{ sendingOtp ? 'Enviando…' : 'Enviar código' }}
                </button>
              </form>

              <!-- Paso 2: código + nueva contraseña -->
              <form v-else class="flex flex-col gap-4" @submit.prevent="handleChangePassword">
                <p v-if="passwordMessage" class="text-xs" style="color: var(--color-neon);">{{ passwordMessage }}</p>

                <div>
                  <label class="text-xs font-semibold block mb-1.5" style="color: #a3a3a3;">Código de verificación</label>
                  <input v-model="otp" type="text" inputmode="numeric" maxlength="6" class="auth-input tracking-[0.3em] text-center" placeholder="000000" />
                </div>
                <div>
                  <label class="text-xs font-semibold block mb-1.5" style="color: #a3a3a3;">Nueva contraseña</label>
                  <input v-model="newPassword" type="password" class="auth-input" placeholder="Mínimo 8 caracteres" />
                </div>
                <div>
                  <label class="text-xs font-semibold block mb-1.5" style="color: #a3a3a3;">Repetir nueva contraseña</label>
                  <input v-model="confirmPassword" type="password" class="auth-input" placeholder="••••••••" />
                </div>

                <p v-if="passwordError" class="text-xs text-red-500">{{ passwordError }}</p>

                <button type="submit" class="btn btn-neon w-full h-12" :disabled="changingPassword">
                  {{ changingPassword ? 'Actualizando…' : 'Cambiar contraseña' }}
                </button>
                <button type="button" class="text-xs underline" style="color: #a3a3a3;" @click="passwordStep = 'request'; passwordError = ''">
                  ¿No te llegó? Reenviar código
                </button>
              </form>
            </div>

            <!-- Redes sociales -->
            <div v-else-if="activeTab === 'social'">
              <p class="text-xs mb-4" style="color: #a3a3a3;">
                A dónde quieres redirigir a quien vea tus anuncios.
              </p>
              <form class="flex flex-col gap-4" @submit.prevent="handleSaveSocial">
                <div>
                  <label class="text-xs font-semibold block mb-1.5" style="color: #a3a3a3;">Instagram</label>
                  <input v-model="instagramUrl" type="url" class="auth-input" placeholder="https://instagram.com/..." />
                </div>
                <div>
                  <label class="text-xs font-semibold block mb-1.5" style="color: #a3a3a3;">Facebook</label>
                  <input v-model="facebookUrl" type="url" class="auth-input" placeholder="https://facebook.com/..." />
                </div>
                <div>
                  <label class="text-xs font-semibold block mb-1.5" style="color: #a3a3a3;">TikTok</label>
                  <input v-model="tiktokUrl" type="url" class="auth-input" placeholder="https://tiktok.com/@..." />
                </div>
                <div>
                  <label class="text-xs font-semibold block mb-1.5" style="color: #a3a3a3;">Sitio web</label>
                  <input v-model="websiteUrl" type="url" class="auth-input" placeholder="https://..." />
                </div>

                <p v-if="socialError" class="text-xs text-red-500">{{ socialError }}</p>
                <p v-if="socialMessage" class="text-xs" style="color: var(--color-neon);">{{ socialMessage }}</p>

                <button type="submit" class="btn btn-neon w-full h-12" :disabled="savingSocial">
                  {{ savingSocial ? 'Guardando…' : 'Guardar redes sociales' }}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
