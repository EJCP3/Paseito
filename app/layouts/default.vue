<template>
  <div class="min-h-screen bg-[var(--color-surface)] text-black">
    <slot />
    <footer class="px-6 py-6 text-xs text-center" style="color: var(--color-muted);">
      <NuxtLink to="/terminos" class="underline">Términos</NuxtLink>
      <span aria-hidden="true"> · </span>
      <NuxtLink to="/privacidad" class="underline">Privacidad</NuxtLink>
    </footer>
  </div>
</template>
