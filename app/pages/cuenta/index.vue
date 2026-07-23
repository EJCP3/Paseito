<script setup lang="ts">
/**
 * Página de cuenta — Perfil del usuario y sus anuncios
 */
useHead({ title: 'Mi cuenta — Paseito' })

const router = useRouter()
const { user, signOut } = useAuth()

const { data: myListings, pending } = useFetch('/api/listings/mine')
const listings = computed(() => (myListings.value as any[]) ?? [])

const initials = computed(() => {
  const name = user.value?.name?.trim()
  if (!name) return '?'
  const parts = name.split(/\s+/)
  return parts.length > 1
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
})

const showEditModal = ref(false)
const showVerifyModal = ref(false)
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8 md:py-12">
    <!-- Salir de la página -->
    <div class="flex items-center justify-between mb-4">
      <button
        type="button"
        class="text-sm font-medium flex items-center gap-1.5 hover:opacity-70 transition-opacity"
        style="color: var(--color-muted);"
        @click="router.push('/')"
      >
        <Icon name="close" class="w-4 h-4" />
        Salir
      </button>

      <button
        type="button"
        class="text-sm font-medium hover:opacity-70 transition-opacity"
        style="color: var(--color-muted);"
        @click="signOut"
      >
        Cerrar sesión
      </button>
    </div>

    <h1 class="text-3xl font-black tracking-tight mb-2" style="font-family: var(--font-heading);">
      Mi cuenta
    </h1>
    <p class="mb-8" style="color: var(--color-muted);">
      Gestiona tu perfil y anuncios publicados
    </p>

    <!-- Profile card -->
    <div class="card-paseito p-6 mb-8">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-4 min-w-0">
          <div class="relative flex-shrink-0">
            <img
              v-if="user?.image"
              :src="user.image"
              :alt="user.name || 'Usuario'"
              referrerpolicy="no-referrer"
              class="w-16 h-16 rounded-full object-cover"
            />
            <div v-else class="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold" style="background: var(--color-neon); color: #0D0D0D;">
              {{ initials }}
            </div>
            <span
              v-if="!user?.emailVerified"
              class="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2"
              style="background: #f59e0b; border-color: var(--color-surface-elevated);"
              title="Correo sin verificar"
            >
              <Icon name="exclamationMark" class="w-3 h-3" stroke="white" stroke-width="3" />
            </span>
          </div>
          <div class="min-w-0">
            <h2 class="text-xl font-bold truncate" style="font-family: var(--font-heading);">{{ user?.name || 'Usuario' }}</h2>
            <p class="text-sm truncate" style="color: var(--color-muted);">{{ user?.email }}</p>
            <button
              v-if="!user?.emailVerified"
              type="button"
              class="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
              style="background: #fef3c7; color: #92400e;"
              @click="showVerifyModal = true"
            >
              Correo sin verificar — verificar ahora
            </button>
          </div>
        </div>

        <button
          class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors hover:bg-black/5"
          style="border: 1px solid var(--color-border);"
          aria-label="Editar cuenta"
          id="edit-profile-btn"
          @click="showEditModal = true"
        >
          <Icon name="pencil" class="w-5 h-5" stroke="#171717" />
        </button>
      </div>
    </div>

    <!-- My listings -->
    <div>
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold" style="font-family: var(--font-heading);">Mis anuncios</h2>
        <NuxtLink to="/publicar" class="btn btn-sm btn-neon">
          + Nuevo anuncio
        </NuxtLink>
      </div>

      <div v-if="listings.length" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <ListingCard v-for="listing in listings" :key="listing.id" :listing="listing" />
      </div>

      <div v-else-if="!pending" class="text-center py-16 rounded-2xl" style="background: var(--color-surface); border: 2px dashed var(--color-border);">
        <Icon name="camera" class="w-12 h-12 mx-auto mb-4" stroke-width="1.5" style="color: var(--color-muted);" />
        <p class="font-bold" style="font-family: var(--font-heading);">No tienes anuncios aún</p>
        <p class="text-sm mt-1 mb-6" style="color: var(--color-muted);">
          Publica tu primera propiedad o vehículo con tour 360°
        </p>
        <NuxtLink to="/publicar" class="btn btn-neon">
          Publicar ahora
        </NuxtLink>
      </div>
    </div>

    <EditProfileModal :show="showEditModal" @close="showEditModal = false" />
    <VerifyEmailModal :show="showVerifyModal" @close="showVerifyModal = false" />
  </div>
</template>
