// Schemas de validación Zod — Disponibilidad de villas (alquiler por día)
import { z } from 'zod'

export const AvailabilityStatusSchema = z.enum(['AVAILABLE', 'BLOCKED', 'BOOKED'])

export const UpsertAvailabilityRangeSchema = z
  .object({
    id: z.string().optional(), // presente = editar un rango existente
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    status: AvailabilityStatusSchema.default('AVAILABLE'),
  })
  .refine((data) => data.startDate < data.endDate, {
    message: 'La fecha de inicio debe ser anterior a la fecha de fin',
    path: ['endDate'],
  })

export type UpsertAvailabilityRangeInput = z.infer<typeof UpsertAvailabilityRangeSchema>
