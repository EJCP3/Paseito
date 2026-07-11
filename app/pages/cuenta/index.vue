<script setup lang="ts">
/**
 * Página de cuenta — Perfil del usuario y sus listados
 */
useHead({ title: 'Mi cuenta — Paseito' })
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8 md:py-12">
    <h1 class="text-3xl font-black tracking-tight mb-2" style="font-family: var(--font-heading);">
      Mi cuenta
    </h1>
    <p class="mb-8" style="color: var(--color-muted);">
      Gestiona tu perfil y listados publicados
    </p>

    <!-- Profile card -->
    <div class="card-paseito p-6 mb-8">
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-full flex items-center justify-center text-2xl" style="background: var(--color-neon);">
          👤
        </div>
        <div>
          <h2 class="text-xl font-bold" style="font-family: var(--font-heading);">Usuario Demo</h2>
          <p class="text-sm" style="color: var(--color-muted);">demo@paseito.com</p>
        </div>
      </div>
    </div>

    <!-- My listings -->
    <div>
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold" style="font-family: var(--font-heading);">Mis listados</h2>
        <NuxtLink to="/publicar" class="btn btn-sm btn-neon">
          + Nuevo listado
        </NuxtLink>
      </div>

      <div class="text-center py-16 rounded-2xl" style="background: var(--color-surface); border: 2px dashed var(--color-border);">
        <p class="text-5xl mb-4">📋</p>
        <p class="font-bold" style="font-family: var(--font-heading);">No tienes listados aún</p>
        <p class="text-sm mt-1 mb-6" style="color: var(--color-muted);">
          Publica tu primera propiedad o vehículo con tour 360°
        </p>
        <NuxtLink to="/publicar" class="btn btn-neon">
          Publicar ahora
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
