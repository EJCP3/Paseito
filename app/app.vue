<script setup lang="ts">
const route = useRoute()
// Fixed al fondo del viewport (no en el flujo del documento): si estuviera en
// flujo normal, mostrar/ocultar el ticker cambia la altura de la página justo
// cuando arranca una navegación y el navegador reajusta el scroll de golpe
// (se sentía como que la página "saltaba" al hacer click en un anuncio).
// Tampoco tiene sentido dentro del detalle de un anuncio (visor 360°), ni en
// cuenta/publicar (pantallas de formulario, no de exploración).
const HIDDEN_TICKER_PREFIXES = ['/anuncio/', '/cuenta', '/publicar']
const showTicker = computed(() => !HIDDEN_TICKER_PREFIXES.some((prefix) => route.path.startsWith(prefix)))
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Transition enter-active-class="transition-opacity duration-300" enter-from-class="opacity-0" leave-active-class="transition-opacity duration-150" leave-to-class="opacity-0">
    <AnnouncementTicker v-if="showTicker" />
  </Transition>
  <LoginModal />
  <SignupModal />
  <canvas id="glimm-canvas" class="fixed inset-0 w-screen h-screen z-[9999] pointer-events-none" />
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.25s ease;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>
