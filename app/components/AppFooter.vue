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
      { label: 'Explorar listados', to: '/buscar' },
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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-black group-hover:text-gray-700 transition-colors">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M11.966 22.028a.747.747 0 01-.137-1.042c1.472-1.895 2.502-3.824 3.013-5.596.505-1.751.528-3.411.025-4.887a1.144 1.144 0 00-.022-.06l-.008-.02a3.841 3.841 0 01-.157-.457c-.171-.58-.337-1.393.003-2.316C15.006 6.784 15.688 6 17 6c1.026 0 1.942.545 2.56 1.39.61.835.94 1.954.94 3.11 0 1.155-.33 2.274-.94 3.11-.62.846-1.536 1.39-2.56 1.39-.444 0-.847-.123-1.196-.32.062.593.037 1.258-.112 1.922-.387 1.722-1.189 3.497-2.616 5.378a.75.75 0 01-1.11.047zM17.5 13.5c.783 0 1.458-.426 1.92-1.057.452-.619.69-1.424.69-2.222 0-1.052-.401-2.008-1.082-2.735C18.358 6.771 17.502 6 17 6c-.347 0-.585.148-.711.365-.121.209-.153.518-.046.883a4.707 4.707 0 00.323.834c.548 1.168.807 2.68.213 4.417a8.558 8.558 0 01-.849 1.838A2.697 2.697 0 0017 13.5zm-5.419 6.275a.75.75 0 01-1.02-.294c-1.637-2.883-2.62-5.736-2.92-8.232-.303-2.528.271-4.801 1.758-6.666C10.748 3.517 11.967 2.5 13.5 2.5c1.196 0 2.274.52 3.064 1.385a.75.75 0 11-1.106 1.015c-.569-.621-1.341-.9-2.072-.9-1.22 0-2.195.836-2.85 1.658C9.37 7.087 8.89 8.926 9.155 11.13c.264 2.203 1.144 4.8 2.632 7.42a.75.75 0 01-.294 1.021z" fill="currentColor"/>
          </svg>
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
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          <a href="#" class="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Twitter">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>
