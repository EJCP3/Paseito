import type { ShaderController } from 'glimm'

// Paleta del sitio en tonos claros (verde neón claro + superficie clara, ver
// main.css) — el negro contra el verde se veía muy duro, esto es más suave.
let ctrl: ShaderController | null | undefined

// Espera a que una imagen cargue antes de continuar (para no revelar la página
// nueva a medio pintar). Con tope de tiempo: una imagen lenta o rota no debe
// dejar la animación congelada.
export function preloadImage(url?: string | null, timeoutMs = 2000): Promise<void> {
  if (!url) return Promise.resolve()
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = url
    setTimeout(resolve, timeoutMs)
  })
}

// Precarga el módulo de glimm en idle para que el primer sweep no espere la red.
export function prefetchGlimm() {
  if (!import.meta.client) return
  const load = () => { import('glimm').catch(() => {}) }
  if ('requestIdleCallback' in window) window.requestIdleCallback(load)
  else setTimeout(load, 1500)
}

export function useGlimmSweep() {
  // Nunca deja la navegación sin ejecutar: si glimm falla o no hay canvas,
  // se navega igualmente (sin animación).
  async function sweep(onMidpoint: () => void | Promise<void>) {
    try {
      const { createShader, playSweep, accentPair } = await import('glimm')
      if (ctrl === undefined) {
        const canvas = document.getElementById('glimm-canvas') as HTMLCanvasElement | null
        ctrl = canvas ? createShader({ canvas }) : null
      }
      if (ctrl) {
        // El contenido se cambia a media pasada (midpoint ~0.5), cuando la franja
        // cubre el centro del viewport: así la franja enmascara el cambio y su borde
        // de salida va descubriendo la página nueva.
        playSweep(ctrl, { palette: accentPair('#E0FF66', '#F8F8F8'), sweepMs: 900, outroMs: 450, midpoint: 0.5, onMidpoint })
        return
      }
    } catch {
      ctrl = null
    }
    await onMidpoint()
  }

  return { sweep }
}
