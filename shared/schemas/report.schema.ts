// Schema Zod — reporte de anuncio (cliente y POST /api/listings/:id/report)
import { z } from 'zod'

export const REPORT_REASONS = ['SPAM', 'FRAUD', 'INAPPROPRIATE', 'MISLEADING_PRICE', 'OTHER'] as const

export const ReportInputSchema = z
  .object({
    reason: z.enum(REPORT_REASONS, { error: 'Elige un motivo' }),
    details: z.string().trim().max(1000, 'Máximo 1000 caracteres').optional(),
  })
  .refine((v) => v.reason !== 'OTHER' || !!v.details, {
    path: ['details'],
    message: 'Cuéntanos qué ocurre',
  })

export type ReportInput = z.infer<typeof ReportInputSchema>
