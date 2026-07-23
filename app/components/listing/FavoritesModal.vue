<script setup lang="ts">
/**
 * FavoritesModal — "Mi Lista": grid de los anuncios guardados por el usuario
 * logueado (ver useFavorites.ts). Mismo patrón de modal que SellerProfileModal.
 */
defineProps<{ show: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const { favoriteListings } = useFavorites()
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
        id="favorites-modal"
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

          <div class="px-6 sm:px-8 pt-16 pb-8">
            <h2 class="text-xl font-bold mb-1" style="font-family: var(--font-heading);">Mi Lista</h2>
            <p class="text-sm mb-6" style="color: var(--color-muted);">
              {{ favoriteListings.length }} anuncio{{ favoriteListings.length === 1 ? '' : 's' }} guardado{{ favoriteListings.length === 1 ? '' : 's' }}
            </p>

            <div v-if="favoriteListings.length" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ListingCard v-for="listing in favoriteListings" :key="listing.id" :listing="listing" />
            </div>
            <p v-else class="text-sm py-16 text-center" style="color: var(--color-muted);">
              Todavía no guardaste ningún anuncio.
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
