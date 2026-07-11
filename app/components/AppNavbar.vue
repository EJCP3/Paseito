<script setup lang="ts">
/**
 * AppNavbar — Barra de navegación principal
 * Estética Robinhood: minimalista, tipografía bold, sticky
 */
const isMenuOpen = ref(false)

const navLinks = [
  { label: 'Explorar', to: '/buscar', id: 'nav-explorar' },
  { label: 'Publicar', to: '/publicar', id: 'nav-publicar' },
]
</script>

<template>
  <header class="fixed top-0 left-0 right-0 z-50 glass border-b border-black/5">
    <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-2 group" id="nav-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-black group-hover:text-gray-700 transition-colors">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M11.966 22.028a.747.747 0 01-.137-1.042c1.472-1.895 2.502-3.824 3.013-5.596.505-1.751.528-3.411.025-4.887a1.144 1.144 0 00-.022-.06l-.008-.02a3.841 3.841 0 01-.157-.457c-.171-.58-.337-1.393.003-2.316C15.006 6.784 15.688 6 17 6c1.026 0 1.942.545 2.56 1.39.61.835.94 1.954.94 3.11 0 1.155-.33 2.274-.94 3.11-.62.846-1.536 1.39-2.56 1.39-.444 0-.847-.123-1.196-.32.062.593.037 1.258-.112 1.922-.387 1.722-1.189 3.497-2.616 5.378a.75.75 0 01-1.11.047zM17.5 13.5c.783 0 1.458-.426 1.92-1.057.452-.619.69-1.424.69-2.222 0-1.052-.401-2.008-1.082-2.735C18.358 6.771 17.502 6 17 6c-.347 0-.585.148-.711.365-.121.209-.153.518-.046.883a4.707 4.707 0 00.323.834c.548 1.168.807 2.68.213 4.417a8.558 8.558 0 01-.849 1.838A2.697 2.697 0 0017 13.5zm-5.419 6.275a.75.75 0 01-1.02-.294c-1.637-2.883-2.62-5.736-2.92-8.232-.303-2.528.271-4.801 1.758-6.666C10.748 3.517 11.967 2.5 13.5 2.5c1.196 0 2.274.52 3.064 1.385a.75.75 0 11-1.106 1.015c-.569-.621-1.341-.9-2.072-.9-1.22 0-2.195.836-2.85 1.658C9.37 7.087 8.89 8.926 9.155 11.13c.264 2.203 1.144 4.8 2.632 7.42a.75.75 0 01-.294 1.021z" fill="currentColor"/>
          </svg>
          <span class="text-xl font-bold tracking-tight text-black" style="font-family: var(--font-body);">
            Paseito
          </span>
        </NuxtLink>

        <!-- Desktop Nav -->
        <div class="hidden md:flex items-center gap-8">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            :id="link.id"
            class="text-sm font-semibold text-gray-700 hover:text-black transition-colors duration-200"
            active-class="!text-black"
          >
            {{ link.label }}
          </NuxtLink>
        </div>

        <!-- Desktop Actions -->
        <div class="hidden md:flex items-center gap-3">
          <NuxtLink to="/cuenta" class="btn btn-sm btn-ghost rounded-full text-sm font-semibold" id="nav-cuenta">
            Mi cuenta
          </NuxtLink>
          <NuxtLink to="/publicar" class="btn btn-sm btn-neon text-sm" id="nav-publicar-cta">
            Publicar gratis
          </NuxtLink>
        </div>

        <!-- Mobile Menu Button -->
        <button
          class="md:hidden btn btn-sm btn-ghost btn-square"
          id="nav-menu-toggle"
          @click="isMenuOpen = !isMenuOpen"
          :aria-label="isMenuOpen ? 'Cerrar menú' : 'Abrir menú'"
        >
          <svg v-if="!isMenuOpen" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Mobile Menu -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div v-if="isMenuOpen" class="md:hidden pb-4 border-t border-gray-100 mt-2 pt-4">
          <div class="flex flex-col gap-2">
            <NuxtLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg"
              @click="isMenuOpen = false"
            >
              {{ link.label }}
            </NuxtLink>
            <div class="border-t border-gray-100 mt-2 pt-2 px-4 flex flex-col gap-2">
              <NuxtLink to="/cuenta" class="btn btn-sm btn-ghost rounded-full justify-start" @click="isMenuOpen = false">
                Mi cuenta
              </NuxtLink>
              <NuxtLink to="/publicar" class="btn btn-sm btn-neon" @click="isMenuOpen = false">
                Publicar gratis
              </NuxtLink>
            </div>
          </div>
        </div>
      </Transition>
    </nav>
  </header>
</template>
