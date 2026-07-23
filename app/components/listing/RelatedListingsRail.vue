<script setup lang="ts">
/**
 * RelatedListingsRail — Otros anuncios activos en la página de detalle
 * Desktop: dock vertical flotante (mismo magnify-on-hover que app/pages/producto/[id].vue).
 * Móvil: carrusel horizontal al final de la página.
 * Si no hay otros anuncios, no se renderiza nada (sin hueco vacío).
 */
const props = defineProps<{ excludeId: string }>()

const { $gsap: gsap } = useNuxtApp()

// Sin await: un componente async (top-level await) suspende la hidratación de
// toda la página y los componentes .client (TourViewer) nunca llegan a montar.
const { data } = useFetch('/api/listings', {
  query: { excludeId: props.excludeId, limit: 6 },
  lazy: true,
})
const related = computed<any[]>(() => (data.value as any)?.data ?? [])

function coverImage(l: any) {
  return l.photos?.[0]?.thumbUrl || l.photos?.[0]?.url || l.scenes?.[0]?.previewUrl || '/images/portada1.webp'
}

// macOS Dock magnify-on-hover — mismo cálculo que app/pages/producto/[id].vue
const dockRef = ref<HTMLElement | null>(null)
let dockIcons: NodeListOf<HTMLElement> | null = null
let lastPointerY = -9999

const updateDockIconsPosition = () => {
  if (!dockRef.value || !dockIcons || dockIcons.length === 0) return
  if (lastPointerY === -9999) return

  const min = 88 // 72px height + 16px gap
  const max = 130 // max scale size
  const bound = min * Math.PI

  for (let i = 0; i < dockIcons.length; i++) {
    const icon = dockIcons[i]
    const iconCenterY = dockRef.value.getBoundingClientRect().top - dockRef.value.scrollTop + icon.offsetTop + icon.offsetHeight / 2
    const distance = iconCenterY - lastPointerY

    let y = 0
    let scale = 1

    if (-bound < distance && distance < bound) {
      const rad = distance / min * 0.5
      scale = 1 + (max / min - 1) * Math.cos(rad)
      y = 1.5 * (max - min) * Math.sin(rad)
    } else {
      y = (-bound < distance ? 1.5 : -1.5) * (max - min)
    }

    gsap.to(icon, { duration: 0.3, y, scale, transformOrigin: '100% 50%' })
  }
}

const handleDockMove = (event: MouseEvent) => {
  if (!dockRef.value) return
  if (!dockIcons || dockIcons.length === 0) {
    dockIcons = dockRef.value.querySelectorAll('.thumbnail-item')
  }
  if (!dockIcons || dockIcons.length === 0) return

  lastPointerY = event.clientY
  updateDockIconsPosition()
}

const handleDockLeave = () => {
  if (!dockIcons) return
  lastPointerY = -9999
  gsap.to(dockIcons, { duration: 0.3, scale: 1, y: 0 })
}
</script>

<template>
  <div v-if="related.length" id="related-listings-rail" class="h-full">
    <div
      ref="dockRef"
      class="flex flex-row lg:flex-col gap-3 lg:gap-4 items-center lg:justify-center lg:h-full overflow-x-auto lg:overflow-visible no-scrollbar pb-2 lg:pb-0"
      @mousemove="handleDockMove"
      @mouseleave="handleDockLeave"
    >
      <NuxtLink
        v-for="l in related"
        :key="l.id"
        :to="`/anuncio/${l.slug}`"
        class="w-[72px] h-[72px] rounded-3xl cursor-pointer flex-shrink-0 p-3 thumbnail-item"
      >
        <img :src="coverImage(l)" :alt="l.title" class="w-full h-full object-contain mix-blend-multiply" loading="lazy" />
      </NuxtLink>
    </div>
  </div>
</template>
