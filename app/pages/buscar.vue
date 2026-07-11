<script setup lang="ts">
/**
 * Página de búsqueda — Filtros + grid de resultados
 */
useHead({
  title: 'Buscar listados — Paseito',
  meta: [
    { name: 'description', content: 'Busca apartamentos, casas y vehículos con tours virtuales 360° en Paseito.' },
  ],
})

const { listings, loading, total, totalPages, currentPage, updateFilters, nextPage, prevPage } = useListings()

function handleFilterChange(filters: Record<string, any>) {
  updateFilters(filters)
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl md:text-4xl font-black tracking-tight" style="font-family: var(--font-heading);">
        Explorar listados
      </h1>
      <p class="mt-2" style="color: var(--color-muted);">
        {{ total }} resultado{{ total !== 1 ? 's' : '' }} encontrado{{ total !== 1 ? 's' : '' }}
      </p>
    </div>

    <!-- Filtros -->
    <div class="mb-8">
      <ListingFilters @update:filters="handleFilterChange" />
    </div>

    <!-- Resultados -->
    <ListingGallery :listings="listings" :loading="loading" />

    <!-- Paginación -->
    <div v-if="totalPages > 1" class="mt-12 flex items-center justify-center gap-4">
      <button
        class="btn btn-sm btn-ghost rounded-full"
        :disabled="currentPage <= 1"
        @click="prevPage"
        id="pagination-prev"
      >
        ← Anterior
      </button>
      <span class="text-sm font-medium" style="color: var(--color-muted);">
        Página {{ currentPage }} de {{ totalPages }}
      </span>
      <button
        class="btn btn-sm btn-ghost rounded-full"
        :disabled="currentPage >= totalPages"
        @click="nextPage"
        id="pagination-next"
      >
        Siguiente →
      </button>
    </div>
  </div>
</template>
