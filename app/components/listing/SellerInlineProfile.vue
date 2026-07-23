<script setup lang="ts">
/**
 * SellerInlineProfile — fila compacta (avatar + nombre + badge + conteo) en
 * el panel fijo del detalle de anuncio. Clickeable: abre SellerProfileModal,
 * que recién ahí pide el perfil completo (GET /api/users/:id/profile).
 */
const props = defineProps<{
  owner: {
    id: string
    name: string
    image?: string | null
    verificationTier?: number | null
    activeListingsCount: number
  }
}>()

const showModal = ref(false)

const initials = computed(() => {
  const parts = props.owner.name.trim().split(/\s+/)
  return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : props.owner.name.slice(0, 2).toUpperCase()
})
</script>

<template>
  <button
    type="button"
    class="flex items-center gap-2.5 text-left cursor-pointer hover:opacity-80 transition-opacity"
    id="seller-inline-profile"
    @click="showModal = true"
  >
    <img
      v-if="owner.image"
      :src="owner.image"
      :alt="owner.name"
      referrerpolicy="no-referrer"
      class="w-8 h-8 rounded-full object-cover flex-shrink-0"
    />
    <div
      v-else
      class="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
      style="background: var(--color-neon); color: #0D0D0D;"
    >
      {{ initials }}
    </div>

    <div class="min-w-0">
      <div class="flex items-center gap-1.5">
        <span class="text-sm font-semibold truncate">{{ owner.name }}</span>
        <VerifiedBadge :verification-tier="owner.verificationTier" />
      </div>
      <p class="text-xs" style="color: var(--color-muted);">
        {{ owner.activeListingsCount }} anuncio{{ owner.activeListingsCount === 1 ? '' : 's' }} activo{{ owner.activeListingsCount === 1 ? '' : 's' }}
      </p>
    </div>
  </button>

  <SellerProfileModal :show="showModal" :owner-id="owner.id" @close="showModal = false" />
</template>
