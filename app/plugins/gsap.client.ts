// Plugin client-only — GSAP + ScrollTrigger + Flip
// Se registra solo en el navegador para evitar errores de SSR
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Flip } from 'gsap/Flip'

export default defineNuxtPlugin(() => {
  // Registrar plugins de GSAP
  gsap.registerPlugin(ScrollTrigger, Flip)

  return {
    provide: {
      gsap,
      ScrollTrigger,
      Flip,
    },
  }
})
