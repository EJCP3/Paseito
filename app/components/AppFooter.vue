<script setup lang="ts">
/**
 * AppFooter — Footer del sitio
 * Links de navegación, redes sociales, copyright
 */
const currentYear = new Date().getFullYear()

const footerLinks = [
  {
    title: 'Producto',
    links: [
      { label: 'Explorar anuncios', to: '/buscar' },
      { label: 'Publicar', to: '/publicar' },
      { label: 'Tours 360°', to: '/buscar' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Sobre nosotros', to: '#' },
      { label: 'Contacto', to: '#' },
      { label: 'Blog', to: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Términos de servicio', to: '#' },
      { label: 'Privacidad', to: '#' },
      { label: 'Cookies', to: '#' },
    ],
  },
]
</script>

<template>
  <footer class="border-t border-gray-100 mt-auto" style="background: var(--color-surface);">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="grid grid-cols-2 md:grid-cols-5 gap-8">
        <!-- Brand -->
        <div class="col-span-2">
          <NuxtLink to="/" class="flex items-center gap-2 mb-4 group">
          <Icon name="footstepsSolid" width="24" height="24" stroke="none" class="text-black group-hover:text-gray-700 transition-colors" />
            <span class="text-xl font-bold tracking-tight text-black" style="font-family: var(--font-body);">
              Paseito
            </span>
          </NuxtLink>
          <p class="text-sm max-w-xs" style="color: var(--color-muted);">
            Explora tu próximo espacio con tours virtuales 360°.
            Apartamentos, casas y vehículos al alcance de un clic.
          </p>
        </div>

        <!-- Links columns -->
        <div v-for="section in footerLinks" :key="section.title">
          <h3 class="text-sm font-bold mb-4" style="font-family: var(--font-heading);">
            {{ section.title }}
          </h3>
          <ul class="space-y-2">
            <li v-for="link in section.links" :key="link.label">
              <NuxtLink
                :to="link.to"
                class="text-sm transition-colors duration-200 hover:text-black"
                style="color: var(--color-muted);"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom bar -->
      <div class="border-t border-gray-100 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p class="text-xs" style="color: var(--color-muted-light);">
          © {{ currentYear }} Paseito. Todos los derechos reservados.
        </p>
        <div class="flex items-center gap-4">
          <a href="#" class="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Instagram">
            <Icon name="instagram" class="w-5 h-5" stroke="none" />
          </a>
          <a href="#" class="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Twitter">
            <Icon name="brandX" class="w-5 h-5" stroke="none" />
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>
