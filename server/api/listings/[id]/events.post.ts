// POST /api/listings/:id/events — Evento de analítica anónimo (sesión opcional). Rate limit en middleware.
// No guarda IP ni usuario: solo ListingEvent { listingId, type, value }. El dedupe usa un hash
// con sal diaria que vive en memoria. sendBeacon puede mandar text/plain: se parsea el string.
import { createHash } from 'node:crypto'
import type { H3Event } from 'h3'
import { EventInputSchema } from '~~/shared/schemas/event.schema'
import { CONTACT_CHANNELS, dailySalt, dedupeKey, dedupeWindowMs, normalizeIp, shouldRecord, visitorHash } from '~~/server/lib/analytics'

// ponytail: en memoria, una sola instancia; pasar a Redis si se escala
const seen = new Map<string, number>()
const SWEEP_EVERY_MS = 60_000
const MAX_ENTRIES = 10_000
const MAX_WINDOW_MS = 30 * 60_000
let lastSweep = 0
let warnedNoSecret = false

/** Solo peticiones de la propia web: Sec-Fetch-Site same-origin y/o Origin con nuestro host. */
function sameOrigin(event: H3Event) {
  const site = getRequestHeader(event, 'sec-fetch-site')
  if (site && site !== 'same-origin') return false
  const origin = getRequestHeader(event, 'origin')
  if (!site && !origin) return false
  if (origin) {
    try { return new URL(origin).host === getRequestHost(event) } catch { return false }
  }
  return true
}

export default defineEventHandler(async (event) => {
  if (!sameOrigin(event)) throw createError({ statusCode: 403, statusMessage: 'Origen no permitido' })
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID requerido' })

  let raw: unknown = await readBody(event)
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw) } catch { raw = null }
  }
  const body = parseOr400(EventInputSchema, raw)

  const listing = await prisma.listing.findUnique({ where: { id }, select: { status: true, deletedAt: true, ownerId: true } })
  if (!listing || listing.deletedAt || listing.status !== 'ACTIVE') {
    throw createError({ statusCode: 404, statusMessage: 'Anuncio no encontrado' })
  }

  setResponseStatus(event, 204)

  const session = await auth.api.getSession({ headers: event.headers }).catch(() => null)
  if (session?.user?.id === listing.ownerId) return null

  const channel = body.type === 'CONTACT_CLICK' ? body.channel : undefined
  const windowMs = dedupeWindowMs(body.type, channel)
  if (windowMs > 0) {
    // Sin secreto en producción no hay sal fiable: no se registra (y se avisa una vez)
    const base = process.env.BETTER_AUTH_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'dev')
    const secret = process.env.ANALYTICS_SALT || (base && createHash('sha256').update('analytics:' + base).digest('hex'))
    if (!secret) {
      if (!warnedNoSecret) { warnedNoSecret = true; console.warn('[analytics] ANALYTICS_SALT/BETTER_AUTH_SECRET no definido: no se registran eventos') }
      return null
    }
    const now = Date.now()
    if (now - lastSweep >= SWEEP_EVERY_MS) {
      lastSweep = now
      for (const [k, t] of seen) if (now - t >= MAX_WINDOW_MS) seen.delete(k)
      if (seen.size > MAX_ENTRIES) seen.clear()
    }
    // Solo la IP normalizada (sin UA): cambiar de user agent no rompe el dedupe
    const visitor = visitorHash(normalizeIp(clientIp(event)), '', dailySalt(new Date(now), secret))
    if (!shouldRecord(seen, dedupeKey(visitor, id, body.type, channel), now, windowMs)) return null
  }

  const value = body.type === 'TOUR_TIME' ? body.value : body.type === 'CONTACT_CLICK' ? CONTACT_CHANNELS.indexOf(body.channel) : null
  await prisma.listingEvent.create({ data: { listingId: id, type: body.type, value } })
  return null
})
