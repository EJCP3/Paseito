// Schema de validación Zod — Geocoding
import { z } from 'zod'

export const GeocodeSchema = z.object({
  address: z.string().min(3).max(200),
})

// Link de Google Maps (share link corto tipo maps.app.goo.gl o URL completa)
// que el dueño pega para ubicar su propiedad sin arrastrar el pin a mano.
export const GoogleMapsLinkSchema = z.object({
  url: z.string().url().max(500),
})

export type GeocodeInput = z.infer<typeof GeocodeSchema>
export type GoogleMapsLinkInput = z.infer<typeof GoogleMapsLinkSchema>
