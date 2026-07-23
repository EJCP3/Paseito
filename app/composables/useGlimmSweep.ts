import { createShader, playSweep, accentPair, type ShaderController } from 'glimm'

// Paleta del sitio en tonos claros (verde neón claro + superficie clara, ver
// main.css) — el negro contra el verde se veía muy duro, esto es más suave.
const paseitoPalette = accentPair('#E0FF66', '#F8F8F8')

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

export function useGlimmSweep() {
  function sweep(onMidpoint: () => void | Promise<void>) {
    if (ctrl === undefined) {
      const canvas = document.getElementById('glimm-canvas') as HTMLCanvasElement | null
      ctrl = canvas ? createShader({ canvas }) : null
    }

    if (!ctrl) {
      onMidpoint()
      return
    }

    // El contenido se cambia a media pasada (midpoint ~0.5), cuando la franja
    // cubre el centro del viewport: así la franja enmascara el cambio y su borde
    // de salida va descubriendo la página nueva. Barrido algo lento para que se
    // sienta que la página pasa "a través" de la animación, no un parpadeo.
    playSweep(ctrl, { palette: paseitoPalette, sweepMs: 900, outroMs: 450, midpoint: 0.5, onMidpoint })
  }

  return { sweep }
}
