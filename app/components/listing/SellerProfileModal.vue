<script setup lang="ts">
/**
 * SellerProfileModal — perfil público del vendedor: header (avatar, nombre,
 * badge, miembro desde), grid de sus otros anuncios activos (ListingCard) y
 * contador de guardados. Mismo patrón de modal (Teleport + Transition) que
 * el resto del proyecto (ver EditProfileModal/AuthModalShell), en claro
 * porque el contenido (grid de cards blancas) no calza con el tema oscuro.
 */
import type { SellerProfile } from '~~/shared/types/listing'

const props = defineProps<{
  show: boolean
  ownerId: string
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

const profile = ref<SellerProfile | null>(null)
const loading = ref(false)

watch(() => props.show, async (open) => {
  if (!open || profile.value) return
  loading.value = true
  try {
    profile.value = await $fetch<SellerProfile>(`/api/users/${props.ownerId}/profile`)
  } finally {
    loading.value = false
  }
})

const memberSince = computed(() => {
  if (!profile.value) return ''
  return new Intl.DateTimeFormat('es-DO', { month: 'long', year: 'numeric' }).format(new Date(profile.value.user.createdAt))
})
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
        class="fixed inset-0 z-[3000] overflow-y-auto flex items-start sm:items-center justify-center sm:p-4"
        id="seller-profile-modal"
        @click.self="emit('close')"
      >
        <div class="relative w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[85vh] sm:rounded-3xl bg-white overflow-y-auto">
          <button
            class="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center z-10"
            style="background: var(--color-surface-elevated);"
            aria-label="Cerrar"
            @click="emit('close')"
          >
            <Icon name="close" class="w-4 h-4" />
          </button>

          <div v-if="loading && !profile" class="py-24 text-center" style="color: var(--color-muted);">
            Cargando perfil…
          </div>

          <div v-else-if="profile" class="px-6 sm:px-8 pt-16 pb-8">
            <!-- Header -->
            <div class="flex flex-col items-center text-center mb-8">
              <img
                v-if="profile.user.image"
                :src="profile.user.image"
                :alt="profile.user.name"
                referrerpolicy="no-referrer"
                class="w-20 h-20 rounded-full object-cover mb-3"
              />
              <div
                v-else
                class="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-3"
                style="background: var(--color-neon); color: #0D0D0D;"
              >
                {{ profile.user.name.slice(0, 2).toUpperCase() }}
              </div>

              <div class="flex items-center gap-1.5">
                <h2 class="text-xl font-bold" style="font-family: var(--font-heading);">{{ profile.user.name }}</h2>
                <VerifiedBadge :verification-tier="profile.user.verificationTier" />
              </div>
              <p class="text-sm mt-1" style="color: var(--color-muted);">Miembro desde {{ memberSince }}</p>

              <div class="flex items-center gap-1.5 mt-3 text-sm" style="color: var(--color-muted);">
                <Icon name="heartFilled" class="w-3.5 h-3.5" style="color: var(--color-neon-dark);" />
                {{ profile.totalSaved }} guardado{{ profile.totalSaved === 1 ? '' : 's' }} en total
              </div>
            </div>

            <!-- Anuncios activos -->
            <h3 class="text-sm font-bold uppercase tracking-wider mb-3" style="color: var(--color-muted);">
              {{ profile.activeListings.length }} anuncio{{ profile.activeListings.length === 1 ? '' : 's' }} activo{{ profile.activeListings.length === 1 ? '' : 's' }}
            </h3>
            <div v-if="profile.activeListings.length" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ListingCard v-for="listing in profile.activeListings" :key="listing.id" :listing="listing as any" />
            </div>
            <p v-else class="text-sm py-8 text-center" style="color: var(--color-muted);">
              No tiene otros anuncios activos por ahora.
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
