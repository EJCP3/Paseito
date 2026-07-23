<script setup lang="ts">
/**
 * Icon — único componente de ícono del proyecto.
 * Todo el contenido vive en assets/icons/index.ts; este componente solo lo
 * inyecta. currentColor + stroke se heredan del contexto (texto/color de la
 * clase); pasar class="w-5 h-5" para el tamaño. Los íconos de marca (fill
 * explícito) se sobreescriben ellos solos vía su propio atributo fill/stroke.
 */
import { icons } from '~/assets/icons'

defineProps<{ name: string }>()
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    v-bind="$attrs"
    v-html="icons[name]"
  />
</template>
