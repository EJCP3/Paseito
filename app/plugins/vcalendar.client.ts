// Plugin client-only — v-calendar (calendario de disponibilidad de villas)
// Se registra solo en el navegador para evitar errores de SSR (ResizeObserver, etc.)
import VCalendar from 'v-calendar'
import 'v-calendar/style.css'

export default defineNuxtPlugin((nuxtApp) => {
  // componentPrefix: '' registra los componentes como <Calendar>/<DatePicker>
  // (por defecto v-calendar usa el prefijo 'V' → <VCalendar>/<VDatePicker>, que
  // no coincidían con lo usado en las plantillas y renderizaban vacío).
  nuxtApp.vueApp.use(VCalendar, { componentPrefix: '' })
})
