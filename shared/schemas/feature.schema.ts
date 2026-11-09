import { z } from 'zod'

export const FeaturePlacementSchema = z.enum(['HERO', 'SIDEBAR', 'BADGE'])
export const FeaturePlanSchema = z.enum(['7d', '30d'])

export const CreateFeatureSchema = z.object({
  listingId: z.string().min(1, 'Anuncio requerido'),
  placement: FeaturePlacementSchema,
  plan: FeaturePlanSchema,
})

export const AdminFeatureActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('confirm'), paymentRef: z.string().trim().min(3, 'La referencia es obligatoria (mín. 3 caracteres)').max(100) }),
  z.object({ action: z.literal('cancel'), reason: z.string().trim().min(3, 'El motivo debe tener entre 3 y 300 caracteres').max(300, 'El motivo debe tener entre 3 y 300 caracteres') }),
])
