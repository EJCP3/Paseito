// Parseo Zod que responde 400 (no 500) con el primer mensaje de error
import type { ZodType } from 'zod'

export function parseOr400<T>(schema: ZodType<T>, input: unknown): T {
  const r = schema.safeParse(input)
  if (!r.success) {
    throw createError({
      statusCode: 400,
      statusMessage: r.error.issues[0]?.message || 'Datos inválidos',
    })
  }
  return r.data
}
