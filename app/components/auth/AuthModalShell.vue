<script setup lang="ts">
/**
 * AuthModalShell — Chrome compartido por LoginModal y SignupModal
 * (backdrop, cierre, logo, botón de Google, layout responsive)
 */
import { authClient } from '~/utils/auth-client'

const props = defineProps<{
  show: boolean
  title: string
  googleDisabled?: boolean
  signUp?: boolean
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

const { redirectAfterAuth } = useAuth()
const googleLoading = ref(false)

async function continueWithGoogle() {
  googleLoading.value = true
  await authClient.signIn.social({
    provider: 'google',
    requestSignUp: props.signUp || undefined,
    callbackURL: redirectAfterAuth.value || '/',
  })
}
</script>

<template>
  <Teleport to="body">
    <Transition
      appear
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
        id="auth-modal"
        @click.self="emit('close')"
      >
        <div class="relative w-full max-w-2xl rounded-3xl px-10 py-10" style="background: #0a0f0b; border: 1px solid var(--color-border-dark);">
          <button
            class="w-10 h-10 rounded-full flex items-center justify-center absolute top-4 left-4 z-10"
            style="background: var(--color-surface-elevated-dark); color: #e5e5e5;"
            aria-label="Cerrar"
            @click="emit('close')"
          >
            <Icon name="close" class="h-5 w-5" />
          </button>

          <div class="w-full max-w-md mx-auto pt-8">
            <!-- App icon -->
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style="background: var(--color-neon);">
              <Icon name="footsteps" class="text-black" width="34" height="34" />
            </div>

            <h2 class="text-4xl font-black tracking-tight mb-8" style="font-family: var(--font-heading); color: #f5f5f5;">
              {{ title }}
            </h2>

            <slot />

            <button
              type="button"
              class="btn w-full h-14 rounded-2xl font-semibold gap-2 border mt-3"
              style="background: var(--color-surface-elevated-dark); border-color: var(--color-border-dark); color: #e5e5e5;"
              :disabled="googleLoading || googleDisabled"
              @click="continueWithGoogle"
            >
              <Icon name="googleLogo" width="18" height="18" stroke="none" />
              Continuar con Google
            </button>

            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
