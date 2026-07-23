// Schemas de validación Zod — Favoritos
import { z } from 'zod'

export const ToggleFavoriteSchema = z.object({
  listingId: z.string().min(1, 'listingId requerido'),
})
