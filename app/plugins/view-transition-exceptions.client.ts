// El sweep de glimm (salida del detalle de anuncio) ya cubre y descubre la
// página con su propio canvas; la View Transition nativa toma su propia
// foto/cross-fade en paralelo y termina antes que glimm, así que se veía
// "asomar" un fondo blanco y la página nueva aparecía antes de tiempo.
// Apagamos la View Transition solo para esa navegación puntual (mutar
// to.meta acá corre en beforeEach, que Vue Router siempre resuelve antes
// que el beforeResolve del plugin de Nuxt que decide si la usa o no).
export default defineNuxtPlugin(() => {
  const router = useRouter()
  router.beforeEach((to, from) => {
    if (from.path.startsWith('/anuncio/')) {
      to.meta.viewTransition = false
    }

    // Mismo conflicto pero en la dirección contraria: publicar/tour.vue entra
    // al detalle recién creado disparando el sweep manualmente (ver
    // publishListing). Sin esto, la View Transition nativa compite con el
    // sweep por el mismo swap de DOM y la navegación queda inconsistente.
    if (to.path.startsWith('/anuncio/') && from.path.startsWith('/publicar')) {
      to.meta.viewTransition = false
    }
  })
})
