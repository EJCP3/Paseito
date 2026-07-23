<script setup lang="ts">
/**
 * AppNavbar — Barra de navegación principal
 * Estética Robinhood: minimalista, tipografía bold, sticky
 */
const isMenuOpen = ref(false)
const showAccountMenu = ref(false)
const accountMenuRef = ref<HTMLElement | null>(null)

const { user, isAuthenticated, openLogin, goOrLogin, signOut } = useAuth()

const initials = computed(() => {
  const name = user.value?.name?.trim()
  if (!name) return '?'
  const parts = name.split(/\s+/)
  return parts.length > 1
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
})

function onDocumentClick(e: MouseEvent) {
  if (accountMenuRef.value && !accountMenuRef.value.contains(e.target as Node)) {
    showAccountMenu.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', onDocumentClick))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocumentClick))

async function handleSignOut() {
  showAccountMenu.value = false
  await signOut()
}

const navLinks = [
  { label: 'Explorar', to: '/buscar', id: 'nav-explorar' },
]
</script>

<template>
  <header class="fixed top-0 left-0 right-0 z-50 glass border-b border-black/5">
    <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-2 group" id="nav-logo">
          <Icon name="footstepsSolid" width="24" height="24" stroke="none" class="text-black group-hover:text-gray-700 transition-colors" />
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
        <div class="hidden md:flex items-center gap-4">
          <NuxtLink v-if="!isAuthenticated" to="#" class="text-sm font-semibold text-gray-700 hover:text-black transition-colors" id="nav-login" @click.prevent="openLogin()">
            Iniciar sesión
          </NuxtLink>

          <div v-else ref="accountMenuRef" class="relative">
            <button
              class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
              style="background: var(--color-neon); color: #0D0D0D;"
              id="nav-account-toggle"
              @click="showAccountMenu = !showAccountMenu"
            >
              {{ initials }}
            </button>

            <Transition
              enter-active-class="transition duration-150 ease-out"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition duration-100 ease-in"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showAccountMenu" class="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-black/5 py-2 z-50">
                <NuxtLink to="/cuenta" class="block px-4 py-2 text-sm font-medium hover:bg-gray-50" @click="showAccountMenu = false">
                  Mis publicaciones
                </NuxtLink>
                <NuxtLink to="/cuenta" class="block px-4 py-2 text-sm font-medium hover:bg-gray-50" @click="showAccountMenu = false">
                  Editar perfil
                </NuxtLink>
                <button class="w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50" @click="handleSignOut">
                  Cerrar sesión
                </button>
              </div>
            </Transition>
          </div>

          <button class="btn btn-sm btn-neon text-sm" id="nav-publicar-cta" @click="goOrLogin('/publicar')">
            + Publicar
          </button>
        </div>

        <!-- Mobile Menu Button -->
        <button
          class="md:hidden btn btn-sm btn-ghost btn-square"
          id="nav-menu-toggle"
          @click="isMenuOpen = !isMenuOpen"
          :aria-label="isMenuOpen ? 'Cerrar menú' : 'Abrir menú'"
        >
          <Icon :name="isMenuOpen ? 'close' : 'menu'" class="h-5 w-5" />
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
              <template v-if="!isAuthenticated">
                <button class="btn btn-sm btn-ghost rounded-full justify-start" @click="openLogin(); isMenuOpen = false">
                  Iniciar sesión
                </button>
              </template>
              <template v-else>
                <NuxtLink to="/cuenta" class="btn btn-sm btn-ghost rounded-full justify-start" @click="isMenuOpen = false">
                  Mis publicaciones
                </NuxtLink>
                <NuxtLink to="/cuenta" class="btn btn-sm btn-ghost rounded-full justify-start" @click="isMenuOpen = false">
                  Editar perfil
                </NuxtLink>
                <button class="btn btn-sm btn-ghost rounded-full justify-start" @click="handleSignOut(); isMenuOpen = false">
                  Cerrar sesión
                </button>
              </template>
              <button class="btn btn-sm btn-neon" @click="goOrLogin('/publicar'); isMenuOpen = false">
                + Publicar
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </nav>
  </header>
</template>
