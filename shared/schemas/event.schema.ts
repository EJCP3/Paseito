// Schema Zod — evento de analítica (cliente y POST /api/listings/:id/events)
import { z } from 'zod'

export const CONTACT_CHANNEL_NAMES = ['whatsapp', 'instagram', 'facebook', 'tiktok', 'website'] as const

// SCHEDULE_CLICK queda reservado: el cliente no puede enviarlo.
export const EventInputSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('VIEW') }),
  z.strictObject({ type: z.literal('TOUR_OPEN') }),
  z.strictObject({
    type: z.literal('TOUR_TIME'),
    value: z.number().int().min(1).transform((v) => Math.min(v, 3600)),
  }),
  z.strictObject({ type: z.literal('CONTACT_CLICK'), channel: z.enum(CONTACT_CHANNEL_NAMES) }),
])

export type EventInput = z.infer<typeof EventInputSchema>
