// Reglas puras de analítica de anuncios (sin Nuxt/Prisma): hash de visitante, dedupe y resumen.
import { createHash } from 'node:crypto'

// El índice en este array es lo que se guarda en ListingEvent.value para CONTACT_CLICK
// (0 whatsapp, 1 instagram, 2 facebook, 3 tiktok, 4 website) — así no hace falta migración.
export const CONTACT_CHANNELS = ['whatsapp', 'instagram', 'facebook', 'tiktok', 'website'] as const
export type ContactChannel = (typeof CONTACT_CHANNELS)[number]
export type TrackedEventType = 'VIEW' | 'CONTACT_CLICK' | 'TOUR_OPEN' | 'TOUR_TIME'

const MIN = 60_000
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

/** Sal que cambia cada día UTC: no permite seguir a nadie entre días y no se guarda en BD. */
export function dailySalt(now: Date, secret: string) {
  return sha256(`${now.toISOString().slice(0, 10)}:${secret}`)
}

/** IPv4 tal cual; IPv6 recortada a su /64 (un cliente rota los últimos 64 bits); ::ffff:a.b.c.d → a.b.c.d. */
export function normalizeIp(ip: string) {
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip)
  if (mapped) return mapped[1]!
  if (!ip.includes(':')) return ip
  const [head = '', tail = ''] = ip.split('::')
  const a = head ? head.split(':') : []
  const b = tail ? tail.split(':') : []
  const groups = ip.includes('::') ? [...a, ...Array(Math.max(0, 8 - a.length - b.length)).fill('0'), ...b] : a
  return groups.slice(0, 4).map((g) => (g || '0').toLowerCase().replace(/^0+(?=.)/, '')).join(':') + '::/64'
}

/** SHA-256 truncado (32 hex) de ip + user agent + sal del día. Solo vive en memoria. */
export function visitorHash(ip: string, userAgent: string, daySalt: string) {
  return sha256(`${daySalt}|${ip}|${userAgent}`).slice(0, 32)
}

export function dedupeKey(visitor: string, listingId: string, type: TrackedEventType, channel?: ContactChannel) {
  return [visitor, listingId, type, type === 'CONTACT_CLICK' ? channel ?? '' : ''].join(':')
}

export function dedupeWindowMs(type: TrackedEventType, _channel?: ContactChannel) {
  if (type === 'CONTACT_CLICK') return 5 * MIN
  return 30 * MIN // VIEW, TOUR_OPEN y TOUR_TIME
}

/** true (y guarda now) si pasó la ventana desde el último registro de esa clave. */
export function shouldRecord(store: Map<string, number>, key: string, now: number, windowMs: number) {
  const last = store.get(key)
  if (last !== undefined && now - last < windowMs) return false
  store.set(key, now)
  return true
}

export interface EventRow {
  type: string
  day: string
  count: number
  sumValue?: number | null
  channelIndex?: number | null
}

export function summarizeEvents(rows: EventRow[]) {
  const byChannel = Object.fromEntries(CONTACT_CHANNELS.map((c) => [c, 0])) as Record<ContactChannel, number>
  const days = new Map<string, { date: string; views: number; contactClicks: number }>()
  let views = 0, contactClicks = 0, tourOpens = 0, tourCount = 0, tourSum = 0

  for (const r of rows) {
    let d = days.get(r.day)
    if (!d) days.set(r.day, (d = { date: r.day, views: 0, contactClicks: 0 }))
    if (r.type === 'VIEW') { views += r.count; d.views += r.count }
    else if (r.type === 'CONTACT_CLICK') {
      contactClicks += r.count; d.contactClicks += r.count
      const ch = CONTACT_CHANNELS[r.channelIndex ?? -1]
      if (ch) byChannel[ch] += r.count
    }
    else if (r.type === 'TOUR_OPEN') tourOpens += r.count
    else if (r.type === 'TOUR_TIME') { tourCount += r.count; tourSum += r.sumValue ?? 0 }
  }

  return {
    views,
    contactClicks,
    tourOpens,
    avgTourSeconds: tourCount ? Math.round(tourSum / tourCount) : 0,
    byChannel,
    byDay: [...days.values()].sort((a, b) => a.date.localeCompare(b.date)),
  }
}

export type EventSummary = ReturnType<typeof summarizeEvents>

/** Retención: borra eventos más viejos que `days` (13 meses ≈ 395). Devuelve cuántos borró. */
export async function purgeOldEvents(
  prisma: { listingEvent: { deleteMany(args: { where: { createdAt: { lt: Date } } }): Promise<{ count: number }> } },
  days = 395,
) {
  const { count } = await prisma.listingEvent.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - days * 24 * 60 * MIN) } } })
  return count
}
