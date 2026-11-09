// Schemas de validación Zod — Puntos de interés cercanos
import { z } from 'zod'

export const NearbyPlaceCategorySchema = z.enum([
  'supermarket',
  'store',
  'pharmacy',
  'school',
  'transit',
  'bank',
])

export const NearbyPlaceResultSchema = z.object({
  name: z.string(),
  category: NearbyPlaceCategorySchema,
  distanceM: z.number().int().min(0),
  lat: z.number(),
  lng: z.number(),
})

// Input común a los endpoints de detección: coordenadas del listado y,
// opcionalmente, nombres de POIs que el dueño ya descartó en el preview.
export const NearbyPlacesQuerySchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  excludeNames: z.array(z.string().max(120)).max(30).optional(),
})

export type NearbyPlaceCategory = z.infer<typeof NearbyPlaceCategorySchema>
export type NearbyPlaceResult = z.infer<typeof NearbyPlaceResultSchema>
export type NearbyPlacesQueryInput = z.infer<typeof NearbyPlacesQuerySchema>
