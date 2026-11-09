<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
/**
 * Página de cuenta — Perfil del usuario y sus anuncios
 */
useHead({ title: 'Mi cuenta — Paseito' })

const router = useRouter()
const { user, signOut } = useAuth()

const { data: myListings, pending, refresh } = useFetch('/api/listings/mine')
const listings = computed(() => (myListings.value as any[]) ?? [])

const initials = computed(() => {
  const name = user.value?.name?.trim()
  if (!name) return '?'
  const parts = name.split(/\s+/)
  return parts.length > 1
    ? (parts[0]![0]! + parts[1]![0]!).toUpperCase()
    : name.slice(0, 2).toUpperCase()
})

const STATUS_LABELS: Record<string, string> = { DRAFT: 'Borrador', ACTIVE: 'Activo', PAUSED: 'Pausado', PENDING_REVIEW: 'En revisión', SOLD: 'Vendido' }
const STATUS_COLORS: Record<string, string> = { DRAFT: '#6b7280', ACTIVE: '#16a34a', PAUSED: '#d97706', PENDING_REVIEW: '#2563eb', SOLD: '#6b7280' }

const actionError = ref('')
const busyId = ref('')

async function changeStatus(id: string, action: 'pause' | 'resume') {
  actionError.value = ''
  busyId.value = id
  try {
    await $fetch(`/api/listings/${id}/status`, { method: 'POST', body: { action } })
    await refresh()
  } catch (err: any) {
    actionError.value = err?.data?.statusMessage || 'No se pudo cambiar el estado del anuncio.'
  } finally {
    busyId.value = ''
  }
}

async function removeListing(listing: { id: string; title: string }) {
  if (!confirm(`¿Eliminar "${listing.title}"? Dejará de ser visible y no se podrá recuperar desde aquí.`)) return
  actionError.value = ''
  busyId.value = listing.id
  try {
    await $fetch(`/api/listings/${listing.id}`, { method: 'DELETE' })
    await refresh()
  } catch (err: any) {
    actionError.value = err?.data?.statusMessage || 'No se pudo eliminar el anuncio.'
  } finally {
    busyId.value = ''
  }
}

// Borrar cuenta: confirmación escribiendo ELIMINAR
const showDeleteAccount = ref(false)
const deleteConfirm = ref('')
const deletingAccount = ref(false)
const deleteAccountError = ref('')

async function deleteAccount() {
  if (deleteConfirm.value !== 'ELIMINAR') return
  deletingAccount.value = true
  deleteAccountError.value = ''
  try {
    await $fetch('/api/users/me', { method: 'DELETE' })
    // Recarga completa: limpia la sesión del cliente (el servidor ya borró las sesiones)
    await navigateTo('/', { external: true })
  } catch (err: any) {
    deleteAccountError.value = err?.data?.statusMessage || 'No se pudo eliminar la cuenta. Intenta de nuevo.'
    deletingAccount.value = false
  }
}

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
            >
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
          id="edit-profile-btn"
          class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors hover:bg-black/5"
          style="border: 1px solid var(--color-border);"
          aria-label="Editar cuenta"
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

      <p v-if="actionError" class="text-sm text-red-600 mb-4">{{ actionError }}</p>

      <div v-if="listings.length" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div v-for="listing in listings" :key="listing.id" class="flex flex-col gap-2">
          <ListingCard :listing="listing" />
          <div class="flex flex-wrap items-center gap-x-3 text-sm px-1 [&>a]:py-2 [&>button]:py-2">
            <span
              class="text-xs font-bold px-2.5 py-1 rounded-full text-white"
              :style="`background: ${STATUS_COLORS[listing.status] || '#6b7280'};`"
            >
              {{ listing.adminPausedAt ? 'Pausado por moderación' : (STATUS_LABELS[listing.status] || listing.status) }}
            </span>
            <span v-if="listing.adminPausedAt" class="basis-full text-xs text-amber-700">
              Motivo: {{ listing.adminPausedReason || 'sin especificar' }}
            </span>
            <NuxtLink :to="`/anuncio/${listing.slug}`" class="font-semibold underline">Ver</NuxtLink>
            <NuxtLink :to="`/publicar?id=${listing.id}`" class="font-semibold underline">Editar datos</NuxtLink>
            <NuxtLink :to="`/publicar/fotos?id=${listing.id}`" class="font-semibold underline">Fotos y tour</NuxtLink>
            <NuxtLink v-if="listing.status === 'DRAFT' && !listing.adminPausedAt" :to="`/publicar/tour?id=${listing.id}`" class="font-semibold underline">Publicar</NuxtLink>
            <button
              v-if="listing.status === 'ACTIVE'"
              type="button"
              class="font-semibold underline"
              :disabled="busyId === listing.id"
              @click="changeStatus(listing.id, 'pause')"
            >Pausar</button>
            <button
              v-if="listing.status === 'PAUSED' && !listing.adminPausedAt"
              type="button"
              class="font-semibold underline"
              :disabled="busyId === listing.id"
              @click="changeStatus(listing.id, 'resume')"
            >Reanudar</button>
            <button
              type="button"
              class="font-semibold underline text-red-600"
              :disabled="busyId === listing.id"
              @click="removeListing(listing)"
            >Eliminar</button>
          </div>
        </div>
      </div>

      <div v-else-if="!pending" class="text-center py-16 rounded-2xl" style="background: var(--color-surface); border: 2px dashed var(--color-border);">
        <Icon name="camera" class="w-12 h-12 mx-auto mb-4" stroke-width="1.5" style="color: var(--color-muted);" />
        <p class="font-bold" style="font-family: var(--font-heading);">No tienes anuncios aún</p>
        <p class="text-sm mt-1 mb-6" style="color: var(--color-muted);">
          Publica tu primer inmueble con tour 360°
        </p>
        <NuxtLink to="/publicar" class="btn btn-neon">
          Publicar ahora
        </NuxtLink>
      </div>
    </div>

    <!-- Borrar cuenta -->
    <div class="mt-12 pt-6" style="border-top: 1px solid var(--color-border);">
      <button
        v-if="!showDeleteAccount"
        type="button"
        class="text-sm font-medium text-red-600 underline"
        @click="showDeleteAccount = true"
      >
        Eliminar mi cuenta
      </button>
      <form v-else class="flex flex-col gap-3 max-w-md" @submit.prevent="deleteAccount">
        <p class="text-sm">
          Se anonimizará tu cuenta y tus anuncios quedarán pausados. No podrás volver a entrar con ella.
          Escribe <strong>ELIMINAR</strong> para confirmar.
        </p>
        <input v-model="deleteConfirm" type="text" class="px-3 py-2 rounded-lg border text-sm" style="border-color: var(--color-border);" placeholder="ELIMINAR" autocomplete="off">
        <p v-if="deleteAccountError" class="text-sm text-red-600">{{ deleteAccountError }}</p>
        <div class="flex gap-3">
          <button type="submit" class="btn btn-sm" style="background: #dc2626; color: #fff; border: none;" :disabled="deleteConfirm !== 'ELIMINAR' || deletingAccount">
            {{ deletingAccount ? 'Eliminando…' : 'Eliminar cuenta' }}
          </button>
          <button type="button" class="text-sm underline" @click="showDeleteAccount = false; deleteConfirm = ''">Cancelar</button>
        </div>
      </form>
    </div>

    <EditProfileModal :show="showEditModal" @close="showEditModal = false" />
    <VerifyEmailModal :show="showVerifyModal" @close="showVerifyModal = false" />
  </div>
</template>
