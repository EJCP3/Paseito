<script setup lang="ts">
// Estado vacío reutilizable: mensaje + acción opcional (p. ej. "Quitar filtros").
defineProps<{ title: string; text?: string; actionLabel?: string }>()
defineEmits<{ action: [] }>()
</script>

<template>
  <div class="w-full py-20 text-center" role="status">
    <p class="text-lg font-bold" style="font-family: var(--font-heading);">{{ title }}</p>
    <p v-if="text" class="text-sm mt-1" style="color: var(--color-muted);">{{ text }}</p>
    <button v-if="actionLabel" type="button" class="btn btn-neon mt-5" @click="$emit('action')">
      {{ actionLabel }}
    </button>
  </div>
</template>
