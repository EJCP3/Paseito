<script setup lang="ts">
/**
 * VerifyEmailModal — Modal chico y directo, solo para verificar el correo
 * (separado de EditProfileModal para no abrumar con tabs quien solo quiere verificar)
 */
import { authClient } from '~/utils/auth-client'

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const { user } = useAuth()

const verifying = ref(false)
const verifyMessage = ref('')

watch(() => props.show, (open) => {
  if (open) verifyMessage.value = ''
})

// ponytail: sin proveedor de email configurado en el servidor — el endpoint
// responde 400 "Verification email isn't enabled"; se maneja como aviso, no error.
async function handleResendVerification() {
  verifying.value = true
  verifyMessage.value = ''
  await authClient.sendVerificationEmail(
    { email: user.value?.email || '', callbackURL: '/cuenta' },
    {
      onSuccess: () => { verifyMessage.value = 'Te enviamos un correo de verificación.' },
      onError: () => { verifyMessage.value = 'La verificación por correo aún no está disponible.' },
    }
  )
  verifying.value = false
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
        id="verify-email-modal"
        @click.self="emit('close')"
      >
        <div class="relative w-full max-w-sm rounded-3xl px-8 py-10 text-center" style="background: #0a0f0b; border: 1px solid var(--color-border-dark);">
          <button
            class="w-10 h-10 rounded-full flex items-center justify-center absolute top-4 left-4 z-10"
            style="background: var(--color-surface-elevated-dark); color: #e5e5e5;"
            aria-label="Cerrar"
            @click="emit('close')"
          >
            <Icon name="close" class="h-5 w-5" />
          </button>

          <div class="w-full pt-8">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style="background: var(--color-surface-elevated-dark);">
              <Icon v-if="user?.emailVerified" name="shieldCheck" class="w-7 h-7" stroke="var(--color-neon)" />
              <Icon v-else name="alertCircle" class="w-7 h-7" stroke="#f59e0b" />
            </div>

            <h2 class="text-2xl font-black tracking-tight mb-2" style="font-family: var(--font-heading); color: #f5f5f5;">
              {{ user?.emailVerified ? 'Correo verificado' : 'Verifica tu correo' }}
            </h2>

            <p class="text-sm mb-6" style="color: #a3a3a3;">
              {{ user?.emailVerified
                ? 'Tu correo ya está verificado.'
                : `Te enviaremos un enlace a ${user?.email} para verificar tu cuenta.` }}
            </p>

            <button
              v-if="!user?.emailVerified"
              type="button"
              class="btn btn-neon w-full h-12"
              :disabled="verifying"
              @click="handleResendVerification"
            >
              {{ verifying ? 'Enviando…' : 'Enviar correo de verificación' }}
            </button>

            <p v-if="verifyMessage" class="text-xs mt-4" style="color: #a3a3a3;">{{ verifyMessage }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
