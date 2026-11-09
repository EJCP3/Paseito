// Rate limit por usuario (o IP sin sesión) en rutas de escritura costosas.
// ponytail: en memoria, una sola instancia; pasar a Redis/DB si se escala
import { hit, type RateStore } from '../lib/rateLimit'

const MIN = 60_000
const rules: { id: string; test: (p: string, m: string) => boolean; limit: number; windowMs: number }[] = [
  { id: 'uploads', test: (p) => p.startsWith('/api/uploads'), limit: 60, windowMs: 10 * MIN },
  { id: 'scenes', test: (p, m) => m === 'POST' && /^\/api\/tours\/scenes\/?$/.test(p), limit: 30, windowMs: 10 * MIN },
  { id: 'geocode', test: (p) => p.startsWith('/api/geocode'), limit: 20, windowMs: MIN },
  { id: 'nearby', test: (p) => /^\/api\/listings\/(?:[^/]+\/)?nearby-places/.test(p), limit: 10, windowMs: MIN },
  { id: 'report', test: (p, m) => m === 'POST' && /^\/api\/listings\/[^/]+\/report\/?$/.test(p), limit: 5, windowMs: 60 * MIN },
  { id: 'create', test: (p, m) => m === 'POST' && /^\/api\/listings\/?$/.test(p), limit: 10, windowMs: 60 * MIN },
]
const WRITE = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const store: RateStore = new Map()

export default defineEventHandler(async (event) => {
  if (!WRITE.has(event.method)) return
  const path = getRequestURL(event).pathname
  const rule = rules.find((r) => r.test(path, event.method))
  if (!rule) return

  const session = await auth.api.getSession({ headers: event.headers }).catch(() => null)
  // ponytail: detrás de proxy de confianza, leer la IP más a la derecha de X-Forwarded-For
  const who = session?.user?.id ?? getRequestIP(event) ?? 'unknown'
  const now = Date.now()

  if (store.size > 10_000) for (const [k, v] of store) if (now >= v.resetAt) store.delete(k)

  const r = hit(store, `${rule.id}:${who}`, rule.limit, rule.windowMs, now)
  if (!r.allowed) {
    setResponseHeader(event, 'Retry-After', r.retryAfterSec)
    throw createError({ statusCode: 429, statusMessage: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' })
  }
})
