// Schema de validación Zod — Geocoding
import { z } from 'zod'

export const GeocodeSchema = z.object({
  address: z.string().min(3).max(200),
})

export type GeocodeInput = z.infer<typeof GeocodeSchema>
