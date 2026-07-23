<script setup lang="ts">
/**
 * AnnouncementTicker — cintillo horizontal infinito (tipo noticiero) con los
 * anuncios/promos de useAnnouncements(). Todo GSAP corre en cliente (.client.vue),
 * loop vía horizontalLoop() + Observer para modular la velocidad con el scroll.
 */
const { $gsap: gsap, $Observer: Observer } = useNuxtApp()
const { announcements } = useAnnouncements()

// Se repite el set para asegurar que el contenido siempre sea más ancho que
// el viewport (si no, el loop se ve con un hueco vacío antes de reiniciar).
// announcements llega de la API (async): loopItems empieza vacío y se llena
// cuando resuelve el fetch — el watch de más abajo arma el loop en ese momento.
const loopItems = computed(() => [...announcements.value, ...announcements.value, ...announcements.value])

const railRef = ref<HTMLElement | null>(null)
let tl: any = null
let observer: any = null
let resizeTimer: ReturnType<typeof setTimeout> | null = null

/**
 * horizontalLoop — helper estándar de GSAP para animar un grupo de elementos
 * en loop infinito y sin cortes a lo largo del eje X, usando xPercent (así
 * sigue funcionando aunque cambien los anchos, p. ej. al resize).
 * Adaptado tal cual del ejemplo de referencia (gsap.com/docs).
 */
function horizontalLoop(items: HTMLElement[], config: any = {}) {
  items = gsap.utils.toArray(items)
  const tl = gsap.timeline({
    repeat: config.repeat,
    paused: config.paused,
    defaults: { ease: 'none' },
    onReverseComplete: () => tl.totalTime(tl.rawTime() + tl.duration() * 100),
  })
  const length = items.length
  const startX = items[0].offsetLeft
  const widths: number[] = []
  const xPercents: number[] = []
  const pixelsPerSecond = (config.speed || 1) * 100
  const snap = config.snap === false ? (v: number) => v : gsap.utils.snap(config.snap || 1)
  let totalWidth: number, curX: number, distanceToStart: number, distanceToLoop: number, item: HTMLElement, i: number

  gsap.set(items, {
    xPercent: (i: number, el: HTMLElement) => {
      const w = (widths[i] = parseFloat(gsap.getProperty(el, 'width', 'px')))
      xPercents[i] = snap(
        (parseFloat(gsap.getProperty(el, 'x', 'px')) / w) * 100 + gsap.getProperty(el, 'xPercent')
      )
      return xPercents[i]
    },
  })
  gsap.set(items, { x: 0 })
  totalWidth =
    items[length - 1].offsetLeft +
    (xPercents[length - 1] / 100) * widths[length - 1] -
    startX +
    items[length - 1].offsetWidth * gsap.getProperty(items[length - 1], 'scaleX') +
    (parseFloat(config.paddingRight) || 0)

  for (i = 0; i < length; i++) {
    item = items[i]
    curX = (xPercents[i] / 100) * widths[i]
    distanceToStart = item.offsetLeft + curX - startX
    distanceToLoop = distanceToStart + widths[i] * gsap.getProperty(item, 'scaleX')
    tl.to(
      item,
      { xPercent: snap((curX - distanceToLoop) / widths[i] * 100), duration: distanceToLoop / pixelsPerSecond },
      0
    )
      .fromTo(
        item,
        { xPercent: snap((curX - distanceToLoop + totalWidth) / widths[i] * 100) },
        {
          xPercent: xPercents[i],
          duration: (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond,
          immediateRender: false,
        },
        distanceToLoop / pixelsPerSecond
      )
  }
  tl.progress(1, true).progress(0, true) // pre-render, evita el salto inicial
  return tl
}

function buildLoop() {
  if (!railRef.value) return
  const items = gsap.utils.toArray('.ticker-unit', railRef.value) as HTMLElement[]
  if (!items.length) return
  tl = horizontalLoop(items, { repeat: -1, speed: 0.5, paddingRight: 0 })

  // El scroll del mouse/trackpad acelera momentáneamente el ticker y luego
  // vuelve a su velocidad base — puramente decorativo, el loop sigue solo.
  observer = Observer.create({
    onChangeY(self: any) {
      const factor = self.deltaY < 0 ? -2.5 : 2.5
      gsap
        .timeline({ defaults: { ease: 'none' } })
        .to(tl, { timeScale: factor * 2.5, duration: 0.2, overwrite: true })
        .to(tl, { timeScale: factor / 2.5, duration: 1 }, '+=0.3')
    },
  })
}

function destroyLoop() {
  tl?.kill()
  tl = null
  observer?.kill()
  observer = null
}

function onResize() {
  if (resizeTimer) clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    destroyLoop()
    buildLoop()
  }, 200)
}

function pause() {
  tl?.pause()
}
function resume() {
  tl?.play()
}

// La data real llega async: arma (o rearma) el loop apenas hay anuncios.
watch(
  () => loopItems.value.length,
  async (len) => {
    destroyLoop()
    if (!len) return
    await nextTick()
    buildLoop()
  }
)

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  if (resizeTimer) clearTimeout(resizeTimer)
  destroyLoop()
})
</script>

<template>
  <div
    class="fixed bottom-0 left-0 right-0 z-[1150] w-full h-9 bg-black overflow-hidden flex items-center select-none"
    @mouseenter="pause"
    @mouseleave="resume"
  >
    <div ref="railRef" class="flex items-center will-change-transform">
      <div v-for="(item, i) in loopItems" :key="i" class="ticker-unit flex items-center flex-shrink-0 pr-8">
        <NuxtLink v-if="item.link" :to="item.link" class="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
          <span class="font-bold uppercase text-[10px] sm:text-[11px] tracking-wide text-white whitespace-nowrap">{{ item.title }}</span>
          <span class="text-[10px] sm:text-[11px] text-white/60 whitespace-nowrap">{{ item.description }}</span>
        </NuxtLink>
        <span v-else class="flex items-center gap-2">
          <span class="font-bold uppercase text-[10px] sm:text-[11px] tracking-wide text-white whitespace-nowrap">{{ item.title }}</span>
          <span class="text-[10px] sm:text-[11px] text-white/60 whitespace-nowrap">{{ item.description }}</span>
        </span>
        <span class="ml-6 text-xs leading-none" style="color: var(--color-neon);" aria-hidden="true">&bull;</span>
      </div>
    </div>
  </div>
</template>
