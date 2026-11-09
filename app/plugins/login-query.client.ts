// Abre el login cuando el middleware `auth` redirige a /?login=<ruta>.
export default defineNuxtPlugin(() => {
  const route = useRoute()
  const target = route.query.login
  if (typeof target !== 'string') return
  // Solo rutas internas como destino tras el login
  useAuth().openLogin(/^\/(?![/\\])/.test(target) ? target : undefined)
  navigateTo({ path: route.path, query: { ...route.query, login: undefined } }, { replace: true })
})
